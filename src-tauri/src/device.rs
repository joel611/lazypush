use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use uuid::Uuid;

/// Device stored in devices.json
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Device {
    pub id: String,
    pub name: String,
    pub platform: String, // "iOS" or "Android"
    pub token: String,
    pub notes: String,
    pub created_at: String,
}

/// Form data for creating/updating a device
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeviceFormData {
    pub name: String,
    pub platform: String,
    pub token: String,
    pub notes: String,
}

/// Loads devices from devices.json
pub fn load_devices(base_path: &Path, project_id: &str) -> Result<Vec<Device>, String> {
    let devices_path = base_path
        .join("data")
        .join("projects")
        .join(project_id)
        .join("devices.json");

    if !devices_path.exists() {
        return Ok(Vec::new());
    }

    let content = fs::read_to_string(&devices_path)
        .map_err(|e| format!("Unable to read devices.json: {}", e))?;

    let devices: Vec<Device> = serde_json::from_str(&content)
        .map_err(|e| format!("Invalid devices.json format: {}", e))?;

    Ok(devices)
}

/// Saves devices to devices.json
fn save_devices(base_path: &Path, project_id: &str, devices: &[Device]) -> Result<(), String> {
    let devices_path = base_path
        .join("data")
        .join("projects")
        .join(project_id)
        .join("devices.json");

    let json = serde_json::to_string_pretty(devices)
        .map_err(|e| format!("Failed to serialize devices: {}", e))?;

    fs::write(&devices_path, json).map_err(|e| format!("Failed to write devices.json: {}", e))?;

    Ok(())
}

/// Adds a new device
pub fn add_device(
    base_path: &Path,
    project_id: &str,
    form_data: DeviceFormData,
) -> Result<Device, String> {
    let mut devices = load_devices(base_path, project_id)?;

    let device = Device {
        id: Uuid::new_v4().to_string(),
        name: form_data.name,
        platform: form_data.platform,
        token: form_data.token,
        notes: form_data.notes,
        created_at: chrono::Utc::now().to_rfc3339(),
    };

    devices.push(device.clone());
    save_devices(base_path, project_id, &devices)?;

    Ok(device)
}

/// Updates an existing device
pub fn update_device(
    base_path: &Path,
    project_id: &str,
    device_id: &str,
    form_data: DeviceFormData,
) -> Result<Device, String> {
    let mut devices = load_devices(base_path, project_id)?;

    let device = devices
        .iter_mut()
        .find(|d| d.id == device_id)
        .ok_or_else(|| format!("Device not found: {}", device_id))?;

    device.name = form_data.name;
    device.platform = form_data.platform;
    device.token = form_data.token;
    device.notes = form_data.notes;

    let updated_device = device.clone();
    save_devices(base_path, project_id, &devices)?;

    Ok(updated_device)
}

/// Deletes a device
pub fn delete_device(base_path: &Path, project_id: &str, device_id: &str) -> Result<(), String> {
    let mut devices = load_devices(base_path, project_id)?;

    let original_len = devices.len();
    devices.retain(|d| d.id != device_id);

    if devices.len() == original_len {
        return Err(format!("Device not found: {}", device_id));
    }

    save_devices(base_path, project_id, &devices)?;

    Ok(())
}
