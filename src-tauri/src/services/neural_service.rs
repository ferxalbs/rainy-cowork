use crate::models::neural::{CommandResult, DesktopNodeStatus, QueuedCommand, SkillManifest};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::Mutex;

#[derive(Clone)]
pub struct NeuralService {
    http: Client,
    base_url: String,
    metadata: Arc<Mutex<NodeMetadata>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NodeMetadata {
    pub node_id: Option<String>,
    pub workspace_id: String,
    pub hostname: String,
    pub platform: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct RegisterResponse {
    success: bool,
    #[serde(rename = "nodeId")]
    node_id: String,
    message: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct HeartbeatResponse {
    success: bool,
    #[serde(rename = "pendingCommands")]
    pending_commands: Vec<QueuedCommand>,
}

#[derive(Debug, Serialize, Deserialize)]
struct CommandsResponse {
    commands: Vec<QueuedCommand>,
}

impl NeuralService {
    pub fn new(base_url: String, workspace_id: String) -> Self {
        let hostname = std::env::var("HOSTNAME")
            .or_else(|_| std::env::var("COMPUTERNAME"))
            .unwrap_or_else(|_| "unknown-host".to_string());

        let platform = std::env::consts::OS.to_string();

        Self {
            http: Client::new(),
            base_url,
            metadata: Arc::new(Mutex::new(NodeMetadata {
                node_id: None,
                workspace_id,
                hostname,
                platform,
            })),
        }
    }

    pub async fn set_workspace_id(&self, workspace_id: String) {
        let mut metadata = self.metadata.lock().await;
        metadata.workspace_id = workspace_id;
        // Reset node_id to force re-registration with new workspace
        metadata.node_id = None;
    }

    /// Registers this Desktop Node with the Cloud Cortex
    pub async fn register(&self, skills: Vec<SkillManifest>) -> Result<String, String> {
        let mut metadata = self.metadata.lock().await;

        // If already registered, return existing ID (or maybe re-register?)
        if let Some(id) = &metadata.node_id {
            return Ok(id.clone());
        }

        let url = format!("{}/v1/nodes/register", self.base_url);

        let body = serde_json::json!({
            "workspaceId": metadata.workspace_id,
            "hostname": metadata.hostname,
            "platform": metadata.platform,
            "skills": skills
        });

        let res = self
            .http
            .post(&url)
            .json(&body)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if !res.status().is_success() {
            return Err(format!("Registration failed: {}", res.status()));
        }

        let data: RegisterResponse = res.json().await.map_err(|e| e.to_string())?;

        if data.success {
            metadata.node_id = Some(data.node_id.clone());
            Ok(data.node_id)
        } else {
            Err(data.message)
        }
    }

    /// Sends a heartbeat and checks for pending commands
    pub async fn heartbeat(&self, status: DesktopNodeStatus) -> Result<Vec<QueuedCommand>, String> {
        let metadata = self.metadata.lock().await;
        let node_id = metadata.node_id.as_ref().ok_or("Node not registered")?;

        let url = format!("{}/v1/nodes/{}/heartbeat", self.base_url, node_id);

        let body = serde_json::json!({
            "status": status // Serializes based on enum config (lowercase)
        });

        let res = self
            .http
            .post(&url)
            .json(&body)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if !res.status().is_success() {
            return Err(format!("Heartbeat failed: {}", res.status()));
        }

        let data: HeartbeatResponse = res.json().await.map_err(|e| e.to_string())?;
        Ok(data.pending_commands)
    }

    /// Polls specifically for commands
    pub async fn poll_commands(&self) -> Result<Vec<QueuedCommand>, String> {
        let metadata = self.metadata.lock().await;
        let node_id = metadata.node_id.as_ref().ok_or("Node not registered")?;

        let url = format!("{}/v1/nodes/{}/commands", self.base_url, node_id);

        let res = self
            .http
            .get(&url)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if !res.status().is_success() {
            return Err(format!("Poll commands failed: {}", res.status()));
        }

        let data: CommandsResponse = res.json().await.map_err(|e| e.to_string())?;
        Ok(data.commands)
    }

    /// Mark a command as started
    pub async fn start_command(&self, command_id: &str) -> Result<(), String> {
        let metadata = self.metadata.lock().await;
        let node_id = metadata.node_id.as_ref().ok_or("Node not registered")?;

        let url = format!(
            "{}/v1/nodes/{}/commands/{}/start",
            self.base_url, node_id, command_id
        );

        let res = self
            .http
            .post(&url)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if !res.status().is_success() {
            return Err(format!("Start command failed: {}", res.status()));
        }

        Ok(())
    }

    /// Report command completion
    pub async fn complete_command(
        &self,
        command_id: &str,
        result: CommandResult,
    ) -> Result<(), String> {
        let metadata = self.metadata.lock().await;
        let node_id = metadata.node_id.as_ref().ok_or("Node not registered")?;

        let url = format!(
            "{}/v1/nodes/{}/commands/{}/complete",
            self.base_url, node_id, command_id
        );

        let res = self
            .http
            .post(&url)
            .json(&result)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        if !res.status().is_success() {
            return Err(format!("Complete command failed: {}", res.status()));
        }

        Ok(())
    }
}
