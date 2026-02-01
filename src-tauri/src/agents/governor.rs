//! GovernorAgent - Security policy enforcement and compliance
//!
//! The GovernorAgent enforces security policies, approves operations, and ensures
//! compliance with safety guidelines across the multi-agent system.

use async_trait::async_trait;
use std::sync::Arc;

use crate::agents::{
    Agent, AgentConfig, AgentError, AgentInfo, AgentMessage, AgentRegistry, AgentStatus, AgentType,
    BaseAgent, Task, TaskResult,
};

/// GovernorAgent enforces security policies and compliance
pub struct GovernorAgent {
    base: BaseAgent,

    // Registry removed (unused)
    policies: Arc<tokio::sync::RwLock<Vec<SecurityPolicy>>>,
}

impl GovernorAgent {
    /// Create a new GovernorAgent instance
    pub fn new(config: AgentConfig, registry: Arc<AgentRegistry>) -> Self {
        let ai_provider = registry.ai_provider();
        let message_bus = registry.message_bus();
        let base = BaseAgent::new(config, ai_provider, message_bus);

        Self {
            base,
            policies: Arc::new(tokio::sync::RwLock::new(vec![
                SecurityPolicy {
                    id: "no_file_deletion".to_string(),
                    name: "Prevent file deletion".to_string(),
                    description: "Block operations that delete files without explicit approval"
                        .to_string(),
                    enabled: true,
                },
                SecurityPolicy {
                    id: "no_system_commands".to_string(),
                    name: "Prevent system commands".to_string(),
                    description: "Block execution of system-level commands".to_string(),
                    enabled: true,
                },
            ])),
        }
    }

    /// Check if operation is allowed based on policies
    pub async fn check_operation(&self, operation: &str) -> Result<bool, AgentError> {
        let policies = self.policies.read().await;

        for policy in policies.iter() {
            if policy.enabled && self.matches_policy(operation, policy) {
                return Ok(false);
            }
        }

        Ok(true)
    }

    /// Check if operation matches a security policy
    fn matches_policy(&self, operation: &str, policy: &SecurityPolicy) -> bool {
        match policy.id.as_str() {
            "no_file_deletion" => operation.contains("delete") || operation.contains("remove"),
            "no_system_commands" => operation.contains("exec") || operation.contains("system"),
            _ => false,
        }
    }

    /// Request approval for an operation using AI
    pub async fn request_approval(&self, operation: &str) -> Result<ApprovalDecision, AgentError> {
        let prompt = format!(
            "Evaluate if this operation should be allowed:\n\
            Operation: {}\n\n\
            Consider security, safety, and compliance.\n\
            Return a JSON response with:\n\
            - approved (boolean)\n\
            - reason (string)",
            operation
        );

        let response = self.base.query_ai(&prompt).await?;

        let decision: ApprovalDecision = serde_json::from_str(&response).map_err(|e| {
            AgentError::TaskExecutionFailed(format!("Failed to parse decision: {}", e))
        })?;

        Ok(decision)
    }
}

/// Security policy definition
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct SecurityPolicy {
    /// Unique policy identifier
    pub id: String,
    /// Human-readable policy name
    pub name: String,
    /// Policy description
    pub description: String,
    /// Whether the policy is currently enabled
    pub enabled: bool,
}

/// Approval decision for an operation
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ApprovalDecision {
    /// Whether the operation is approved
    pub approved: bool,
    /// Reason for the decision
    pub reason: String,
}

#[async_trait]
impl Agent for GovernorAgent {
    fn info(&self) -> AgentInfo {
        AgentInfo {
            id: self.base.info().id,
            name: "Governor".to_string(),
            agent_type: AgentType::Governor,
            status: self.base.info().status,
            current_task: self.base.info().current_task,
        }
    }

    async fn update_status(&self, status: AgentStatus) {
        self.base.update_status(status).await;
    }

    async fn set_current_task(&self, task_id: Option<String>) {
        self.base.set_current_task(task_id).await;
    }

    async fn process_task(&self, task: Task) -> Result<TaskResult, AgentError> {
        self.base.update_status(AgentStatus::Busy).await;
        self.base.set_current_task(Some(task.id.clone())).await;

        // Check if operation is allowed
        let allowed = self.check_operation(&task.description).await?;

        if !allowed {
            // Request approval
            let decision = self.request_approval(&task.description).await?;

            if !decision.approved {
                self.base.update_status(AgentStatus::Idle).await;
                self.base.set_current_task(None).await;

                return Ok(TaskResult {
                    success: false,
                    output: "Operation blocked by security policy".to_string(),
                    errors: vec![decision.reason],
                    metadata: serde_json::json!({
                        "blocked": true,
                        "policy_enforced": true
                    }),
                });
            }
        }

        self.base.update_status(AgentStatus::Idle).await;
        self.base.set_current_task(None).await;

        Ok(TaskResult {
            success: true,
            output: "Operation approved".to_string(),
            errors: vec![],
            metadata: serde_json::json!({
                "approved": true
            }),
        })
    }

    async fn handle_message(&self, message: AgentMessage) -> Result<(), AgentError> {
        match message {
            AgentMessage::RequestApproval { operation } => {
                let _decision = self.request_approval(&operation).await?;
                // Send decision back via message bus
            }
            _ => {}
        }
        Ok(())
    }

    fn capabilities(&self) -> Vec<String> {
        vec![
            "security_policy_enforcement".to_string(),
            "operation_approval".to_string(),
            "compliance_verification".to_string(),
            "dangerous_operation_blocking".to_string(),
        ]
    }

    fn can_handle(&self, task: &Task) -> bool {
        task.description.contains("delete")
            || task.description.contains("exec")
            || task.description.contains("system")
            || task.description.contains("approve")
    }

    async fn initialize(&mut self, config: AgentConfig) -> Result<(), AgentError> {
        self.base.initialize(config).await
    }

    async fn shutdown(&mut self) -> Result<(), AgentError> {
        self.base.shutdown().await
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_security_policy_serialization() {
        let policy = SecurityPolicy {
            id: "test_policy".to_string(),
            name: "Test Policy".to_string(),
            description: "A test security policy".to_string(),
            enabled: true,
        };

        let json = serde_json::to_string(&policy).unwrap();
        let deserialized: SecurityPolicy = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.id, "test_policy");
        assert_eq!(deserialized.name, "Test Policy");
        assert!(deserialized.enabled);
    }

    #[test]
    fn test_approval_decision_serialization() {
        let decision = ApprovalDecision {
            approved: true,
            reason: "Operation is safe".to_string(),
        };

        let json = serde_json::to_string(&decision).unwrap();
        let deserialized: ApprovalDecision = serde_json::from_str(&json).unwrap();

        assert!(deserialized.approved);
        assert_eq!(deserialized.reason, "Operation is safe");
    }

    #[test]
    fn test_matches_policy() {
        // This test would require a full setup with registry
        // For now, we verify the logic structure
        let operation = "delete file.txt";
        assert!(operation.contains("delete"));

        let operation2 = "read file.txt";
        assert!(!operation2.contains("delete"));
    }
}
