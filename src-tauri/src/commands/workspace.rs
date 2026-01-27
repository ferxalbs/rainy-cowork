// Rainy Cowork - Workspace Commands
// Tauri commands for advanced workspace management

use crate::services::{Workspace, WorkspaceManager};
use std::sync::Arc;
use tauri::State;
use uuid::Uuid;

/// Create a new workspace
#[tauri::command]
pub async fn create_workspace(
    name: String,
    allowed_paths: Vec<String>,
    workspace_manager: State<'_, Arc<WorkspaceManager>>,
) -> Result<Workspace, String> {
    workspace_manager
        .create_workspace(name, allowed_paths)
        .map_err(|e| e.to_string())
}

/// Load a workspace by ID
#[tauri::command]
pub async fn load_workspace(
    id: String,
    workspace_manager: State<'_, Arc<WorkspaceManager>>,
) -> Result<Workspace, String> {
    let uuid = Uuid::parse_str(&id).map_err(|e| format!("Invalid UUID: {}", e))?;
    workspace_manager
        .load_workspace(&uuid)
        .map_err(|e| e.to_string())
}

/// Save a workspace
#[tauri::command]
pub async fn save_workspace(
    workspace: Workspace,
    format: String,
    workspace_manager: State<'_, Arc<WorkspaceManager>>,
) -> Result<(), String> {
    let config_format = match format.as_str() {
        "json" => crate::services::ConfigFormat::Json,
        "toml" => crate::services::ConfigFormat::Toml,
        _ => return Err("Invalid format. Use 'json' or 'toml'".to_string()),
    };

    workspace_manager
        .save_workspace(&workspace, config_format)
        .map_err(|e| e.to_string())
}

/// List all workspace IDs
#[tauri::command]
pub async fn list_workspaces(
    workspace_manager: State<'_, Arc<WorkspaceManager>>,
) -> Result<Vec<String>, String> {
    let ids = workspace_manager
        .list_workspaces()
        .map_err(|e| e.to_string())?;

    Ok(ids.iter().map(|id| id.to_string()).collect())
}

/// Delete a workspace by ID
#[tauri::command]
pub async fn delete_workspace(
    id: String,
    workspace_manager: State<'_, Arc<WorkspaceManager>>,
) -> Result<(), String> {
    let uuid = Uuid::parse_str(&id).map_err(|e| format!("Invalid UUID: {}", e))?;
    workspace_manager
        .delete_workspace(&uuid)
        .map_err(|e| e.to_string())
}