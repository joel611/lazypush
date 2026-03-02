mod device;
mod message;
mod project;
mod send_history;
mod sidecar;

use device::{Device, DeviceFormData};
use message::{MessageFormData, MessageTemplate};
use project::{CreateProjectResult, ProjectConfig, ValidationResult};
use send_history::{DeviceInfo, SendHistoryEntry, SendResponse};
use std::path::PathBuf;
use tauri::Manager;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

/// Validates a Firebase service account JSON file
#[tauri::command]
fn validate_service_account(file_path: String, app_handle: tauri::AppHandle) -> ValidationResult {
    let base_path = app_handle
        .path()
        .app_data_dir()
        .unwrap_or_else(|_| PathBuf::from("."));

    project::validate_service_account_file(&base_path, &file_path)
}

/// Creates a new FCM project
#[tauri::command]
fn create_project(
    name: String,
    service_account_path: String,
    app_handle: tauri::AppHandle,
) -> CreateProjectResult {
    let base_path = app_handle
        .path()
        .app_data_dir()
        .unwrap_or_else(|_| PathBuf::from("."));

    project::create_project(&base_path, &name, &service_account_path)
}

/// Checks if a project name already exists
#[tauri::command]
fn check_project_name_exists(name: String, app_handle: tauri::AppHandle) -> Result<bool, String> {
    let base_path = app_handle
        .path()
        .app_data_dir()
        .unwrap_or_else(|_| PathBuf::from("."));

    project::check_project_name_exists(&base_path, &name)
}

/// Loads all existing projects
#[tauri::command]
fn load_all_projects(app_handle: tauri::AppHandle) -> Result<Vec<ProjectConfig>, String> {
    let base_path = app_handle
        .path()
        .app_data_dir()
        .unwrap_or_else(|_| PathBuf::from("."));

    project::load_all_projects(&base_path)
}

/// Loads devices for a project
#[tauri::command]
fn load_devices(project_id: String, app_handle: tauri::AppHandle) -> Result<Vec<Device>, String> {
    let base_path = app_handle
        .path()
        .app_data_dir()
        .unwrap_or_else(|_| PathBuf::from("."));

    device::load_devices(&base_path, &project_id)
}

/// Adds a new device to a project
#[tauri::command]
fn add_device(
    project_id: String,
    device_data: DeviceFormData,
    app_handle: tauri::AppHandle,
) -> Result<Device, String> {
    let base_path = app_handle
        .path()
        .app_data_dir()
        .unwrap_or_else(|_| PathBuf::from("."));

    device::add_device(&base_path, &project_id, device_data)
}

/// Updates an existing device
#[tauri::command]
fn update_device(
    project_id: String,
    device_id: String,
    device_data: DeviceFormData,
    app_handle: tauri::AppHandle,
) -> Result<Device, String> {
    let base_path = app_handle
        .path()
        .app_data_dir()
        .unwrap_or_else(|_| PathBuf::from("."));

    device::update_device(&base_path, &project_id, &device_id, device_data)
}

/// Deletes a device
#[tauri::command]
fn delete_device(
    project_id: String,
    device_id: String,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    let base_path = app_handle
        .path()
        .app_data_dir()
        .unwrap_or_else(|_| PathBuf::from("."));

    device::delete_device(&base_path, &project_id, &device_id)
}

/// Loads message templates for a project
#[tauri::command]
fn load_messages(
    project_id: String,
    app_handle: tauri::AppHandle,
) -> Result<Vec<MessageTemplate>, String> {
    let base_path = app_handle
        .path()
        .app_data_dir()
        .unwrap_or_else(|_| PathBuf::from("."));

    message::load_messages(&base_path, &project_id)
}

/// Adds a new message template
#[tauri::command]
fn add_message(
    project_id: String,
    message_data: MessageFormData,
    app_handle: tauri::AppHandle,
) -> Result<MessageTemplate, String> {
    let base_path = app_handle
        .path()
        .app_data_dir()
        .unwrap_or_else(|_| PathBuf::from("."));

    message::add_message(&base_path, &project_id, message_data)
}

/// Updates an existing message template
#[tauri::command]
fn update_message(
    project_id: String,
    message_id: String,
    message_data: MessageFormData,
    app_handle: tauri::AppHandle,
) -> Result<MessageTemplate, String> {
    let base_path = app_handle
        .path()
        .app_data_dir()
        .unwrap_or_else(|_| PathBuf::from("."));

    message::update_message(&base_path, &project_id, &message_id, message_data)
}

/// Deletes a message template
#[tauri::command]
fn delete_message(
    project_id: String,
    message_id: String,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    let base_path = app_handle
        .path()
        .app_data_dir()
        .unwrap_or_else(|_| PathBuf::from("."));

    message::delete_message(&base_path, &project_id, &message_id)
}

/// Sends push notification to selected devices
#[tauri::command]
fn send_notification(
    project_id: String,
    device_ids: Vec<String>,
    message_payload: serde_json::Value,
    app_handle: tauri::AppHandle,
) -> Result<SendResponse, String> {
    let base_path = app_handle
        .path()
        .app_data_dir()
        .unwrap_or_else(|_| PathBuf::from("."));

    // Load project config to get project name
    let projects = project::load_all_projects(&base_path)?;
    let project_config = projects
        .iter()
        .find(|p| p.id == project_id)
        .ok_or_else(|| format!("Project not found: {}", project_id))?;

    // Load devices and filter by device_ids
    let all_devices = device::load_devices(&base_path, &project_id)?;
    let selected_devices: Vec<Device> = all_devices
        .into_iter()
        .filter(|d| device_ids.contains(&d.id))
        .collect();

    if selected_devices.is_empty() {
        return Err("No valid devices selected".to_string());
    }

    // Extract tokens
    let tokens: Vec<String> = selected_devices.iter().map(|d| d.token.clone()).collect();

    // Validate token count (FCM limit: 1-500)
    if tokens.is_empty() {
        return Err("No device tokens found".to_string());
    }
    if tokens.len() > 500 {
        return Err(format!(
            "Too many devices selected. Maximum is 500, got {}",
            tokens.len()
        ));
    }

    // Build service account path
    let service_account_path = base_path
        .join("data")
        .join("projects")
        .join(&project_id)
        .join(&project_config.service_account_path);

    let service_account_path_str = service_account_path
        .to_str()
        .ok_or_else(|| "Invalid service account path".to_string())?;

    // Ensure sidecar is running
    sidecar::spawn_sidecar(&project_id)?;

    // Initialize Firebase in sidecar
    sidecar::initialize_firebase(&project_id, service_account_path_str)?;

    // Send notification
    let response_data = sidecar::send_notification(&project_id, tokens.clone(), message_payload.clone())?;

    // Parse FCM response
    let success_count = response_data["successCount"]
        .as_i64()
        .unwrap_or(0) as i32;
    let failure_count = response_data["failureCount"]
        .as_i64()
        .unwrap_or(0) as i32;

    let responses: Vec<send_history::TokenResult> = response_data["responses"]
        .as_array()
        .unwrap_or(&vec![])
        .iter()
        .map(|r| send_history::TokenResult {
            success: r["success"].as_bool().unwrap_or(false),
            message_id: r["messageId"].as_str().map(|s| s.to_string()),
            error: r["error"].as_object().map(|e| send_history::ErrorInfo {
                code: e["code"].as_str().unwrap_or("unknown").to_string(),
                message: e["message"].as_str().unwrap_or("").to_string(),
            }),
            token: r["token"].as_str().unwrap_or("").to_string(),
        })
        .collect();

    let send_response = SendResponse {
        success_count,
        failure_count,
        responses: responses.clone(),
    };

    // Build device info for history
    let device_info: Vec<DeviceInfo> = selected_devices
        .iter()
        .map(|d| DeviceInfo {
            id: d.id.clone(),
            name: d.name.clone(),
            token: d.token.clone(),
        })
        .collect();

    // Save to send history
    send_history::save_send_entry(
        &base_path,
        &project_id,
        &project_config.name,
        message_payload,
        device_info,
        send_response.clone(),
    )?;

    Ok(send_response)
}

/// Loads send history for a specific project
#[tauri::command]
fn load_send_history(
    project_id: String,
    app_handle: tauri::AppHandle,
) -> Result<Vec<SendHistoryEntry>, String> {
    let base_path = app_handle
        .path()
        .app_data_dir()
        .unwrap_or_else(|_| PathBuf::from("."));

    send_history::load_send_history(&base_path, &project_id)
}

/// Loads send history for all projects
#[tauri::command]
fn load_all_send_history(app_handle: tauri::AppHandle) -> Result<Vec<SendHistoryEntry>, String> {
    let base_path = app_handle
        .path()
        .app_data_dir()
        .unwrap_or_else(|_| PathBuf::from("."));

    send_history::load_all_send_history(&base_path)
}

/// Clears all send history for a project
#[tauri::command]
fn clear_send_history(
    project_id: String,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    let base_path = app_handle
        .path()
        .app_data_dir()
        .unwrap_or_else(|_| PathBuf::from("."));

    send_history::clear_send_history(&base_path, &project_id)
}

/// Deletes a specific send history entry
#[tauri::command]
fn delete_send_entry(
    project_id: String,
    entry_id: String,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    let base_path = app_handle
        .path()
        .app_data_dir()
        .unwrap_or_else(|_| PathBuf::from("."));

    send_history::delete_send_entry(&base_path, &project_id, &entry_id)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            validate_service_account,
            create_project,
            check_project_name_exists,
            load_all_projects,
            load_devices,
            add_device,
            update_device,
            delete_device,
            load_messages,
            add_message,
            update_message,
            delete_message,
            send_notification,
            load_send_history,
            load_all_send_history,
            clear_send_history,
            delete_send_entry
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
