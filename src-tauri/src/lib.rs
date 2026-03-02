mod device;
mod message;
mod project;

use device::{Device, DeviceFormData};
use message::{MessageFormData, MessageTemplate};
use project::{CreateProjectResult, ProjectConfig, ValidationResult};
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
            delete_message
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
