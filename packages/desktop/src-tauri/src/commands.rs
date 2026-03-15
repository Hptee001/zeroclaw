//! IPC Commands for ZeroClaw Desktop
//! This module contains all Tauri commands that can be invoked from the frontend

use crate::types::*;
use futures_util::{SinkExt, StreamExt};
use log::{error, info, warn};
use tauri::{AppHandle, Emitter, State, Window};
use tokio::sync::Mutex;
use std::sync::Arc;
use std::path::PathBuf;
use uuid::Uuid;
use chrono::Utc;

/// Application state shared across commands
pub struct AppState {
    pub config: Config,
    pub sessions: Vec<Session>,
    pub messages: Vec<Message>,
    pub agents: Vec<Agent>,
    pub channels: Vec<Channel>,
    pub skills: Vec<Skill>,
    pub cron_jobs: Vec<CronJob>,
    pub job_history: Vec<JobRun>,
    pub providers: Vec<Provider>,
    pub usage: Vec<ModelUsage>,
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
                tools: ToolConfig {
                    shell_enabled: true,
                    file_read_enabled: true,
                    file_write_enabled: true,
                    browser_enabled: false,
                    allowed_commands: vec![],
                },
                memory: MemoryConfig {
                    memory_type: "sqlite".to_string(),
                    path: None,
                    embedding_model: None,
                },
                security: SecurityConfig {
                    policy_enabled: true,
                    require_approval_for: vec!["shell_write".to_string()],
                    webhook_secret: None,
                },
            },
            sessions: vec![],
            messages: vec![],
            agents: vec![],
            channels: vec![],
            skills: vec![],
            cron_jobs: vec![],
            job_history: vec![],
            providers: vec![
                Provider {
                    provider_type: "openrouter".to_string(),
                    name: "OpenRouter".to_string(),
                    enabled: true,
                    models: vec!["anthropic/claude-3.5-sonnet".to_string()],
                    api_key_set: false,
                },
                Provider {
                    provider_type: "anthropic".to_string(),
                    name: "Anthropic".to_string(),
                    enabled: false,
                    models: vec!["claude-sonnet-4-5-20250929".to_string()],
                    api_key_set: false,
                },
                Provider {
                    provider_type: "openai".to_string(),
                    name: "OpenAI".to_string(),
                    enabled: false,
                    models: vec!["gpt-4".to_string(), "gpt-3.5-turbo".to_string()],
                    api_key_set: false,
                },
                Provider {
                    provider_type: "gemini".to_string(),
                    name: "Gemini".to_string(),
                    enabled: false,
                    models: vec!["gemini-pro".to_string()],
                    api_key_set: false,
                },
                Provider {
                    provider_type: "ollama".to_string(),
                    name: "Ollama".to_string(),
                    enabled: false,
                    models: vec!["llama2".to_string()],
                    api_key_set: false,
                },
                Provider {
                    provider_type: "zhipu".to_string(),
                    name: "Zhipu AI".to_string(),
                    enabled: false,
                    models: vec!["glm-4".to_string()],
                    api_key_set: false,
                },
            ],
            usage: vec![],
            current_session_id: None,
            app_handle: None,
        }
    }
}

// ============================================================================
// Gateway Commands
// ============================================================================

#[tauri::command]
pub fn get_gateway_status() -> Result<GatewayStatus, String> {
    Ok(GatewayStatus {
        state: "running".to_string(),
        pid: Some(std::process::id()),
        port: Some(37373),
        connected_at: Some(Utc::now().to_rfc3339()),
        version: Some(env!("CARGO_PKG_VERSION").to_string()),
    })
}

#[tauri::command]
pub async fn start_gateway() -> Result<(), String> {
    info!("Gateway start requested via UI command");

    // This command is now a no-op since auto-start is enabled in dev mode
    // The sidecar will be started automatically in lib.rs setup
    Ok(())
}

#[tauri::command]
pub async fn stop_gateway() -> Result<(), String> {
    info!("Stopping gateway...");
    // TODO: Implement sidecar stop
    Ok(())
}

#[tauri::command]
pub async fn restart_gateway() -> Result<(), String> {
    info!("Restarting gateway...");
    // TODO: Implement sidecar restart
    Ok(())
}

// ============================================================================
// Config Commands
// ============================================================================

#[tauri::command]
pub fn get_config(state: State<'_, Arc<Mutex<AppState>>>) -> Result<Config, String> {
    let state = state.blocking_lock();

    info!("get_config called, returning {} providers", state.providers.len());

    // Convert providers to ProviderConfig format
    let provider_configs: Vec<ProviderConfig> = state.providers.iter().map(|p| {
        info!("  Returning provider: {} (enabled={}, api_key_set={})",
            p.provider_type, p.enabled, p.api_key_set);
        ProviderConfig {
            provider_type: p.provider_type.clone(),
            name: p.name.clone(),
            api_key: if p.api_key_set { Some("*****".to_string()) } else { None },
            base_url: None,
            model: p.models.first().cloned().unwrap_or_else(|| "default".to_string()),
            enabled: p.enabled,
        }
    }).collect();

    // Return config with populated providers
    Ok(Config {
        identifier: state.config.identifier.clone(),
        version: state.config.version.clone(),
        providers: provider_configs,
        channels: state.config.channels.clone(),
        tools: state.config.tools.clone(),
        memory: state.config.memory.clone(),
        security: state.config.security.clone(),
    })
}

#[tauri::command]
pub async fn update_config(
    state: State<'_, Arc<Mutex<AppState>>>,
    config: Config,
) -> Result<(), String> {
    info!("=== update_config called ===");
    info!("Total providers: {}", config.providers.len());

    // Log all providers in detail
    for (i, p) in config.providers.iter().enumerate() {
        info!("Provider[{}] {}:", i, p.provider_type);
        info!("  enabled: {}", p.enabled);
        info!("  has_api_key: {}", p.api_key.is_some());
        info!("  api_key_length: {:?}", p.api_key.as_ref().map(|k| k.len()));
        info!("  model: {}", p.model);
        info!("  base_url: {:?}", p.base_url);
    }

    let mut state = state.lock().await;

    // Update config
    state.config = Config {
        identifier: config.identifier.clone(),
        version: config.version.clone(),
        providers: config.providers.clone(),
        channels: config.channels.clone(),
        tools: config.tools.clone(),
        memory: config.memory.clone(),
        security: config.security.clone(),
    };

    // Sync providers state
    for provider_config in &config.providers {
        info!("Syncing provider: {}", provider_config.provider_type);
        if let Some(provider) = state.providers.iter_mut().find(|p| p.provider_type == provider_config.provider_type) {
            provider.enabled = provider_config.enabled;
            provider.api_key_set = provider_config.api_key.is_some() && !provider_config.api_key.as_ref().map(|k| k.is_empty()).unwrap_or(true);
            // Update models if changed
            if !provider_config.model.is_empty() {
                provider.models = vec![provider_config.model.clone()];
            }
        }
    }

    // Save provider API keys to config file
    info!("Attempting to save provider configs...");
    match save_provider_config_to_file(&config).await {
        Ok(_) => info!("Provider configs saved successfully"),
        Err(e) => {
            error!("Failed to save provider configs: {}", e);
            return Err(e);
        }
    }

    if let Some(handle) = &state.app_handle {
        let _ = handle.emit("config_updated", &state.config);
    }

    info!("Configuration updated and saved");
    Ok(())
}

/// Save provider configurations to ZeroClaw config file
async fn save_provider_config_to_file(config: &Config) -> Result<(), String> {
    use std::fs;

    // Get ZeroClaw config directory
    let config_dir: PathBuf = std::env::var("HOME")
        .map(|home| PathBuf::from(home).join(".zeroclaw"))
        .unwrap_or_else(|_| PathBuf::from("/tmp/zeroclaw-desktop"));

    // Ensure config directory exists
    fs::create_dir_all(&config_dir)
        .map_err(|e| format!("Failed to create config directory: {}", e))?;

    let config_path = config_dir.join("config.toml");

    // Read existing config or create new one
    let existing_config = if config_path.exists() {
        fs::read_to_string(&config_path)
            .map_err(|e| format!("Failed to read config: {}", e))?
    } else {
        String::new()
    };

    // Build provider config sections
    let mut provider_sections = String::new();

    for provider in &config.providers {
        info!("Processing provider: type={}, enabled={}, has_key={}",
            provider.provider_type, provider.enabled,
            provider.api_key.is_some());

        // Skip if no API key
        let api_key = match &provider.api_key {
            Some(key) if !key.is_empty() => key.clone(),
            _ => {
                info!("  Skipping {}: no API key or empty", provider.provider_type);
                continue;
            }
        };

        // Skip if not enabled and no API key (redundant check for clarity)
        if !provider.enabled && api_key.is_empty() {
            info!("  Skipping {}: not enabled and no API key", provider.provider_type);
            continue;
        }

        let section_name = match provider.provider_type.as_str() {
            "openrouter" => "openrouter",
            "anthropic" => "anthropic",
            "openai" => "openai",
            "gemini" => "google",  // Gemini uses google provider
            "zhipu" => "zhipu",
            "ollama" => "ollama",
            _ => {
                info!("  Unknown provider type: {}", provider.provider_type);
                continue;
            }
        };

        info!("  Adding section: [model_providers.{}]", section_name);

        provider_sections.push_str(&format!(
            "\n[model_providers.{}]\n",
            section_name
        ));

        // Add API key
        provider_sections.push_str(&format!("api_key = \"{}\"\n", escape_toml_string(&api_key)));

        // Add base_url if provided
        if let Some(base_url) = &provider.base_url {
            if !base_url.is_empty() {
                provider_sections.push_str(&format!("base_url = \"{}\"\n", escape_toml_string(base_url)));
            }
        }

        // Add name for openrouter
        if section_name == "openrouter" {
            provider_sections.push_str("name = \"OpenRouter\"\n");
        }
    }

    if provider_sections.is_empty() {
        info!("No provider sections to save");
        return Ok(());
    }

    info!("Writing config sections:\n{}", provider_sections);

    // Merge with existing config by removing old model_providers sections
    let cleaned_config = remove_model_provider_sections(&existing_config);
    let new_config = format!("{}{}", cleaned_config, provider_sections);

    // Write config file
    fs::write(&config_path, new_config)
        .map_err(|e| format!("Failed to write config: {}", e))?;

    info!("Provider config saved to {:?}", config_path);
    Ok(())
}

/// Remove all [model_providers.xxx] sections from config (except the empty [model_providers] section)
fn remove_model_provider_sections(config: &str) -> String {
    let mut result = String::new();
    let mut in_provider_section = false;

    for line in config.lines() {
        let trimmed = line.trim();

        // Skip individual provider sections like [model_providers.zhipu]
        if trimmed.starts_with("[model_providers.") && trimmed != "[model_providers]" {
            in_provider_section = true;
            continue;
        }

        // End of provider section (next section starts)
        if trimmed.starts_with('[') && in_provider_section {
            in_provider_section = false;
            // Don't skip this line, it's the next section
        }

        // Skip lines only if we're inside a provider section
        if !in_provider_section {
            result.push_str(line);
            result.push('\n');
        }
    }

    result
}

fn escape_toml_string(s: &str) -> String {
    s.replace('\\', "\\\\")
         .replace('"', "\\\"")
         .replace('\n', "\\n")
}

// ============================================================================
// Session Commands
// ============================================================================

#[tauri::command]
pub fn list_sessions(state: State<'_, Arc<Mutex<AppState>>>) -> Result<Vec<Session>, String> {
    let state = state.blocking_lock();
    Ok(state.sessions.clone())
}

#[tauri::command]
pub async fn create_session(
    state: State<'_, Arc<Mutex<AppState>>>,
    name: Option<String>,
    agent_id: Option<String>,
) -> Result<Session, String> {
    let mut state = state.lock().await;
    let now = Utc::now().to_rfc3339();
    
    let session = Session {
        id: Uuid::new_v4().to_string(),
        name: name.unwrap_or_else(|| "New Chat".to_string()),
        created_at: now.clone(),
        updated_at: now,
        message_count: 0,
    };
    
    let _ = agent_id; // Reserved for future use
    
    state.sessions.insert(0, session.clone());
    state.current_session_id = Some(session.id.clone());
    
    if let Some(handle) = &state.app_handle {
        let _ = handle.emit("session_created", &session);
    }
    
    info!("Session created: {}", session.id);
    Ok(session)
}

#[tauri::command]
pub async fn delete_session(
    state: State<'_, Arc<Mutex<AppState>>>,
    id: String,
) -> Result<(), String> {
    let mut state = state.lock().await;
    let initial_len = state.sessions.len();
    state.sessions.retain(|s| s.id != id);
    
    if state.sessions.len() < initial_len {
        if state.current_session_id.as_ref() == Some(&id) {
            state.current_session_id = state.sessions.first().map(|s| s.id.clone());
        }
        info!("Session deleted: {}", id);
        Ok(())
    } else {
        Err("Session not found".to_string())
    }
}

// ============================================================================
// Message Commands
// ============================================================================

#[tauri::command]
pub fn get_messages(
    state: State<'_, Arc<Mutex<AppState>>>,
    session_id: String,
) -> Result<Vec<Message>, String> {
    let state = state.blocking_lock();
    Ok(state.messages.iter().filter(|m| m.session_id == session_id).cloned().collect())
}

#[tauri::command]
pub async fn stream_response(
    state: State<'_, Arc<Mutex<AppState>>>,
    window: Window,
    session_id: String,
    prompt: String,
) -> Result<(), String> {
    let mut state = state.lock().await;

    // Add user message to state (don't emit event since frontend already added it optimistically)
    let user_msg = Message {
        id: Uuid::new_v4().to_string(),
        session_id: session_id.clone(),
        role: "user".to_string(),
        content: prompt.clone(),
        created_at: Utc::now().to_rfc3339(),
        metadata: None,
    };
    state.messages.push(user_msg.clone());

    // Don't emit message_new for user messages to avoid duplicates
    // Frontend already adds user messages optimistically

    // Try to use real ZeroClaw gateway via WebSocket
    let gateway_url = "ws://127.0.0.1:37373/ws/chat";

    // Note: Gateway may require pairing token. In dev mode, we'll try without first.
    match tokio_tungstenite::connect_async(gateway_url).await {
        Ok((ws_stream, _)) => {
            info!("Connected to ZeroClaw gateway");

            let (mut ws_sender, mut ws_receiver) = ws_stream.split();

            // Send message to gateway
            let request = serde_json::json!({
                "type": "message",
                "content": prompt
            });

            if let Err(e) = ws_sender.send(tokio_tungstenite::tungstenite::Message::Text(
                request.to_string()
            )).await {
                let error_msg = format!("Failed to send message to gateway: {}", e);
                error!("{}", error_msg);

                // Send error chunk
                let error_chunk = StreamChunk {
                    chunk_type: "error".to_string(),
                    content: Some(error_msg.clone()),
                    data: None,
                };
                let _ = window.emit("stream_chunk", &error_chunk);

                return Err(error_msg);
            }

            // Receive response
            let mut full_response = String::new();
            let mut message_count = 0;

            while let Some(msg_result) = ws_receiver.next().await {
                match msg_result {
                    Ok(msg) => {
                        if msg.is_text() {
                            if let Ok(text) = msg.to_text() {
                                info!("Gateway response: {}", text);
                                if let Ok(json) = serde_json::from_str::<serde_json::Value>(&text) {
                                    let msg_type = json["type"].as_str().unwrap_or("");
                                    info!("Message type: {}", msg_type);

                                    match msg_type {
                                        "done" => {
                                            if let Some(response) = json["full_response"].as_str() {
                                                full_response = response.to_string();
                                            }
                                            info!("Gateway done, full response length: {}", full_response.len());
                                            break;
                                        }
                                        "chunk" => {
                                            if let Some(chunk) = json["content"].as_str() {
                                                message_count += 1;
                                                info!("Received chunk {} ({} chars)", message_count, chunk.len());
                                                let stream_chunk = StreamChunk {
                                                    chunk_type: "text".to_string(),
                                                    content: Some(chunk.to_string()),
                                                    data: None,
                                                };
                                                let _ = window.emit("stream_chunk", &stream_chunk);
                                                full_response.push_str(chunk);
                                            }
                                        }
                                        "error" => {
                                            let error_msg = json["message"].as_str().unwrap_or("Unknown error");
                                            error!("Gateway error: {}", error_msg);
                                            let error_chunk = StreamChunk {
                                                chunk_type: "error".to_string(),
                                                content: Some(error_msg.to_string()),
                                                data: None,
                                            };
                                            let _ = window.emit("stream_chunk", &error_chunk);
                                            return Err(error_msg.to_string());
                                        }
                                        _ => {
                                            info!("Unknown message type: {}", msg_type);
                                        }
                                    }
                                } else {
                                    warn!("Failed to parse JSON: {}", text);
                                }
                            }
                        } else if msg.is_close() {
                            info!("WebSocket closed by gateway");
                            break;
                        }
                    }
                    Err(e) => {
                        error!("WebSocket error: {}", e);
                        break;
                    }
                }
            }

            if full_response.is_empty() {
                warn!("Gateway returned empty response");
            }

            // Add assistant message
            let assistant_msg = Message {
                id: Uuid::new_v4().to_string(),
                session_id: session_id.clone(),
                role: "assistant".to_string(),
                content: full_response,
                created_at: Utc::now().to_rfc3339(),
                metadata: None,
            };
            state.messages.push(assistant_msg.clone());

            info!("About to emit message_new, app_handle exists: {}", state.app_handle.is_some());
            if let Some(handle) = &state.app_handle {
                info!("Emitting message_new event for message: {}", assistant_msg.id);
                match handle.emit("message_new", &assistant_msg) {
                    Ok(_) => info!("message_new event emitted successfully"),
                    Err(e) => error!("Failed to emit message_new: {}", e),
                }
            } else {
                warn!("app_handle is None, cannot emit message_new event");
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
        Err(e) => {
            // Fallback to simulated response if gateway is not available
            warn!("Failed to connect to ZeroClaw gateway: {}, using simulated response", e);

            // Simulate streaming response
            let response_chunks = vec![
                "Hello",
                "! ",
                "I'm ",
                "ZeroClaw, ",
                "your ",
                "AI ",
                "assistant. ",
                "Note: ",
                "Gateway ",
                "is ",
                "not ",
                "available. ",
                "Please ",
                "start ",
                "the ",
                "ZeroClaw ",
                "gateway ",
                "to ",
                "use ",
                "real ",
                "AI ",
                "responses.",
            ];

            let mut full_response = String::new();

            for chunk_text in response_chunks {
                let chunk = StreamChunk {
                    chunk_type: "text".to_string(),
                    content: Some(chunk_text.to_string()),
                    data: None,
                };

                let _ = window.emit("stream_chunk", &chunk);
                full_response.push_str(chunk_text);
                tokio::time::sleep(tokio::time::Duration::from_millis(50)).await;
            }

            // Add assistant message
            let assistant_msg = Message {
                id: Uuid::new_v4().to_string(),
                session_id: session_id.clone(),
                role: "assistant".to_string(),
                content: full_response,
                created_at: Utc::now().to_rfc3339(),
                metadata: None,
            };
            state.messages.push(assistant_msg.clone());

            if let Some(handle) = &state.app_handle {
                let _ = handle.emit("message_new", &assistant_msg);
            }

            // Send done signal
            let done_chunk = StreamChunk {
                chunk_type: "done".to_string(),
                content: None,
                data: None,
            };
            let _ = window.emit("stream_chunk", &done_chunk);

            info!("Streamed simulated response for session: {}", session_id);
            Ok(())
        }
    }
}

// ============================================================================
// Agent Commands
// ============================================================================

#[tauri::command]
pub fn list_agents(state: State<'_, Arc<Mutex<AppState>>>) -> Result<Vec<Agent>, String> {
    let state = state.blocking_lock();
    Ok(state.agents.clone())
}

#[tauri::command]
pub async fn create_agent(
    state: State<'_, Arc<Mutex<AppState>>>,
    input: AgentInput,
) -> Result<Agent, String> {
    let mut state = state.lock().await;
    let now = Utc::now().to_rfc3339();
    
    let agent = Agent {
        id: Uuid::new_v4().to_string(),
        name: input.name,
        enabled: true,
        channels: Some(vec![]),
        created_at: Some(now.clone()),
        updated_at: Some(now),
    };
    
    state.agents.push(agent.clone());
    info!("Agent created: {}", agent.id);
    Ok(agent)
}

#[tauri::command]
pub async fn delete_agent(
    state: State<'_, Arc<Mutex<AppState>>>,
    id: String,
) -> Result<(), String> {
    let mut state = state.lock().await;
    let initial_len = state.agents.len();
    state.agents.retain(|a| a.id != id);
    
    if state.agents.len() < initial_len {
        info!("Agent deleted: {}", id);
        Ok(())
    } else {
        Err("Agent not found".to_string())
    }
}

#[tauri::command]
pub async fn update_agent(
    state: State<'_, Arc<Mutex<AppState>>>,
    id: String,
    updates: AgentUpdate,
) -> Result<Agent, String> {
    let mut state = state.lock().await;
    
    if let Some(agent) = state.agents.iter_mut().find(|a| a.id == id) {
        if let Some(name) = updates.name {
            agent.name = name;
        }
        if let Some(enabled) = updates.enabled {
            agent.enabled = enabled;
        }
        if let Some(channels) = updates.channels {
            agent.channels = Some(channels);
        }
        agent.updated_at = Some(Utc::now().to_rfc3339());
        info!("Agent updated: {}", id);
        Ok(agent.clone())
    } else {
        Err("Agent not found".to_string())
    }
}

// ============================================================================
// Channel Commands
// ============================================================================

#[tauri::command]
pub fn list_channels(state: State<'_, Arc<Mutex<AppState>>>) -> Result<Vec<Channel>, String> {
    let state = state.blocking_lock();
    Ok(state.channels.clone())
}

#[tauri::command]
pub async fn add_channel(
    state: State<'_, Arc<Mutex<AppState>>>,
    input: ChannelInput,
) -> Result<Channel, String> {
    let mut state = state.lock().await;
    
    let channel = Channel {
        id: Uuid::new_v4().to_string(),
        channel_type: input.channel_type,
        name: "New Channel".to_string(),
        enabled: true,
        status: "connected".to_string(),
        config: input.config,
        created_at: Some(Utc::now().to_rfc3339()),
    };
    
    state.channels.push(channel.clone());
    info!("Channel added: {}", channel.id);
    Ok(channel)
}

#[tauri::command]
pub async fn delete_channel(
    state: State<'_, Arc<Mutex<AppState>>>,
    id: String,
) -> Result<(), String> {
    let mut state = state.lock().await;
    let initial_len = state.channels.len();
    state.channels.retain(|c| c.id != id);
    
    if state.channels.len() < initial_len {
        info!("Channel deleted: {}", id);
        Ok(())
    } else {
        Err("Channel not found".to_string())
    }
}

#[tauri::command]
pub async fn test_channel(
    _state: State<'_, Arc<Mutex<AppState>>>,
    id: String,
) -> Result<bool, String> {
    info!("Testing channel: {}", id);
    Ok(true)
}

// ============================================================================
// Provider Commands
// ============================================================================

#[tauri::command]
pub fn list_providers(state: State<'_, Arc<Mutex<AppState>>>) -> Result<Vec<Provider>, String> {
    let state = state.blocking_lock();
    Ok(state.providers.clone())
}

#[tauri::command]
pub async fn update_provider(
    state: State<'_, Arc<Mutex<AppState>>>,
    provider_type: String,
    updates: ProviderUpdate,
) -> Result<Provider, String> {
    let mut state = state.lock().await;
    
    if let Some(provider) = state.providers.iter_mut().find(|p| p.provider_type == provider_type) {
        if let Some(enabled) = updates.enabled {
            provider.enabled = enabled;
        }
        if let Some(api_key) = updates.api_key {
            provider.api_key_set = !api_key.is_empty();
        }
        if let Some(models) = updates.models {
            provider.models = models;
        }
        info!("Provider updated: {}", provider_type);
        Ok(provider.clone())
    } else {
        Err("Provider not found".to_string())
    }
}

#[tauri::command]
pub async fn test_provider(
    _state: State<'_, Arc<Mutex<AppState>>>,
    provider_type: String,
) -> Result<bool, String> {
    info!("Testing provider: {}", provider_type);
    Ok(true)
}

#[tauri::command]
pub fn get_usage(
    state: State<'_, Arc<Mutex<AppState>>>,
    window: String,
) -> Result<Vec<ModelUsage>, String> {
    let _ = window; // Use window to filter in real implementation
    let state = state.blocking_lock();
    Ok(state.usage.clone())
}

// ============================================================================
// Skill Commands
// ============================================================================

#[tauri::command]
pub fn list_skills(state: State<'_, Arc<Mutex<AppState>>>) -> Result<Vec<Skill>, String> {
    let state = state.blocking_lock();
    Ok(state.skills.clone())
}

#[tauri::command]
pub async fn toggle_skill(
    state: State<'_, Arc<Mutex<AppState>>>,
    id: String,
    enabled: bool,
) -> Result<(), String> {
    let mut state = state.lock().await;
    
    if let Some(skill) = state.skills.iter_mut().find(|s| s.id == id) {
        skill.enabled = enabled;
        info!("Skill {} toggled: {}", id, enabled);
        Ok(())
    } else {
        Err("Skill not found".to_string())
    }
}

#[tauri::command]
pub async fn install_skill(
    state: State<'_, Arc<Mutex<AppState>>>,
    input: SkillInput,
) -> Result<Skill, String> {
    let mut state = state.lock().await;
    
    let skill = Skill {
        id: Uuid::new_v4().to_string(),
        name: input.name,
        description: "New skill".to_string(),
        enabled: true,
        is_bundled: false,
        source: Some("user-installed".to_string()),
        author: Some("Unknown".to_string()),
        version: Some("1.0.0".to_string()),
        config: None,
    };
    
    state.skills.push(skill.clone());
    info!("Skill installed: {}", skill.id);
    Ok(skill)
}

#[tauri::command]
pub async fn uninstall_skill(
    state: State<'_, Arc<Mutex<AppState>>>,
    id: String,
) -> Result<(), String> {
    let mut state = state.lock().await;
    let initial_len = state.skills.len();
    state.skills.retain(|s| s.id != id);
    
    if state.skills.len() < initial_len {
        info!("Skill uninstalled: {}", id);
        Ok(())
    } else {
        Err("Skill not found".to_string())
    }
}

// ============================================================================
// Cron Commands
// ============================================================================

#[tauri::command]
pub fn list_cron_jobs(state: State<'_, Arc<Mutex<AppState>>>) -> Result<Vec<CronJob>, String> {
    let state = state.blocking_lock();
    Ok(state.cron_jobs.clone())
}

#[tauri::command]
pub async fn create_cron_job(
    state: State<'_, Arc<Mutex<AppState>>>,
    input: CronJobInput,
) -> Result<CronJob, String> {
    let mut state = state.lock().await;
    let now = Utc::now().to_rfc3339();
    
    let job = CronJob {
        id: Uuid::new_v4().to_string(),
        name: input.name,
        schedule: input.schedule,
        schedule_type: input.schedule_type,
        command: input.command,
        args: input.args,
        enabled: input.enabled,
        last_run: None,
        next_run: Some(now.clone()),
        last_status: Some("pending".to_string()),
        created_at: Some(now),
    };
    
    state.cron_jobs.push(job.clone());
    info!("Cron job created: {}", job.id);
    Ok(job)
}

#[tauri::command]
pub async fn delete_cron_job(
    state: State<'_, Arc<Mutex<AppState>>>,
    id: String,
) -> Result<(), String> {
    let mut state = state.lock().await;
    let initial_len = state.cron_jobs.len();
    state.cron_jobs.retain(|j| j.id != id);
    
    if state.cron_jobs.len() < initial_len {
        info!("Cron job deleted: {}", id);
        Ok(())
    } else {
        Err("Cron job not found".to_string())
    }
}

#[tauri::command]
pub async fn update_cron_job(
    state: State<'_, Arc<Mutex<AppState>>>,
    id: String,
    updates: CronJobUpdate,
) -> Result<CronJob, String> {
    let mut state = state.lock().await;
    
    if let Some(job) = state.cron_jobs.iter_mut().find(|j| j.id == id) {
        if let Some(name) = updates.name {
            job.name = name;
        }
        if let Some(schedule) = updates.schedule {
            job.schedule = schedule;
        }
        if let Some(command) = updates.command {
            job.command = command;
        }
        if let Some(args) = updates.args {
            job.args = Some(args);
        }
        if let Some(enabled) = updates.enabled {
            job.enabled = enabled;
        }
        info!("Cron job updated: {}", id);
        Ok(job.clone())
    } else {
        Err("Cron job not found".to_string())
    }
}

#[tauri::command]
pub async fn toggle_cron_job(
    state: State<'_, Arc<Mutex<AppState>>>,
    id: String,
    enabled: bool,
) -> Result<(), String> {
    let mut state = state.lock().await;
    
    if let Some(job) = state.cron_jobs.iter_mut().find(|j| j.id == id) {
        job.enabled = enabled;
        info!("Cron job {} toggled: {}", id, enabled);
        Ok(())
    } else {
        Err("Cron job not found".to_string())
    }
}

#[tauri::command]
pub async fn run_cron_job(
    state: State<'_, Arc<Mutex<AppState>>>,
    id: String,
) -> Result<(), String> {
    let mut state = state.lock().await;
    
    if let Some(job) = state.cron_jobs.iter_mut().find(|j| j.id == id) {
        job.last_status = Some("running".to_string());
        info!("Cron job running: {}", id);
        
        // Update status after completion
        job.last_status = Some("success".to_string());
        job.last_run = Some(Utc::now().to_rfc3339());
        
        Ok(())
    } else {
        Err("Cron job not found".to_string())
    }
}

#[tauri::command]
pub fn get_cron_job_history(
    state: State<'_, Arc<Mutex<AppState>>>,
    id: String,
    limit: Option<u32>,
) -> Result<Vec<JobRun>, String> {
    let state = state.blocking_lock();
    let limit = limit.unwrap_or(10) as usize;
    
    Ok(state.job_history
        .iter()
        .filter(|r| r.job_id == id)
        .take(limit)
        .cloned()
        .collect())
}

// ============================================================================
// App State Initialization
// ============================================================================

pub async fn init_app_state(
    state: State<'_, Arc<Mutex<AppState>>>,
    app_handle: AppHandle,
) {
    let mut state = state.lock().await;
    state.app_handle = Some(app_handle);
}
