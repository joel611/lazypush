use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::{BufRead, BufReader, Write};
use std::process::{Child, ChildStdin, ChildStdout, Command, Stdio};
use std::sync::Mutex;
use std::time::Duration;

lazy_static::lazy_static! {
    static ref SIDECAR_PROCESSES: Mutex<HashMap<String, SidecarProcess>> = Mutex::new(HashMap::new());
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SidecarRequest {
    pub action: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub project_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub service_account_path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tokens: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<serde_json::Value>,
}

#[derive(Serialize, Deserialize, Debug)]
pub struct SidecarResponse {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<serde_json::Value>,
}

pub struct SidecarProcess {
    child: Child,
    stdin: ChildStdin,
    stdout: BufReader<ChildStdout>,
}

impl SidecarProcess {
    fn new(mut child: Child) -> Result<Self, String> {
        let stdin = child
            .stdin
            .take()
            .ok_or_else(|| "Failed to open stdin".to_string())?;
        let stdout = child
            .stdout
            .take()
            .ok_or_else(|| "Failed to open stdout".to_string())?;

        let stdout = BufReader::new(stdout);

        Ok(Self {
            child,
            stdin,
            stdout,
        })
    }

    fn send_request(&mut self, request: &SidecarRequest) -> Result<(), String> {
        let json = serde_json::to_string(request)
            .map_err(|e| format!("Failed to serialize request: {}", e))?;

        writeln!(self.stdin, "{}", json)
            .map_err(|e| format!("Failed to write to stdin: {}", e))?;

        self.stdin
            .flush()
            .map_err(|e| format!("Failed to flush stdin: {}", e))?;

        Ok(())
    }

    fn read_response(&mut self) -> Result<SidecarResponse, String> {
        let mut line = String::new();
        self.stdout
            .read_line(&mut line)
            .map_err(|e| format!("Failed to read from stdout: {}", e))?;

        let response: SidecarResponse = serde_json::from_str(&line)
            .map_err(|e| format!("Failed to parse response: {} (line: {})", e, line))?;

        Ok(response)
    }

    fn send_and_receive(&mut self, request: &SidecarRequest) -> Result<SidecarResponse, String> {
        self.send_request(request)?;
        self.read_response()
    }
}

/// Spawn a new sidecar process for a project
pub fn spawn_sidecar(project_id: &str) -> Result<(), String> {
    let mut processes = SIDECAR_PROCESSES
        .lock()
        .map_err(|e| format!("Failed to lock processes: {}", e))?;

    // Check if already running
    if processes.contains_key(project_id) {
        return Ok(());
    }

    // Find node executable
    let node_cmd = if cfg!(target_os = "windows") {
        "node.exe"
    } else {
        "node"
    };

    // Determine the sidecar directory
    // In development: <project>/src-tauri/target/debug/<exe> -> go up to src-tauri/
    // In production: the sidecar should be bundled with the app
    let exe_path = std::env::current_exe()
        .map_err(|e| format!("Failed to get current exe: {}", e))?;

    let sidecar_dir = if cfg!(debug_assertions) {
        // Development mode: exe is in target/debug, go up to src-tauri
        exe_path
            .parent()
            .and_then(|p| p.parent()) // target/
            .and_then(|p| p.parent()) // src-tauri/
            .ok_or_else(|| "Failed to determine sidecar directory".to_string())?
    } else {
        // Production mode: exe directory
        exe_path
            .parent()
            .ok_or_else(|| "Failed to get executable directory".to_string())?
    };

    // Spawn Node.js process
    let child = Command::new(node_cmd)
        .arg("fcm-sidecar.mjs")
        .current_dir(sidecar_dir)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::inherit())
        .spawn()
        .map_err(|e| format!("Failed to spawn sidecar: {}. Make sure Node.js is installed.", e))?;

    let mut process = SidecarProcess::new(child)?;

    // Read initial "ready" message
    let ready_response = process.read_response()?;
    if !ready_response.success {
        return Err(format!(
            "Sidecar failed to start: {:?}",
            ready_response.error
        ));
    }

    processes.insert(project_id.to_string(), process);

    Ok(())
}

/// Initialize Firebase for a project in the sidecar
pub fn initialize_firebase(project_id: &str, service_account_path: &str) -> Result<(), String> {
    let mut processes = SIDECAR_PROCESSES
        .lock()
        .map_err(|e| format!("Failed to lock processes: {}", e))?;

    let process = processes
        .get_mut(project_id)
        .ok_or_else(|| "Sidecar not running for this project".to_string())?;

    let request = SidecarRequest {
        action: "init".to_string(),
        project_id: Some(project_id.to_string()),
        service_account_path: Some(service_account_path.to_string()),
        tokens: None,
        message: None,
    };

    let response = process.send_and_receive(&request)?;

    if !response.success {
        return Err(response
            .error
            .unwrap_or_else(|| "Unknown error".to_string()));
    }

    Ok(())
}

/// Send notification via sidecar
pub fn send_notification(
    project_id: &str,
    tokens: Vec<String>,
    message: serde_json::Value,
) -> Result<serde_json::Value, String> {
    let mut processes = SIDECAR_PROCESSES
        .lock()
        .map_err(|e| format!("Failed to lock processes: {}", e))?;

    let process = processes
        .get_mut(project_id)
        .ok_or_else(|| "Sidecar not running for this project".to_string())?;

    let request = SidecarRequest {
        action: "send".to_string(),
        project_id: Some(project_id.to_string()),
        service_account_path: None,
        tokens: Some(tokens),
        message: Some(message),
    };

    let response = process.send_and_receive(&request)?;

    if !response.success {
        return Err(response
            .error
            .unwrap_or_else(|| "Unknown error".to_string()));
    }

    Ok(response
        .data
        .ok_or_else(|| "No data in response".to_string())?)
}

/// Health check ping to sidecar
pub fn ping_sidecar(project_id: &str) -> Result<(), String> {
    let mut processes = SIDECAR_PROCESSES
        .lock()
        .map_err(|e| format!("Failed to lock processes: {}", e))?;

    let process = processes
        .get_mut(project_id)
        .ok_or_else(|| "Sidecar not running for this project".to_string())?;

    let request = SidecarRequest {
        action: "ping".to_string(),
        project_id: None,
        service_account_path: None,
        tokens: None,
        message: None,
    };

    let response = process.send_and_receive(&request)?;

    if !response.success {
        return Err(response
            .error
            .unwrap_or_else(|| "Ping failed".to_string()));
    }

    Ok(())
}

/// Kill sidecar process for a project
pub fn kill_sidecar(project_id: &str) -> Result<(), String> {
    let mut processes = SIDECAR_PROCESSES
        .lock()
        .map_err(|e| format!("Failed to lock processes: {}", e))?;

    if let Some(mut process) = processes.remove(project_id) {
        // Try to send shutdown command
        let _ = process.send_request(&SidecarRequest {
            action: "shutdown".to_string(),
            project_id: None,
            service_account_path: None,
            tokens: None,
            message: None,
        });

        // Kill the process
        process
            .child
            .kill()
            .map_err(|e| format!("Failed to kill process: {}", e))?;
    }

    Ok(())
}

/// Kill all sidecar processes (called on app exit)
pub fn kill_all_sidecars() {
    let mut processes = SIDECAR_PROCESSES.lock().unwrap();
    for (project_id, mut process) in processes.drain() {
        let _ = process.send_request(&SidecarRequest {
            action: "shutdown".to_string(),
            project_id: None,
            service_account_path: None,
            tokens: None,
            message: None,
        });
        let _ = process.child.kill();
        println!("Killed sidecar for project: {}", project_id);
    }
}
