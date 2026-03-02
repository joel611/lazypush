use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SendHistoryEntry {
    pub id: String,
    pub timestamp: String,
    pub project_id: String,
    pub project_name: String,
    pub message: serde_json::Value,
    pub devices: Vec<DeviceInfo>,
    pub response: SendResponse,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DeviceInfo {
    pub id: String,
    pub name: String,
    pub token: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SendResponse {
    pub success_count: i32,
    pub failure_count: i32,
    pub responses: Vec<TokenResult>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TokenResult {
    pub success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub message_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<ErrorInfo>,
    pub token: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ErrorInfo {
    pub code: String,
    pub message: String,
}

const MAX_HISTORY_ENTRIES: usize = 100;

/// Load send history for a project
pub fn load_send_history(base_path: &Path, project_id: &str) -> Result<Vec<SendHistoryEntry>, String> {
    let history_path = base_path
        .join("projects")
        .join(project_id)
        .join("send-history.json");

    if !history_path.exists() {
        return Ok(Vec::new());
    }

    let contents = fs::read_to_string(&history_path)
        .map_err(|e| format!("Failed to read send history: {}", e))?;

    let history: Vec<SendHistoryEntry> = serde_json::from_str(&contents)
        .map_err(|e| format!("Failed to parse send history: {}", e))?;

    Ok(history)
}

/// Load all send history across all projects
pub fn load_all_send_history(base_path: &Path) -> Result<Vec<SendHistoryEntry>, String> {
    let projects_dir = base_path.join("projects");

    if !projects_dir.exists() {
        return Ok(Vec::new());
    }

    let mut all_history = Vec::new();

    let entries = fs::read_dir(&projects_dir)
        .map_err(|e| format!("Failed to read projects directory: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
        let project_id = entry.file_name().to_string_lossy().to_string();

        match load_send_history(base_path, &project_id) {
            Ok(mut history) => all_history.append(&mut history),
            Err(_) => continue, // Skip projects with no history or errors
        }
    }

    // Sort by timestamp (newest first)
    all_history.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));

    Ok(all_history)
}

/// Save a new send history entry
pub fn save_send_entry(
    base_path: &Path,
    project_id: &str,
    project_name: &str,
    message: serde_json::Value,
    devices: Vec<DeviceInfo>,
    response: SendResponse,
) -> Result<(), String> {
    let history_path = base_path
        .join("projects")
        .join(project_id)
        .join("send-history.json");

    // Load existing history
    let mut history = load_send_history(base_path, project_id)?;

    // Create new entry
    let entry = SendHistoryEntry {
        id: Uuid::new_v4().to_string(),
        timestamp: Utc::now().to_rfc3339(),
        project_id: project_id.to_string(),
        project_name: project_name.to_string(),
        message,
        devices,
        response,
    };

    // Add to beginning of array (newest first)
    history.insert(0, entry);

    // Enforce max entries limit
    if history.len() > MAX_HISTORY_ENTRIES {
        history.truncate(MAX_HISTORY_ENTRIES);
    }

    // Write to file
    let json = serde_json::to_string_pretty(&history)
        .map_err(|e| format!("Failed to serialize history: {}", e))?;

    // Ensure parent directory exists
    if let Some(parent) = history_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create history directory: {}", e))?;
    }

    fs::write(&history_path, json)
        .map_err(|e| format!("Failed to write send history: {}", e))?;

    Ok(())
}

/// Clear all send history for a project
pub fn clear_send_history(base_path: &Path, project_id: &str) -> Result<(), String> {
    let history_path = base_path
        .join("projects")
        .join(project_id)
        .join("send-history.json");

    if history_path.exists() {
        fs::remove_file(&history_path)
            .map_err(|e| format!("Failed to delete send history: {}", e))?;
    }

    Ok(())
}

/// Delete a specific history entry
pub fn delete_send_entry(base_path: &Path, project_id: &str, entry_id: &str) -> Result<(), String> {
    let mut history = load_send_history(base_path, project_id)?;

    // Remove the entry with matching ID
    history.retain(|entry| entry.id != entry_id);

    // Write back to file
    let history_path = base_path
        .join("projects")
        .join(project_id)
        .join("send-history.json");

    let json = serde_json::to_string_pretty(&history)
        .map_err(|e| format!("Failed to serialize history: {}", e))?;

    fs::write(&history_path, json)
        .map_err(|e| format!("Failed to write send history: {}", e))?;

    Ok(())
}
