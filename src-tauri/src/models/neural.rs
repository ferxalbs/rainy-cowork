use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// ──────────────────────────────────────────────────────────────────────────
// Desktop Node (Nerve Center)
// ──────────────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DesktopNodeStatus {
    Online,
    Busy,
    Offline,
}

// @RESERVED - Will be used when listing connected nodes in UI
#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DesktopNode {
    pub id: String,
    pub workspace_id: String,
    pub hostname: String,
    pub platform: String, // "darwin" | "win32" | "linux"
    pub skills_manifest: Vec<SkillManifest>,
    pub status: DesktopNodeStatus,
    pub last_heartbeat: i64,
    pub paired_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillManifest {
    pub name: String,
    pub version: String,
    pub methods: Vec<SkillMethod>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SkillMethod {
    pub name: String,
    pub description: String,
    pub airlock_level: AirlockLevel,
    pub parameters: HashMap<String, ParameterSchema>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ParameterSchema {
    #[serde(rename = "type")]
    pub param_type: String, // "string" | "number" | ...
    pub required: Option<bool>,
    pub description: Option<String>,
}

// ──────────────────────────────────────────────────────────────────────────
// The Airlock (Security Firewall)
// ──────────────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, PartialOrd)]
#[repr(u8)]
pub enum AirlockLevel {
    Safe = 0,
    Sensitive = 1,
    Dangerous = 2,
}

// ──────────────────────────────────────────────────────────────────────────
// RainyRPC Protocol (Cloud <-> Desktop)
// ──────────────────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum RainyIntent {
    Chat,
    Execute,
    Steer,
    System,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum CommandPriority {
    High,
    Normal,
    Low,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum CommandStatus {
    Pending,
    Approved,
    Running,
    Completed,
    Failed,
    Rejected,
}

// @RESERVED - Full RainyRPC message format for Pub/Sub integration
#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RainyMessage {
    pub id: String,
    pub timestamp: i64,
    pub intent: RainyIntent,
    pub context: RainyContext,
    pub payload: RainyPayload,
    pub signature: String,
}

// @RESERVED - Context for RainyMessage, used in Pub/Sub integration
#[allow(dead_code)]
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RainyContext {
    pub user_id: String,
    pub workspace_id: String,
    pub session_id: String,
    pub permissions: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RainyPayload {
    pub skill: Option<String>,
    pub method: Option<String>,
    pub params: Option<serde_json::Value>,
    pub content: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct QueuedCommand {
    pub id: String,
    pub workspace_id: String,
    pub desktop_node_id: Option<String>,
    pub intent: RainyIntent,
    pub payload: RainyPayload,
    pub priority: CommandPriority,
    pub status: CommandStatus,
    pub airlock_level: AirlockLevel,
    pub approved_by: Option<String>,
    pub result: Option<CommandResult>,
    pub created_at: i64,
    pub started_at: Option<i64>,
    pub completed_at: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CommandResult {
    pub success: bool,
    pub output: Option<String>,
    pub error: Option<String>,
    pub exit_code: Option<i32>,
}
