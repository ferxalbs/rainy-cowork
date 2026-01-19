// Rainy Cowork - File Operations Commands
// Tauri commands for advanced file operations and AI agent
// Part of Phase 2: Enhanced Tauri Commands

use crate::services::ai_agent::{AgentEvent, CoworkAgent, ExecutionResult, TaskPlan};
use crate::services::file_operations::{
    ConflictStrategy, FileOpChange, FileOperationEngine, MoveOperation, OrganizeResult,
    OrganizeStrategy, RenamePattern, RenamePreview, WorkspaceAnalysis,
};
use std::sync::Arc;
use tauri::{ipc::Channel, State};

// ============ File Operation Commands ============

/// Move multiple files to a destination
#[tauri::command]
pub async fn move_files(
    paths: Vec<String>,
    destination: String,
    on_conflict: Option<String>,
    state: State<'_, Arc<FileOperationEngine>>,
) -> Result<Vec<FileOpChange>, String> {
    let conflict_strategy = match on_conflict.as_deref() {
        Some("overwrite") => ConflictStrategy::Overwrite,
        Some("rename") => ConflictStrategy::Rename,
        Some("ask") => ConflictStrategy::Ask,
        _ => ConflictStrategy::Skip,
    };

    let operations: Vec<MoveOperation> = paths
        .into_iter()
        .map(|source| {
            let file_name = std::path::Path::new(&source)
                .file_name()
                .map(|s| s.to_string_lossy().to_string())
                .unwrap_or_default();
            MoveOperation {
                source,
                destination: format!("{}/{}", destination, file_name),
                on_conflict: conflict_strategy,
            }
        })
        .collect();

    state
        .move_files(operations)
        .await
        .map_err(|e| e.to_string())
}

/// Organize folder contents by strategy
#[tauri::command]
pub async fn organize_folder(
    path: String,
    strategy: String,
    dry_run: Option<bool>,
    state: State<'_, Arc<FileOperationEngine>>,
) -> Result<OrganizeResult, String> {
    let organize_strategy = match strategy.as_str() {
        "by_date" => OrganizeStrategy::ByDate,
        "by_extension" => OrganizeStrategy::ByExtension,
        "by_content" => OrganizeStrategy::ByContent,
        _ => OrganizeStrategy::ByType,
    };

    state
        .organize_folder(&path, organize_strategy, dry_run.unwrap_or(false))
        .await
        .map_err(|e| e.to_string())
}

/// Batch rename files with pattern
#[tauri::command]
pub async fn batch_rename(
    files: Vec<String>,
    pattern: String,
    find: Option<String>,
    replace: Option<String>,
    counter_start: Option<u32>,
    preview_only: Option<bool>,
    state: State<'_, Arc<FileOperationEngine>>,
) -> Result<Vec<RenamePreview>, String> {
    let rename_pattern = RenamePattern {
        template: pattern,
        find,
        replace,
        counter_start,
        counter_padding: Some(3),
    };

    state
        .batch_rename(files, rename_pattern, preview_only.unwrap_or(true))
        .await
        .map_err(|e| e.to_string())
}

/// Safely delete files (move to trash)
#[tauri::command]
pub async fn safe_delete_files(
    paths: Vec<String>,
    state: State<'_, Arc<FileOperationEngine>>,
) -> Result<Vec<FileOpChange>, String> {
    state.safe_delete(paths).await.map_err(|e| e.to_string())
}

/// Analyze workspace for optimization suggestions
#[tauri::command]
pub async fn analyze_workspace(
    path: String,
    state: State<'_, Arc<FileOperationEngine>>,
) -> Result<WorkspaceAnalysis, String> {
    state
        .analyze_workspace(&path)
        .await
        .map_err(|e| e.to_string())
}

/// Undo a previous file operation
#[tauri::command]
pub async fn undo_file_operation(
    operation_id: String,
    state: State<'_, Arc<FileOperationEngine>>,
) -> Result<Vec<FileOpChange>, String> {
    state
        .undo_operation(&operation_id)
        .await
        .map_err(|e| e.to_string())
}

/// List undoable operations
#[tauri::command]
pub async fn list_file_operations(
    state: State<'_, Arc<FileOperationEngine>>,
) -> Result<Vec<(String, String, String)>, String> {
    let ops = state.list_operations();
    Ok(ops
        .into_iter()
        .map(|(id, desc, ts)| (id, desc, ts.to_rfc3339()))
        .collect())
}

// ============ AI Agent Commands ============

/// Plan a task from natural language instruction
#[tauri::command]
pub async fn plan_task(
    instruction: String,
    workspace_path: String,
    state: State<'_, Arc<CoworkAgent>>,
) -> Result<TaskPlan, String> {
    state.parse_instruction(&instruction, &workspace_path).await
}

/// Execute a planned task
#[tauri::command]
pub async fn execute_agent_task(
    plan_id: String,
    on_event: Channel<AgentEvent>,
    state: State<'_, Arc<CoworkAgent>>,
) -> Result<ExecutionResult, String> {
    state.execute_plan(&plan_id, on_event).await
}

/// Get a pending plan by ID
#[tauri::command]
pub async fn get_agent_plan(
    plan_id: String,
    state: State<'_, Arc<CoworkAgent>>,
) -> Result<Option<TaskPlan>, String> {
    Ok(state.get_plan(&plan_id).await)
}

/// Cancel a pending plan
#[tauri::command]
pub async fn cancel_agent_plan(
    plan_id: String,
    state: State<'_, Arc<CoworkAgent>>,
) -> Result<(), String> {
    state.cancel_plan(&plan_id).await
}

/// Analyze workspace with AI agent suggestions
#[tauri::command]
pub async fn agent_analyze_workspace(
    path: String,
    state: State<'_, Arc<CoworkAgent>>,
) -> Result<WorkspaceAnalysis, String> {
    state.analyze_workspace(&path).await
}
