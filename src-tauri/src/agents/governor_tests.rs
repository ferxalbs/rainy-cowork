//! Unit tests for GovernorAgent

use std::sync::Arc;
use crate::agents::{
    Agent, AgentConfig, AgentRegistry, AgentType, Task, TaskPriority, TaskContext,
};
use crate::agents::governor::{GovernorAgent, SecurityPolicy, ApprovalDecision};
use crate::ai::AIProviderManager;

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_registry() -> Arc<AgentRegistry> {
        let ai_provider = Arc::new(AIProviderManager::new());
        Arc::new(AgentRegistry::new(ai_provider))
    }

    fn create_test_config(agent_id: &str) -> AgentConfig {
        AgentConfig {
            agent_id: agent_id.to_string(),
            workspace_id: "test-workspace".to_string(),
            ai_provider: "gemini".to_string(),
            model: "gemini-2.0-flash".to_string(),
            settings: serde_json::json!({}),
        }
    }

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
        assert_eq!(deserialized.description, "A test security policy");
        assert!(deserialized.enabled);
    }

    #[test]
    fn test_security_policy_deserialization() {
        let json = r#"{
            "id": "no_network",
            "name": "Prevent Network Access",
            "description": "Block all network operations",
            "enabled": false
        }"#;

        let policy: SecurityPolicy = serde_json::from_str(json).unwrap();

        assert_eq!(policy.id, "no_network");
        assert_eq!(policy.name, "Prevent Network Access");
        assert_eq!(policy.description, "Block all network operations");
        assert!(!policy.enabled);
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
    fn test_approval_decision_deserialization() {
        let json = r#"{
            "approved": false,
            "reason": "Operation violates security policy"
        }"#;

        let decision: ApprovalDecision = serde_json::from_str(json).unwrap();

        assert!(!decision.approved);
        assert_eq!(decision.reason, "Operation violates security policy");
    }

    #[test]
    fn test_governor_agent_creation() {
        let registry = create_test_registry();
        let config = create_test_config("governor-test-1");

        let governor = GovernorAgent::new(config, registry);

        let info = governor.info();
        assert_eq!(info.name, "Governor");
        assert!(matches!(info.agent_type, AgentType::Governor));
    }

    #[test]
    fn test_governor_agent_capabilities() {
        let registry = create_test_registry();
        let config = create_test_config("governor-test-2");

        let governor = GovernorAgent::new(config, registry);
        let capabilities = governor.capabilities();

        assert!(capabilities.contains(&"security_policy_enforcement".to_string()));
        assert!(capabilities.contains(&"operation_approval".to_string()));
        assert!(capabilities.contains(&"compliance_verification".to_string()));
        assert!(capabilities.contains(&"dangerous_operation_blocking".to_string()));
        assert_eq!(capabilities.len(), 4);
    }

    #[test]
    fn test_governor_agent_can_handle() {
        let registry = create_test_registry();
        let config = create_test_config("governor-test-3");

        let governor = GovernorAgent::new(config, registry);

        // Test tasks that should be handled
        let delete_task = Task {
            id: "task-1".to_string(),
            description: "Delete file.txt".to_string(),
            priority: TaskPriority::Medium,
            dependencies: vec![],
            context: TaskContext {
                workspace_id: "test".to_string(),
                user_instruction: "".to_string(),
                relevant_files: vec![],
                memory_context: vec![],
            },
        };
        assert!(governor.can_handle(&delete_task));

        let exec_task = Task {
            id: "task-2".to_string(),
            description: "Exec system command".to_string(),
            priority: TaskPriority::Medium,
            dependencies: vec![],
            context: TaskContext {
                workspace_id: "test".to_string(),
                user_instruction: "".to_string(),
                relevant_files: vec![],
                memory_context: vec![],
            },
        };
        assert!(governor.can_handle(&exec_task));

        let system_task = Task {
            id: "task-3".to_string(),
            description: "System configuration change".to_string(),
            priority: TaskPriority::Medium,
            dependencies: vec![],
            context: TaskContext {
                workspace_id: "test".to_string(),
                user_instruction: "".to_string(),
                relevant_files: vec![],
                memory_context: vec![],
            },
        };
        assert!(governor.can_handle(&system_task));

        let approve_task = Task {
            id: "task-4".to_string(),
            description: "Approve this operation".to_string(),
            priority: TaskPriority::Medium,
            dependencies: vec![],
            context: TaskContext {
                workspace_id: "test".to_string(),
                user_instruction: "".to_string(),
                relevant_files: vec![],
                memory_context: vec![],
            },
        };
        assert!(governor.can_handle(&approve_task));

        // Test task that should not be handled
        let other_task = Task {
            id: "task-5".to_string(),
            description: "Read file content".to_string(),
            priority: TaskPriority::Medium,
            dependencies: vec![],
            context: TaskContext {
                workspace_id: "test".to_string(),
                user_instruction: "".to_string(),
                relevant_files: vec![],
                memory_context: vec![],
            },
        };
        assert!(!governor.can_handle(&other_task));
    }

    #[test]
    fn test_security_policy_enabled_disabled() {
        let policy_enabled = SecurityPolicy {
            id: "policy-1".to_string(),
            name: "Enabled Policy".to_string(),
            description: "This policy is enabled".to_string(),
            enabled: true,
        };
        assert!(policy_enabled.enabled);

        let policy_disabled = SecurityPolicy {
            id: "policy-2".to_string(),
            name: "Disabled Policy".to_string(),
            description: "This policy is disabled".to_string(),
            enabled: false,
        };
        assert!(!policy_disabled.enabled);
    }

    #[test]
    fn test_approval_decision_approved_rejected() {
        let approved = ApprovalDecision {
            approved: true,
            reason: "Safe operation".to_string(),
        };
        assert!(approved.approved);

        let rejected = ApprovalDecision {
            approved: false,
            reason: "Unsafe operation".to_string(),
        };
        assert!(!rejected.approved);
    }

    #[test]
    fn test_security_policy_json_roundtrip() {
        let original = SecurityPolicy {
            id: "custom_policy".to_string(),
            name: "Custom Security Policy".to_string(),
            description: "A custom security policy for testing".to_string(),
            enabled: true,
        };

        let json = serde_json::to_string(&original).unwrap();
        let restored: SecurityPolicy = serde_json::from_str(&json).unwrap();

        assert_eq!(restored.id, original.id);
        assert_eq!(restored.name, original.name);
        assert_eq!(restored.description, original.description);
        assert_eq!(restored.enabled, original.enabled);
    }

    #[test]
    fn test_approval_decision_json_roundtrip() {
        let original = ApprovalDecision {
            approved: true,
            reason: "Operation approved after review".to_string(),
        };

        let json = serde_json::to_string(&original).unwrap();
        let restored: ApprovalDecision = serde_json::from_str(&json).unwrap();

        assert_eq!(restored.approved, original.approved);
        assert_eq!(restored.reason, original.reason);
    }

    #[test]
    fn test_security_policy_unique_ids() {
        let policy1 = SecurityPolicy {
            id: "policy-1".to_string(),
            name: "Policy 1".to_string(),
            description: "First policy".to_string(),
            enabled: true,
        };

        let policy2 = SecurityPolicy {
            id: "policy-2".to_string(),
            name: "Policy 2".to_string(),
            description: "Second policy".to_string(),
            enabled: true,
        };

        assert_ne!(policy1.id, policy2.id);
    }

    #[test]
    fn test_approval_decision_reason_variations() {
        let decisions = vec![
            ApprovalDecision {
                approved: true,
                reason: "Operation is safe and compliant".to_string(),
            },
            ApprovalDecision {
                approved: false,
                reason: "Operation violates security policy".to_string(),
            },
            ApprovalDecision {
                approved: true,
                reason: "Approved with conditions".to_string(),
            },
            ApprovalDecision {
                approved: false,
                reason: "Insufficient permissions".to_string(),
            },
        ];

        assert_eq!(decisions.len(), 4);
        assert!(decisions[0].approved);
        assert!(!decisions[1].approved);
        assert!(decisions[2].approved);
        assert!(!decisions[3].approved);
    }
}
