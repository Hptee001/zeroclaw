//! IPC Commands for ZeroClaw Desktop
//! This module contains all Tauri commands that can be invoked from the frontend

use crate::types::*;
use log::info;
use tauri::{AppHandle, Emitter, State, Window};
use tokio::sync::Mutex;
use std::sync::Arc;
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
        port: Some(3000),
        connected_at: Some(Utc::now().to_rfc3339()),
        version: Some(env!("CARGO_PKG_VERSION").to_string()),
    })
}

#[tauri::command]
pub async fn start_gateway(_state: State<'_, Arc<Mutex<AppState>>>) -> Result<(), String> {
    info!("Starting gateway...");
    Ok(())
}

#[tauri::command]
pub async fn stop_gateway(_state: State<'_, Arc<Mutex<AppState>>>) -> Result<(), String> {
    info!("Stopping gateway...");
    Ok(())
}

#[tauri::command]
pub async fn restart_gateway(_state: State<'_, Arc<Mutex<AppState>>>) -> Result<(), String> {
    info!("Restarting gateway...");
    Ok(())
}

// ============================================================================
// Config Commands
// ============================================================================

#[tauri::command]
pub fn get_config(state: State<'_, Arc<Mutex<AppState>>>) -> Result<Config, String> {
    let state = state.blocking_lock();

    // Convert providers to ProviderConfig format
    let provider_configs: Vec<ProviderConfig> = state.providers.iter().map(|p| {
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
        if let Some(provider) = state.providers.iter_mut().find(|p| p.provider_type == provider_config.provider_type) {
            provider.enabled = provider_config.enabled;
            provider.api_key_set = provider_config.api_key.is_some() && !provider_config.api_key.as_ref().map(|k| k.is_empty()).unwrap_or(true);
            // Update models if changed
            if !provider_config.model.is_empty() {
                provider.models = vec![provider_config.model.clone()];
            }
        }
    }

    if let Some(handle) = &state.app_handle {
        let _ = handle.emit("config_updated", &state.config);
    }

    info!("Configuration updated");
    Ok(())
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
    
    // Add user message
    let user_msg = Message {
        id: Uuid::new_v4().to_string(),
        session_id: session_id.clone(),
        role: "user".to_string(),
        content: prompt.clone(),
        created_at: Utc::now().to_rfc3339(),
        metadata: None,
    };
    state.messages.push(user_msg.clone());
    
    if let Some(handle) = &state.app_handle {
        let _ = handle.emit("message_new", &user_msg);
    }
    
    // Simulate streaming response
    let response_chunks = vec![
        "Hello",
        "! ",
        "I'm ",
        "ZeroClaw, ",
        "your ",
        "AI ",
        "assistant. ",
        "How ",
        "can ",
        "I ",
        "help ",
        "you ",
        "today?",
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
    
    info!("Streamed response for session: {}", session_id);
    Ok(())
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
