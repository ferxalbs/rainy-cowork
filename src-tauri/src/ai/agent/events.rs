use super::protocol::{SpecialistRole, SpecialistStatus, SupervisorPlan};
use crate::ai::provider_types::ToolCall;
use serde::Serialize;

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SpecialistEventPayload {
    pub run_id: String,
    pub agent_id: String,
    pub role: SpecialistRole,
    pub status: SpecialistStatus,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detail: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub active_tool: Option<String>,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SpecialistCompletedPayload {
    pub run_id: String,
    pub agent_id: String,
    pub role: SpecialistRole,
    pub summary: String,
    pub response_preview: String,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SpecialistFailedPayload {
    pub run_id: String,
    pub agent_id: String,
    pub role: SpecialistRole,
    pub error: String,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SupervisorSummaryPayload {
    pub run_id: String,
    pub summary: String,
}

#[derive(Clone, Debug, Serialize)]
#[serde(tag = "type", content = "data", rename_all = "snake_case")]
pub enum AgentEvent {
    Status(String),
    Thought(String),
    StreamChunk(String),
    ToolCall(ToolCall),
    ToolResult {
        id: String,
        result: String,
    },
    Error(String),
    MemoryStored(String),
    SupervisorPlanCreated(SupervisorPlan),
    SpecialistSpawned(SpecialistEventPayload),
    SpecialistStatusChanged(SpecialistEventPayload),
    SpecialistCompleted(SpecialistCompletedPayload),
    SpecialistFailed(SpecialistFailedPayload),
    SupervisorSummary(SupervisorSummaryPayload),
}
