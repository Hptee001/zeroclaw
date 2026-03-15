//! IPC Commands for ZeroClaw Desktop
//! This module contains all Tauri commands that can be invoked from the frontend

use crate::sidecar::SidecarManager;
use crate::types::{Config, Message, Session, StreamChunk};
use log::info;
use tauri::{AppHandle, Emitter, State, Window};
use tokio::sync::Mutex;
use std::sync::Arc;

/// Application state shared across commands
pub struct AppState {
    pub config: Config,
    pub sessions: Vec<Session>,
    pub current_session_id: Option<String>,
    pub app_handle: Option<AppHandle>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            config: Config {
                identifier: "com.zeroclaw.desktop".to_string(),
                version: env!("CARGO_PKG_VERSION").to_string(),
                providers: vec![],
                channels: vec![],
                tools: crate::types::ToolConfig {
                    shell_enabled: true,
                    file_read_enabled: true,
                    file_write_enabled: true,
                    browser_enabled: false,
                    allowed_commands: vec![],
                },
                memory: crate::types::MemoryConfig {
                    memory_type: "sqlite".to_string(),
                    path: None,
                    embedding_model: None,
                },
                security: crate::types::SecurityConfig {
                    policy_enabled: true,
                    require_approval_for: vec!["shell_write".to_string()],
                    webhook_secret: None,
                },
            },
            sessions: vec![],
            current_session_id: None,
            app_handle: None,
        }
    }
}

/// Get the application version
#[tauri::command]
pub fn get_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// Get current configuration
#[tauri::command]
pub async fn get_config(state: State<'_, Arc<Mutex<AppState>>>) -> Result<Config, String> {
    let state = state.lock().await;
    Ok(state.config.clone())
}

/// Update configuration
#[tauri::command]
pub async fn update_config(
    state: State<'_, Arc<Mutex<AppState>>>,
    config: Config,
) -> Result<(), String> {
    let mut state = state.lock().await;
    state.config = config;

    // Emit event to all windows
    if let Some(handle) = &state.app_handle {
        let _ = handle.emit("config_updated", &state.config);
    }

    info!("Configuration updated");
    Ok(())
}

/// List all sessions
#[tauri::command]
pub async fn list_sessions(state: State<'_, Arc<Mutex<AppState>>>) -> Result<Vec<Session>, String> {
    let state = state.lock().await;
    Ok(state.sessions.clone())
}

/// Create a new session
#[tauri::command]
pub async fn create_session(
    state: State<'_, Arc<Mutex<AppState>>>,
    name: String,
) -> Result<Session, String> {
    let mut state = state.lock().await;
    let now = chrono::Utc::now().to_rfc3339();

    let session = Session {
        id: uuid::Uuid::new_v4().to_string(),
        name,
        created_at: now.clone(),
        updated_at: now,
        message_count: 0,
    };

    let session_id = session.id.clone();
    state.sessions.push(session.clone());
    state.current_session_id = Some(session_id.clone());

    // Emit event
    if let Some(handle) = &state.app_handle {
        let _ = handle.emit("session_created", &session);
    }

    info!("Session created: {}", session_id);
    Ok(session)
}

/// Get a specific session
#[tauri::command]
pub async fn get_session(
    state: State<'_, Arc<Mutex<AppState>>>,
    session_id: String,
) -> Result<Session, String> {
    let state = state.lock().await;
    state
        .sessions
        .iter()
        .find(|s| s.id == session_id)
        .cloned()
        .ok_or_else(|| "Session not found".to_string())
}

/// Delete a session
#[tauri::command]
pub async fn delete_session(
    state: State<'_, Arc<Mutex<AppState>>>,
    session_id: String,
) -> Result<(), String> {
    let mut state = state.lock().await;
    let initial_len = state.sessions.len();
    state.sessions.retain(|s| s.id != session_id);

    if state.sessions.len() < initial_len {
        if state.current_session_id.as_ref() == Some(&session_id) {
            state.current_session_id = state.sessions.last().map(|s| s.id.clone());
        }
        info!("Session deleted: {}", session_id);
        Ok(())
    } else {
        Err("Session not found".to_string())
    }
}

/// Get messages for a session
#[tauri::command]
pub async fn get_messages(
    _state: State<'_, Arc<Mutex<AppState>>>,
    _session_id: String,
) -> Result<Vec<Message>, String> {
    // TODO: Load from memory backend
    Ok(vec![])
}

/// Send a message to the AI
#[tauri::command]
pub async fn send_message(
    _state: State<'_, Arc<Mutex<AppState>>>,
    window: Window,
    session_id: String,
    content: String,
) -> Result<(), String> {

    // Create user message
    let user_msg = Message {
        id: uuid::Uuid::new_v4().to_string(),
        session_id: session_id.clone(),
        role: "user".to_string(),
        content: content.clone(),
        created_at: chrono::Utc::now().to_rfc3339(),
        metadata: None,
    };

    // Emit message event
    let _ = window.emit("message_new", &user_msg);

    // TODO: Call AI provider and stream response
    // For now, emit a placeholder response
    let assistant_msg = Message {
        id: uuid::Uuid::new_v4().to_string(),
        session_id,
        role: "assistant".to_string(),
        content: "This is a placeholder response. AI integration coming soon.".to_string(),
        created_at: chrono::Utc::now().to_rfc3339(),
        metadata: None,
    };

    let _ = window.emit("message_new", &assistant_msg);

    info!("Message sent in session: {}", user_msg.session_id);
    Ok(())
}

/// Stream AI response (SSE-style)
#[tauri::command]
pub async fn stream_response(
    _state: State<'_, Arc<Mutex<AppState>>>,
    window: Window,
    session_id: String,
    _prompt: String,
) -> Result<(), String> {
    // Simulate streaming response
    let chunks = vec![
        "Hello",
        "! ",
        "This ",
        "is ",
        "a ",
        "streamed ",
        "response.",
    ];

    for chunk_text in chunks {
        let chunk = StreamChunk {
            chunk_type: "text".to_string(),
            content: Some(chunk_text.to_string()),
            data: None,
        };

        let _ = window.emit("stream_chunk", &chunk);
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    }

    // Send done signal
    let done_chunk = StreamChunk {
        chunk_type: "done".to_string(),
        content: None,
        data: None,
    };
    let _ = window.emit("stream_chunk", &done_chunk);

    info!("Streamed response for session: {}", session_id);
    Ok(())
}

/// Execute a tool
#[tauri::command]
pub async fn execute_tool(
    state: State<'_, Arc<Mutex<AppState>>>,
    window: Window,
    tool_name: String,
    arguments: serde_json::Value,
) -> Result<serde_json::Value, String> {
    let state = state.lock().await;

    // Check if tool is allowed
    if !state.config.tools.shell_enabled && tool_name == "shell" {
        return Err("Shell tool is disabled".to_string());
    }

    info!("Executing tool: {} with args: {}", tool_name, arguments);

    // Emit tool call event
    let _ = window.emit("tool_called", &serde_json::json!({
        "name": tool_name,
        "arguments": arguments,
    }));

    // TODO: Actually execute the tool
    Ok(serde_json::json!({"result": "Tool execution not yet implemented"}))
}

/// Initialize app state with handle
pub async fn init_app_state(
    state: State<'_, Arc<Mutex<AppState>>>,
    app_handle: AppHandle,
) {
    let mut state = state.lock().await;
    state.app_handle = Some(app_handle);
}

/// Start the sidecar process
#[tauri::command]
pub async fn start_sidecar(
    state: State<'_, Arc<Mutex<SidecarManager>>>,
) -> Result<(), String> {
    let mut manager = state.lock().await;
    manager.start().await
}

/// Stop the sidecar process
#[tauri::command]
pub async fn stop_sidecar(
    state: State<'_, Arc<Mutex<SidecarManager>>>,
) -> Result<(), String> {
    let mut manager = state.lock().await;
    manager.stop().await
}

/// Get sidecar status
#[tauri::command]
pub async fn sidecar_status(
    state: State<'_, Arc<Mutex<SidecarManager>>>,
) -> Result<serde_json::Value, String> {
    let manager = state.lock().await;
    let is_running = manager.child.is_some();
    Ok(serde_json::json!({
        "running": is_running,
        "enabled": manager.config.enabled,
    }))
}
