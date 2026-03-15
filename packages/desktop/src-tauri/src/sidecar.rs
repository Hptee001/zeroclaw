//! Sidecar manager for running the zeroclaw CLI as a subprocess

use log::info;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tokio::process::Child;
use tokio::sync::mpsc;

/// Sidecar configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SidecarConfig {
    pub enabled: bool,
    pub path: Option<PathBuf>,
    pub args: Vec<String>,
}

impl Default for SidecarConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            path: None,
            args: vec!["--daemon".to_string()],
        }
    }
}

/// Sidecar manager
pub struct SidecarManager {
    pub config: SidecarConfig,
    pub child: Option<Child>,
    #[allow(dead_code)]
    pub tx: mpsc::Sender<SidecarMessage>,
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
        Self {
            config,
            child: None,
            tx,
        }
    }

    /// Start the sidecar process
    pub async fn start(&mut self) -> Result<(), String> {
        if !self.config.enabled {
            info!("Sidecar is disabled");
            return Ok(());
        }

        // For now, just log that sidecar would start
        // Full implementation would spawn the zeroclaw CLI
        info!("Sidecar start requested (placeholder implementation)");
        Ok(())
    }

    /// Stop the sidecar process
    pub async fn stop(&mut self) -> Result<(), String> {
        if self.child.is_some() {
            info!("Stopping sidecar...");
            self.child = None;
            info!("Sidecar stopped");
        }
        Ok(())
    }
}
