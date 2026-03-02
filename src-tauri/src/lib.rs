mod project;

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
fn validate_service_account(file_path: String) -> ValidationResult {
    project::validate_service_account_file(&file_path)
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
            load_all_projects
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
