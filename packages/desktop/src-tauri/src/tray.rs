//! System tray placeholder for ZeroClaw Desktop

use log::info;

/// Initialize the system tray (placeholder)
pub fn init_tray(_app: &tauri::AppHandle) -> Result<(), tauri::Error> {
    info!("System tray initialization (placeholder - full implementation coming soon)");
    Ok(())
}
