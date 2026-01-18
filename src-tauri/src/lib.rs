// Rainy Cowork - Main Library
// Tauri 2 backend with AI workspace agent capabilities

mod ai;
mod commands;
mod models;
mod services;

use ai::AIProviderManager;
use services::{FileManager, TaskManager};
use std::sync::Arc;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize AI provider manager as Arc for sharing
    let ai_provider = Arc::new(AIProviderManager::new());

    // Initialize task manager with Arc clone
    let task_manager = TaskManager::new(ai_provider.clone());

    // Initialize file manager
    let file_manager = FileManager::new();

    tauri::Builder::default()
        // Plugins
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        // Managed state - Arc<AIProviderManager> for both TaskManager and AI commands
        .manage(task_manager)
        .manage(file_manager)
        .manage(ai_provider) // Arc<AIProviderManager>
        // Commands
        .invoke_handler(tauri::generate_handler![
            // Task commands
            commands::create_task,
            commands::execute_task,
            commands::pause_task,
            commands::resume_task,
            commands::cancel_task,
            commands::get_task,
            commands::list_tasks,
            // AI commands
            commands::list_providers,
            commands::validate_api_key,
            commands::store_api_key,
            commands::get_api_key,
            commands::delete_api_key,
            commands::has_api_key,
            commands::get_provider_models,
            // File commands
            commands::select_workspace,
            commands::set_workspace,
            commands::get_workspace,
            commands::list_directory,
            commands::read_file,
            commands::write_file,
            commands::create_snapshot,
            commands::rollback_file,
            commands::list_file_changes,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
