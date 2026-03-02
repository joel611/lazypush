use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use uuid::Uuid;

/// Firebase service account JSON structure with required fields
#[derive(Debug, Deserialize)]
pub struct ServiceAccountJson {
    #[serde(rename = "type")]
    pub account_type: String,
    pub project_id: String,
    pub private_key_id: String,
    pub private_key: String,
    pub client_email: String,
    pub client_id: String,
    pub auth_uri: String,
    pub token_uri: String,
}

/// Project configuration stored in config.json
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ProjectConfig {
    pub id: String,
    pub name: String,
    pub project_id: String,
    pub client_email: String,
    pub service_account_path: String,
    pub created_at: String,
}

/// Validation result returned to frontend
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ValidationResult {
    pub valid: bool,
    pub project_id: Option<String>,
    pub client_email: Option<String>,
    pub error: Option<String>,
    pub duplicate_project_name: Option<String>,
}

/// Result of project creation operation
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateProjectResult {
    pub success: bool,
    pub project_id: Option<String>,
    pub error: Option<String>,
}

/// Validates JSON syntax and returns parsed service account
fn validate_json_syntax(content: &str) -> Result<ServiceAccountJson, String> {
    serde_json::from_str::<ServiceAccountJson>(content)
        .map_err(|e| format!("Invalid JSON format: {}", e))
}

/// Validates that required Firebase service account fields exist
fn validate_service_account_structure(_service_account: &ServiceAccountJson) -> Result<(), String> {
    // All fields are required by the struct, so if we got here, structure is valid
    Ok(())
}

/// Validates that the type field equals "service_account"
fn validate_service_account_type(service_account: &ServiceAccountJson) -> Result<(), String> {
    if service_account.account_type != "service_account" {
        return Err("File is not a Firebase service account".to_string());
    }
    Ok(())
}

/// Extracts project metadata from service account
fn extract_project_metadata(service_account: &ServiceAccountJson) -> (String, String) {
    (
        service_account.project_id.clone(),
        service_account.client_email.clone(),
    )
}

/// Validates service account file with basic checks and duplicate detection
pub fn validate_service_account_file(base_path: &Path, file_path: &str) -> ValidationResult {
    // Check file size (max 100KB = 102400 bytes)
    let metadata = match fs::metadata(file_path) {
        Ok(m) => m,
        Err(e) => {
            return ValidationResult {
                valid: false,
                project_id: None,
                client_email: None,
                error: Some(format!("File not found: {}", e)),
                duplicate_project_name: None,
            }
        }
    };

    if metadata.len() > 102400 {
        return ValidationResult {
            valid: false,
            project_id: None,
            client_email: None,
            error: Some("File too large (max 100KB)".to_string()),
            duplicate_project_name: None,
        };
    }

    // Read file content
    let content = match fs::read_to_string(file_path) {
        Ok(c) => c,
        Err(e) => {
            return ValidationResult {
                valid: false,
                project_id: None,
                client_email: None,
                error: Some(format!("Unable to read file: {}", e)),
                duplicate_project_name: None,
            }
        }
    };

    // Validate JSON syntax
    let service_account = match validate_json_syntax(&content) {
        Ok(sa) => sa,
        Err(e) => {
            return ValidationResult {
                valid: false,
                project_id: None,
                client_email: None,
                error: Some(e),
                duplicate_project_name: None,
            }
        }
    };

    // Validate structure (fields exist)
    if let Err(e) = validate_service_account_structure(&service_account) {
        return ValidationResult {
            valid: false,
            project_id: None,
            client_email: None,
            error: Some(e),
            duplicate_project_name: None,
        };
    }

    // Validate type field
    if let Err(e) = validate_service_account_type(&service_account) {
        return ValidationResult {
            valid: false,
            project_id: None,
            client_email: None,
            error: Some(e),
            duplicate_project_name: None,
        };
    }

    // Extract metadata
    let (project_id, client_email) = extract_project_metadata(&service_account);

    // Check for duplicate Firebase project ID
    let duplicate_project_name = check_firebase_project_id_exists(base_path, &project_id);

    ValidationResult {
        valid: true,
        project_id: Some(project_id),
        client_email: Some(client_email),
        error: None,
        duplicate_project_name,
    }
}

/// Comprehensive validation including all required fields
fn validate_comprehensive(service_account: &ServiceAccountJson) -> Result<(), String> {
    validate_service_account_structure(service_account)?;
    validate_service_account_type(service_account)?;
    Ok(())
}

/// Creates project directory structure
fn create_project_directory(base_path: &Path, project_id: &str) -> Result<PathBuf, String> {
    let project_dir = base_path.join("data").join("projects").join(project_id);

    fs::create_dir_all(&project_dir).map_err(|e| format!("Unable to create project: {}", e))?;

    Ok(project_dir)
}

/// Copies service account file to project directory
fn copy_service_account_file(source_path: &str, project_dir: &Path) -> Result<(), String> {
    let destination = project_dir.join("service-account.json");

    fs::copy(source_path, destination)
        .map_err(|e| format!("Unable to copy service account file: {}", e))?;

    Ok(())
}

/// Creates config.json file
fn create_config_json(
    project_dir: &Path,
    project_id: &str,
    name: &str,
    firebase_project_id: &str,
    client_email: &str,
) -> Result<(), String> {
    let config = ProjectConfig {
        id: project_id.to_string(),
        name: name.to_string(),
        project_id: firebase_project_id.to_string(),
        client_email: client_email.to_string(),
        service_account_path: "service-account.json".to_string(),
        created_at: chrono::Utc::now().to_rfc3339(),
    };

    let config_json = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;

    let config_path = project_dir.join("config.json");
    fs::write(config_path, config_json)
        .map_err(|e| format!("Unable to create config file: {}", e))?;

    Ok(())
}

/// Creates empty devices.json file
fn create_empty_devices_json(project_dir: &Path) -> Result<(), String> {
    let devices_path = project_dir.join("devices.json");
    fs::write(devices_path, "[]").map_err(|e| format!("Unable to create devices file: {}", e))?;
    Ok(())
}

/// Creates empty messages.json file
fn create_empty_messages_json(project_dir: &Path) -> Result<(), String> {
    let messages_path = project_dir.join("messages.json");
    fs::write(messages_path, "[]").map_err(|e| format!("Unable to create messages file: {}", e))?;
    Ok(())
}

/// Rollback: deletes project directory if creation fails
fn rollback_project(project_dir: &Path) {
    let _ = fs::remove_dir_all(project_dir);
}

/// Checks if a project with the given name already exists
pub fn check_project_name_exists(base_path: &Path, name: &str) -> Result<bool, String> {
    let projects_dir = base_path.join("data").join("projects");

    if !projects_dir.exists() {
        return Ok(false);
    }

    let entries = fs::read_dir(&projects_dir)
        .map_err(|e| format!("Unable to read projects directory: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Error reading directory entry: {}", e))?;
        let config_path = entry.path().join("config.json");

        if config_path.exists() {
            if let Ok(config_content) = fs::read_to_string(config_path) {
                if let Ok(config) = serde_json::from_str::<ProjectConfig>(&config_content) {
                    if config.name.to_lowercase() == name.to_lowercase() {
                        return Ok(true);
                    }
                }
            }
        }
    }

    Ok(false)
}

/// Creates a new project with atomic operations
pub fn create_project(
    base_path: &Path,
    name: &str,
    service_account_path: &str,
) -> CreateProjectResult {
    // Generate UUID for project
    let project_uuid = Uuid::new_v4().to_string();

    // Validate service account file comprehensively
    let content = match fs::read_to_string(service_account_path) {
        Ok(c) => c,
        Err(e) => {
            return CreateProjectResult {
                success: false,
                project_id: None,
                error: Some(format!("Unable to read file: {}", e)),
            }
        }
    };

    let service_account = match validate_json_syntax(&content) {
        Ok(sa) => sa,
        Err(e) => {
            return CreateProjectResult {
                success: false,
                project_id: None,
                error: Some(e),
            }
        }
    };

    if let Err(e) = validate_comprehensive(&service_account) {
        return CreateProjectResult {
            success: false,
            project_id: None,
            error: Some(e),
        };
    }

    // Extract metadata
    let (firebase_project_id, client_email) = extract_project_metadata(&service_account);

    // Create project directory
    let project_dir = match create_project_directory(base_path, &project_uuid) {
        Ok(dir) => dir,
        Err(e) => {
            return CreateProjectResult {
                success: false,
                project_id: None,
                error: Some(e),
            }
        }
    };

    // Atomic operations with rollback on failure
    if let Err(e) = copy_service_account_file(service_account_path, &project_dir) {
        rollback_project(&project_dir);
        return CreateProjectResult {
            success: false,
            project_id: None,
            error: Some(e),
        };
    }

    if let Err(e) = create_config_json(
        &project_dir,
        &project_uuid,
        name,
        &firebase_project_id,
        &client_email,
    ) {
        rollback_project(&project_dir);
        return CreateProjectResult {
            success: false,
            project_id: None,
            error: Some(e),
        };
    }

    if let Err(e) = create_empty_devices_json(&project_dir) {
        rollback_project(&project_dir);
        return CreateProjectResult {
            success: false,
            project_id: None,
            error: Some(e),
        };
    }

    if let Err(e) = create_empty_messages_json(&project_dir) {
        rollback_project(&project_dir);
        return CreateProjectResult {
            success: false,
            project_id: None,
            error: Some(e),
        };
    }

    CreateProjectResult {
        success: true,
        project_id: Some(project_uuid),
        error: None,
    }
}

/// Loads all projects from the data directory
pub fn load_all_projects(base_path: &Path) -> Result<Vec<ProjectConfig>, String> {
    let projects_dir = base_path.join("data").join("projects");

    if !projects_dir.exists() {
        return Ok(Vec::new());
    }

    let entries = fs::read_dir(&projects_dir)
        .map_err(|e| format!("Unable to read projects directory: {}", e))?;

    let mut projects = Vec::new();

    for entry in entries {
        let entry = entry.map_err(|e| format!("Error reading directory entry: {}", e))?;
        let config_path = entry.path().join("config.json");

        if config_path.exists() {
            if let Ok(config_content) = fs::read_to_string(config_path) {
                if let Ok(config) = serde_json::from_str::<ProjectConfig>(&config_content) {
                    projects.push(config);
                }
            }
        }
    }

    // Sort by creation date (newest first)
    projects.sort_by(|a, b| b.created_at.cmp(&a.created_at));

    Ok(projects)
}

/// Checks if a Firebase project_id already exists in any project
/// Returns the project name if duplicate found, None if unique
pub fn check_firebase_project_id_exists(
    base_path: &Path,
    firebase_project_id: &str,
) -> Option<String> {
    let projects = match load_all_projects(base_path) {
        Ok(p) => p,
        Err(_) => return None,
    };

    for project in projects {
        if project.project_id == firebase_project_id {
            return Some(project.name);
        }
    }

    None
}
