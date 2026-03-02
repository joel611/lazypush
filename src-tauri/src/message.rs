use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use uuid::Uuid;

/// Notification payload
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Notification {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub body: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_url: Option<String>,
}

/// Android-specific configuration
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AndroidConfig {
    pub priority: String, // "normal" or "high"
}

/// APNs headers
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "kebab-case")]
pub struct ApnsHeaders {
    pub apns_priority: String, // "5" or "10"
}

/// APNs APS payload
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Aps {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content_available: Option<i32>, // 0 or 1
    #[serde(skip_serializing_if = "Option::is_none")]
    pub mutable_content: Option<i32>, // 0 or 1
}

/// APNs payload
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ApnsPayload {
    pub aps: Aps,
}

/// APNs configuration
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ApnsConfig {
    pub headers: ApnsHeaders,
    pub payload: ApnsPayload,
}

/// Message template stored in messages.json
#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct MessageTemplate {
    pub id: String,
    pub name: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub notification: Option<Notification>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<std::collections::HashMap<String, String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub android: Option<AndroidConfig>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub apns: Option<ApnsConfig>,
    pub created_at: String,
}

/// Form data for creating/updating a message template
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MessageFormData {
    pub name: String,
    pub notification: Option<Notification>,
    pub data: Option<std::collections::HashMap<String, String>>,
    pub android: Option<AndroidConfig>,
    pub apns: Option<ApnsConfig>,
}

/// Loads message templates from messages.json
pub fn load_messages(base_path: &Path, project_id: &str) -> Result<Vec<MessageTemplate>, String> {
    let messages_path = base_path
        .join("data")
        .join("projects")
        .join(project_id)
        .join("messages.json");

    if !messages_path.exists() {
        return Ok(Vec::new());
    }

    let content = fs::read_to_string(&messages_path)
        .map_err(|e| format!("Unable to read messages.json: {}", e))?;

    let messages: Vec<MessageTemplate> = serde_json::from_str(&content)
        .map_err(|e| format!("Invalid messages.json format: {}", e))?;

    Ok(messages)
}

/// Saves message templates to messages.json
fn save_messages(
    base_path: &Path,
    project_id: &str,
    messages: &[MessageTemplate],
) -> Result<(), String> {
    let messages_path = base_path
        .join("data")
        .join("projects")
        .join(project_id)
        .join("messages.json");

    let json = serde_json::to_string_pretty(messages)
        .map_err(|e| format!("Failed to serialize messages: {}", e))?;

    fs::write(&messages_path, json)
        .map_err(|e| format!("Failed to write messages.json: {}", e))?;

    Ok(())
}

/// Adds a new message template
pub fn add_message(
    base_path: &Path,
    project_id: &str,
    form_data: MessageFormData,
) -> Result<MessageTemplate, String> {
    let mut messages = load_messages(base_path, project_id)?;

    let message = MessageTemplate {
        id: Uuid::new_v4().to_string(),
        name: form_data.name,
        notification: form_data.notification,
        data: form_data.data,
        android: form_data.android,
        apns: form_data.apns,
        created_at: chrono::Utc::now().to_rfc3339(),
    };

    messages.push(message.clone());
    save_messages(base_path, project_id, &messages)?;

    Ok(message)
}

/// Updates an existing message template
pub fn update_message(
    base_path: &Path,
    project_id: &str,
    message_id: &str,
    form_data: MessageFormData,
) -> Result<MessageTemplate, String> {
    let mut messages = load_messages(base_path, project_id)?;

    let message = messages
        .iter_mut()
        .find(|m| m.id == message_id)
        .ok_or_else(|| format!("Message template not found: {}", message_id))?;

    message.name = form_data.name;
    message.notification = form_data.notification;
    message.data = form_data.data;
    message.android = form_data.android;
    message.apns = form_data.apns;

    let updated_message = message.clone();
    save_messages(base_path, project_id, &messages)?;

    Ok(updated_message)
}

/// Deletes a message template
pub fn delete_message(
    base_path: &Path,
    project_id: &str,
    message_id: &str,
) -> Result<(), String> {
    let mut messages = load_messages(base_path, project_id)?;

    let original_len = messages.len();
    messages.retain(|m| m.id != message_id);

    if messages.len() == original_len {
        return Err(format!("Message template not found: {}", message_id));
    }

    save_messages(base_path, project_id, &messages)?;

    Ok(())
}
