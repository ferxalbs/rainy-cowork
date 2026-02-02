use crate::models::neural::{DesktopNodeStatus, QueuedCommand, SkillManifest};
use crate::services::NeuralService;
use tauri::{command, State};

pub struct NeuralServiceState(pub NeuralService);

#[command]
pub async fn register_node(
    state: State<'_, NeuralServiceState>,
    skills: Vec<SkillManifest>,
) -> Result<String, String> {
    state.0.register(skills).await
}

#[command]
pub async fn send_heartbeat(
    state: State<'_, NeuralServiceState>,
    status: DesktopNodeStatus,
) -> Result<Vec<QueuedCommand>, String> {
    state.0.heartbeat(status).await
}

#[command]
pub async fn poll_commands(
    state: State<'_, NeuralServiceState>,
) -> Result<Vec<QueuedCommand>, String> {
    state.0.poll_commands().await
}

#[command]
pub async fn start_command_execution(
    state: State<'_, NeuralServiceState>,
    command_id: String,
) -> Result<(), String> {
    state.0.start_command(&command_id).await
}

#[command]
pub async fn complete_command_execution(
    state: State<'_, NeuralServiceState>,
    command_id: String,
    result: crate::models::neural::CommandResult,
) -> Result<(), String> {
    state.0.complete_command(&command_id, result).await
}
