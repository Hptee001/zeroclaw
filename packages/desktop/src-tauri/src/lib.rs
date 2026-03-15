// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

pub mod commands;
pub mod sidecar;
pub mod tray;
pub mod types;

use commands::AppState;
use log::info;
use sidecar::{SidecarConfig, SidecarManager};
use std::sync::Arc;
use tauri::Manager;
use tokio::sync::Mutex;

pub fn run() {
    // Initialize logging
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info")).init();
    
    info!("Starting ZeroClaw Desktop...");

    let app_state = Arc::new(Mutex::new(AppState::default()));
    let sidecar_manager = Arc::new(Mutex::new(SidecarManager::new(SidecarConfig::default())));

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_process::init())
        .manage(app_state)
        .manage(sidecar_manager)
        .setup(|app| {
            // Initialize system tray
            tray::init_tray(app.handle())?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Gateway
            commands::get_gateway_status,
            commands::start_gateway,
            commands::stop_gateway,
            commands::restart_gateway,
            // Config
            commands::get_config,
            commands::update_config,
            // Sessions
            commands::list_sessions,
            commands::create_session,
            commands::delete_session,
            // Messages
            commands::get_messages,
            commands::stream_response,
            // Agents
            commands::list_agents,
            commands::create_agent,
            commands::delete_agent,
            commands::update_agent,
            // Channels
            commands::list_channels,
            commands::add_channel,
            commands::delete_channel,
            commands::test_channel,
            // Providers
            commands::list_providers,
            commands::update_provider,
            commands::test_provider,
            commands::get_usage,
            // Skills
            commands::list_skills,
            commands::toggle_skill,
            commands::install_skill,
            commands::uninstall_skill,
            // Cron
            commands::list_cron_jobs,
            commands::create_cron_job,
            commands::delete_cron_job,
            commands::update_cron_job,
            commands::toggle_cron_job,
            commands::run_cron_job,
            commands::get_cron_job_history,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
