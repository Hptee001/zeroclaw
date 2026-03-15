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
            commands::get_version,
            commands::get_config,
            commands::update_config,
            commands::list_sessions,
            commands::create_session,
            commands::get_session,
            commands::delete_session,
            commands::get_messages,
            commands::send_message,
            commands::stream_response,
            commands::execute_tool,
            commands::start_sidecar,
            commands::stop_sidecar,
            commands::sidecar_status,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
