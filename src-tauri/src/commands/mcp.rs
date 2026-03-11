use crate::services::mcp_service::{
    McpPermissionMode, McpRuntimeStatus, McpServerConfig, McpServerRuntimeStatus,
    PersistedMcpServerConfig, McpApprovalRequest,
};
use crate::services::McpService;
use std::collections::HashMap;
use std::sync::Arc;
use tauri::{command, State};

#[command]
pub async fn list_mcp_servers(
    mcp_service: State<'_, Arc<McpService>>,
) -> Result<Vec<PersistedMcpServerConfig>, String> {
    Ok(mcp_service.list_servers().await)
}

#[command]
pub async fn upsert_mcp_server(
    mcp_service: State<'_, Arc<McpService>>,
    config: PersistedMcpServerConfig,
) -> Result<(), String> {
    mcp_service.upsert_server(config).await
}

#[command]
pub async fn remove_mcp_server(
    mcp_service: State<'_, Arc<McpService>>,
    name: String,
) -> Result<(), String> {
    mcp_service.remove_server(&name).await
}

#[command]
pub async fn connect_mcp_saved_server(
    mcp_service: State<'_, Arc<McpService>>,
    name: String,
    env: Option<HashMap<String, String>>,
) -> Result<(), String> {
    mcp_service.connect_saved_server(&name, env).await
}

#[command]
pub async fn connect_mcp_server(
    mcp_service: State<'_, Arc<McpService>>,
    config: McpServerConfig,
) -> Result<(), String> {
    mcp_service.connect_server(config).await
}

#[command]
pub async fn disconnect_mcp_server(
    mcp_service: State<'_, Arc<McpService>>,
    name: String,
) -> Result<(), String> {
    mcp_service.disconnect_server(&name).await
}

#[command]
pub async fn refresh_mcp_server_tools(
    mcp_service: State<'_, Arc<McpService>>,
    name: String,
) -> Result<(), String> {
    mcp_service.refresh_server_tools(&name).await
}

#[command]
pub async fn list_mcp_runtime_servers(
    mcp_service: State<'_, Arc<McpService>>,
) -> Result<Vec<McpServerRuntimeStatus>, String> {
    Ok(mcp_service.list_runtime_statuses().await)
}

#[command]
pub async fn get_mcp_runtime_status(
    mcp_service: State<'_, Arc<McpService>>,
) -> Result<McpRuntimeStatus, String> {
    Ok(mcp_service.get_runtime_status().await)
}

#[command]
pub async fn get_mcp_permission_mode(
    mcp_service: State<'_, Arc<McpService>>,
) -> Result<McpPermissionMode, String> {
    Ok(mcp_service.get_permission_mode().await)
}

#[command]
pub async fn set_mcp_permission_mode(
    mcp_service: State<'_, Arc<McpService>>,
    mode: McpPermissionMode,
) -> Result<(), String> {
    mcp_service.set_permission_mode(mode).await
}

#[command]
pub async fn get_pending_mcp_approvals(
    mcp_service: State<'_, Arc<McpService>>,
) -> Result<Vec<McpApprovalRequest>, String> {
    Ok(mcp_service.get_pending_approvals().await)
}

#[command]
pub async fn respond_to_mcp_approval(
    mcp_service: State<'_, Arc<McpService>>,
    approval_id: String,
    approved: bool,
) -> Result<(), String> {
    mcp_service.respond_to_approval(&approval_id, approved).await
}
