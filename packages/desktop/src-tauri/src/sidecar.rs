//! Sidecar manager for running the zeroclaw CLI as a subprocess

use log::{error, info, warn};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::process::Stdio;
use std::sync::atomic::{AtomicBool, Ordering};
use tokio::process::{Child, Command};
use tokio::sync::mpsc;
use tokio::time::{sleep, Duration};
use tokio_tungstenite as _; // Import for WebSocket connection check

// Global flag to prevent multiple gateway instances
static GATEWAY_STARTED: AtomicBool = AtomicBool::new(false);

/// Sidecar configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SidecarConfig {
    pub enabled: bool,
    pub auto_start: bool,
    pub path: Option<PathBuf>,
    pub args: Vec<String>,
}

impl Default for SidecarConfig {
    fn default() -> Self {
        // Use home directory to construct config path
        let config_dir = home::home_dir()
            .map(|h| h.join(".zeroclaw"))
            .unwrap_or_else(|| PathBuf::from("/tmp/zeroclaw-desktop"));

        Self {
            enabled: true,
            auto_start: true,
            path: None,
            args: vec![
                "gateway".to_string(),
                "start".to_string(),
                "-p".to_string(),
                "37373".to_string(),
                "--config-dir".to_string(),
                // Convert to absolute path to avoid shell expansion issues
                config_dir.to_string_lossy().to_string(),
            ],
        }
    }
}

/// Sidecar manager
pub struct SidecarManager {
    pub config: SidecarConfig,
    pub child: Option<Child>,
    #[allow(dead_code)]
    pub tx: mpsc::Sender<SidecarMessage>,
    pub port: u16,
    pub ready: bool,
}

/// Messages from sidecar
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum SidecarMessage {
    #[serde(rename = "log")]
    Log { level: String, message: String },
    #[serde(rename = "event")]
    Event { name: String, data: serde_json::Value },
}

impl SidecarManager {
    pub fn new(config: SidecarConfig) -> Self {
        let (tx, _rx) = mpsc::channel(100);

        // Extract port from args
        let port = config.args.iter()
            .position(|a| a == "--port")
            .and_then(|i| config.args.get(i + 1))
            .and_then(|p| p.parse::<u16>().ok())
            .unwrap_or(37373);

        Self {
            config,
            child: None,
            tx,
            port,
            ready: false,
        }
    }

    /// Start the sidecar process
    pub async fn start(&mut self) -> Result<(), String> {
        if !self.config.enabled {
            info!("Sidecar is disabled");
            return Ok(());
        }

        // Check global flag to prevent multiple instances (especially in dev mode with hot reload)
        if GATEWAY_STARTED.load(Ordering::SeqCst) {
            info!("Gateway already started globally, skipping");
            // Try to connect to existing gateway
            if self.check_existing_gateway().await {
                self.ready = true;
                return Ok(());
            }
            // Reset flag if gateway is not actually running
            GATEWAY_STARTED.store(false, Ordering::SeqCst);
        }

        // Check if already running (both child process and ready state)
        if self.child.is_some() && self.ready {
            warn!("Sidecar already running and ready");
            return Ok(());
        }

        if self.child.is_some() {
            warn!("Sidecar child exists but not ready, cleaning up");
            self.cleanup().await;
        }

        // Find zeroclaw binary
        let binary_path = self.find_binary()?;
        info!("Starting sidecar: {:?}", binary_path);

        // Start the process
        let mut cmd = Command::new(&binary_path);
        cmd.args(&self.config.args);

        // Load API keys from config file and set as environment variables
        let config_path = home::home_dir()
            .map(|h| h.join(".zeroclaw/config.toml"))
            .unwrap_or_else(|| PathBuf::from("/tmp/zeroclaw-desktop/config.toml"));

        if let Ok(config_content) = std::fs::read_to_string(&config_path) {
            let mut current_section = String::new();
            let mut current_api_key = String::new();

            for line in config_content.lines() {
                let trimmed = line.trim();

                // Track section
                if trimmed.starts_with('[') && trimmed.ends_with(']') {
                    // Save previous section's API key
                    if !current_section.is_empty() && !current_api_key.is_empty() {
                        set_provider_api_key(&mut cmd, &current_section, &current_api_key);
                    }

                    // Start new section
                    current_section = trimmed[1..trimmed.len() - 1].to_string();
                    current_api_key.clear();
                }
                // Extract api_key from providers section
                else if trimmed.starts_with("api_key") {
                    if let Some(start) = trimmed.find('"') {
                        if let Some(end) = trimmed.rfind('"') {
                            current_api_key = trimmed[start + 1..end].to_string();
                        }
                    }
                }
                // Extract api_keys (key = "value" format)
                else if current_section == "api_keys" && trimmed.contains('=') {
                    if let Some(eq_pos) = trimmed.find('=') {
                        let key = trimmed[..eq_pos].trim();
                        let rest = trimmed[eq_pos + 1..].trim();
                        if let Some(start) = rest.find('"') {
                            if let Some(end) = rest.rfind('"') {
                                let value = rest[start + 1..end].to_string();
                                // Map provider name to env var
                                let env_var = match key {
                                    "zhipu" => Some("GLM_API_KEY"),
                                    "anthropic" => Some("ANTHROPIC_API_KEY"),
                                    "openai" => Some("OPENAI_API_KEY"),
                                    "openrouter" => Some("OPENROUTER_API_KEY"),
                                    "gemini" => Some("GEMINI_API_KEY"),
                                    _ => None,
                                };
                                if let Some(var) = env_var {
                                    cmd.env(var, &value);
                                    info!("Set {} from api_keys section (length: {})", var, value.len());
                                }
                            }
                        }
                    }
                }
            }

            // Save last section's API key
            if !current_section.is_empty() && !current_api_key.is_empty() {
                set_provider_api_key(&mut cmd, &current_section, &current_api_key);
            }
        }

        // Debug: Print environment variables
        info!("Spawning zeroclaw with ZHIPU_API_KEY set");

        let child = cmd
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| format!("Failed to spawn zeroclaw: {}", e))?;

        self.child = Some(child);
        info!("Sidecar started with PID: {:?}", self.child.as_ref().map(|c| c.id()));

        // Wait for gateway to be ready
        self.wait_for_ready().await?;

        // Mark as started globally
        GATEWAY_STARTED.store(true, Ordering::SeqCst);

        Ok(())
    }

    /// Check if an existing gateway is running
    async fn check_existing_gateway(&self) -> bool {
        let url = self.gateway_url();
        match tokio_tungstenite::connect_async(&url).await {
            Ok(_) => {
                info!("Found existing gateway at {}", url);
                true
            }
            Err(_) => false,
        }
    }

    /// Cleanup child process
    async fn cleanup(&mut self) {
        if let Some(mut child) = self.child.take() {
            let _ = child.kill().await;
            let _ = tokio::time::timeout(Duration::from_secs(2), child.wait()).await;
        }
        self.ready = false;
    }

    /// Stop the sidecar process
    pub async fn stop(&mut self) -> Result<(), String> {
        if let Some(mut child) = self.child.take() {
            info!("Stopping sidecar (PID: {:?})...", child.id());

            // Try graceful shutdown first
            match child.kill().await {
                Ok(_) => {
                    // Wait for process to exit
                    match tokio::time::timeout(Duration::from_secs(5), child.wait()).await {
                        Ok(Ok(status)) => {
                            info!("Sidecar stopped with status: {}", status);
                        }
                        Ok(Err(e)) => {
                            error!("Error waiting for sidecar to exit: {}", e);
                        }
                        Err(_) => {
                            warn!("Sidecar did not exit gracefully, forcing kill");
                        }
                    }
                }
                Err(e) => {
                    error!("Failed to kill sidecar: {}", e);
                }
            }

            self.ready = false;

            // Reset global flag
            GATEWAY_STARTED.store(false, Ordering::SeqCst);
        }

        Ok(())
    }

    /// Check if sidecar is running
    pub fn is_running(&self) -> bool {
        self.child.is_some() && self.ready
    }

    /// Get gateway URL
    pub fn gateway_url(&self) -> String {
        format!("ws://127.0.0.1:{}/ws/chat", self.port)
    }

    /// Find zeroclaw binary
    fn find_binary(&self) -> Result<PathBuf, String> {
        // Try explicit path first
        if let Some(ref path) = self.config.path {
            if path.exists() {
                return Ok(path.clone());
            }
            return Err(format!("Configured path does not exist: {:?}", path));
        }

        // Get current executable directory
        let exe_dir = std::env::current_exe()
            .ok()
            .and_then(|p| p.parent().map(|p| p.to_path_buf()))
            .unwrap_or_else(|| std::env::current_dir().unwrap_or_else(|_| PathBuf::from(".")));

        // Try sibling binary (most common in dev and production)
        let candidate = exe_dir.join("zeroclaw");
        if candidate.exists() {
            info!("Found zeroclaw binary at: {:?}", candidate);
            return Ok(candidate);
        }

        // Try PATH
        if let Ok(path) = which::which("zeroclaw") {
            info!("Found zeroclaw in PATH: {:?}", path);
            return Ok(path);
        }

        // Try cargo bin
        if let Some(home) = home::home_dir() {
            let cargo_bin = home.join(".cargo/bin/zeroclaw");
            if cargo_bin.exists() {
                info!("Found zeroclaw in cargo bin: {:?}", cargo_bin);
                return Ok(cargo_bin);
            }
        }

        Err(format!(
            "Could not find zeroclaw binary.\n\
             Searched: {:?}, PATH, ~/.cargo/bin\n\
             Please build with: cargo build --bin zeroclaw",
            candidate
        ))
    }

    /// Wait for gateway to be ready
    async fn wait_for_ready(&mut self) -> Result<(), String> {
        info!("Waiting for gateway to be ready...");

        for attempt in 0..60 {
            sleep(Duration::from_millis(500)).await;

            // Try to connect to the gateway via WebSocket
            let ws_url = self.gateway_url();
            match tokio_tungstenite::connect_async(&ws_url).await {
                Ok(_) => {
                    info!("Gateway is ready! (attempt {})", attempt + 1);
                    self.ready = true;
                    return Ok(());
                }
                Err(_) => {
                    if attempt % 10 == 0 {
                        info!("Waiting for gateway... (attempt {})", attempt + 1);
                    }
                }
            }
        }

        // Gateway not ready, but continue anyway (desktop can work without gateway)
        warn!("Gateway did not become ready, continuing without AI features");
        self.ready = false;
        Ok(())
    }
}

impl Drop for SidecarManager {
    fn drop(&mut self) {
        if self.child.is_some() {
            warn!("SidecarManager dropped without explicit stop, killing child process");
            if let Some(mut child) = self.child.take() {
                let _ = child.kill();
            }
        }
    }
}

/// Set provider API key as environment variable
fn set_provider_api_key(cmd: &mut tokio::process::Command, section: &str, api_key: &str) {
    // Map provider section to environment variable name
    // Based on src/providers/mod.rs resolve_provider_credential()
    let env_var = match section {
        "providers.zhipu" => "GLM_API_KEY",
        "providers.glm" => "GLM_API_KEY",
        "providers.anthropic" => "ANTHROPIC_API_KEY",
        "providers.openai" => "OPENAI_API_KEY",
        "providers.openrouter" => "OPENROUTER_API_KEY",
        "providers.gemini" => "GEMINI_API_KEY",
        _ => return,
    };

    cmd.env(env_var, api_key);
    info!("Set {} from config file (length: {})", env_var, api_key.len());
}
