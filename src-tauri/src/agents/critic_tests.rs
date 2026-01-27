//! Unit tests for CriticAgent

use std::sync::Arc;
use crate::agents::{
    Agent, AgentConfig, AgentRegistry, AgentType, Task, TaskPriority, TaskContext,
};
use crate::agents::critic::{CriticAgent, QualityEvaluation};
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
    fn test_quality_evaluation_serialization() {
        let evaluation = QualityEvaluation {
            quality_score: 85,
            accuracy: "High".to_string(),
            coherence: "Good".to_string(),
            suggestions: vec![
                "Add more details".to_string(),
                "Improve structure".to_string(),
            ],
        };

        let json = serde_json::to_string(&evaluation).unwrap();
        let deserialized: QualityEvaluation = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.quality_score, 85);
        assert_eq!(deserialized.accuracy, "High");
        assert_eq!(deserialized.coherence, "Good");
        assert_eq!(deserialized.suggestions.len(), 2);
        assert_eq!(deserialized.suggestions[0], "Add more details");
    }

    #[test]
    fn test_quality_evaluation_deserialization() {
        let json = r#"{
            "quality_score": 92,
            "accuracy": "Very High",
            "coherence": "Excellent",
            "suggestions": ["Enhance clarity", "Add examples"]
        }"#;

        let evaluation: QualityEvaluation = serde_json::from_str(json).unwrap();

        assert_eq!(evaluation.quality_score, 92);
        assert_eq!(evaluation.accuracy, "Very High");
        assert_eq!(evaluation.coherence, "Excellent");
        assert_eq!(evaluation.suggestions.len(), 2);
    }

    #[test]
    fn test_quality_evaluation_score_bounds() {
        // Test minimum score
        let min_eval = QualityEvaluation {
            quality_score: 0,
            accuracy: "Low".to_string(),
            coherence: "Poor".to_string(),
            suggestions: vec![],
        };
        assert_eq!(min_eval.quality_score, 0);

        // Test maximum score
        let max_eval = QualityEvaluation {
            quality_score: 100,
            accuracy: "Perfect".to_string(),
            coherence: "Excellent".to_string(),
            suggestions: vec![],
        };
        assert_eq!(max_eval.quality_score, 100);
    }

    #[test]
    fn test_critic_agent_creation() {
        let registry = create_test_registry();
        let config = create_test_config("critic-test-1");

        let critic = CriticAgent::new(config, registry);

        let info = critic.info();
        assert_eq!(info.name, "Critic");
        assert!(matches!(info.agent_type, AgentType::Critic));
    }

    #[test]
    fn test_critic_agent_capabilities() {
        let registry = create_test_registry();
        let config = create_test_config("critic-test-2");

        let critic = CriticAgent::new(config, registry);
        let capabilities = critic.capabilities();

        assert!(capabilities.contains(&"quality_evaluation".to_string()));
        assert!(capabilities.contains(&"accuracy_assessment".to_string()));
        assert!(capabilities.contains(&"coherence_check".to_string()));
        assert!(capabilities.contains(&"improvement_suggestions".to_string()));
        assert_eq!(capabilities.len(), 4);
    }

    #[test]
    fn test_critic_agent_can_handle() {
        let registry = create_test_registry();
        let config = create_test_config("critic-test-3");

        let critic = CriticAgent::new(config, registry);

        // Test tasks that should be handled
        let evaluate_task = Task {
            id: "task-1".to_string(),
            description: "Evaluate this result".to_string(),
            priority: TaskPriority::Medium,
            dependencies: vec![],
            context: TaskContext {
                workspace_id: "test".to_string(),
                user_instruction: "".to_string(),
                relevant_files: vec![],
                memory_context: vec![],
            },
        };
        assert!(critic.can_handle(&evaluate_task));

        let review_task = Task {
            id: "task-2".to_string(),
            description: "Review the code".to_string(),
            priority: TaskPriority::Medium,
            dependencies: vec![],
            context: TaskContext {
                workspace_id: "test".to_string(),
                user_instruction: "".to_string(),
                relevant_files: vec![],
                memory_context: vec![],
            },
        };
        assert!(critic.can_handle(&review_task));

        let critique_task = Task {
            id: "task-3".to_string(),
            description: "Critique the design".to_string(),
            priority: TaskPriority::Medium,
            dependencies: vec![],
            context: TaskContext {
                workspace_id: "test".to_string(),
                user_instruction: "".to_string(),
                relevant_files: vec![],
                memory_context: vec![],
            },
        };
        assert!(critic.can_handle(&critique_task));

        let assess_task = Task {
            id: "task-4".to_string(),
            description: "Assess the quality".to_string(),
            priority: TaskPriority::Medium,
            dependencies: vec![],
            context: TaskContext {
                workspace_id: "test".to_string(),
                user_instruction: "".to_string(),
                relevant_files: vec![],
                memory_context: vec![],
            },
        };
        assert!(critic.can_handle(&assess_task));

        // Test task that should not be handled
        let other_task = Task {
            id: "task-5".to_string(),
            description: "Execute this command".to_string(),
            priority: TaskPriority::Medium,
            dependencies: vec![],
            context: TaskContext {
                workspace_id: "test".to_string(),
                user_instruction: "".to_string(),
                relevant_files: vec![],
                memory_context: vec![],
            },
        };
        assert!(!critic.can_handle(&other_task));
    }

    #[test]
    fn test_quality_evaluation_empty_suggestions() {
        let evaluation = QualityEvaluation {
            quality_score: 75,
            accuracy: "Medium".to_string(),
            coherence: "Good".to_string(),
            suggestions: vec![],
        };

        assert!(evaluation.suggestions.is_empty());
        assert_eq!(evaluation.quality_score, 75);
    }

    #[test]
    fn test_quality_evaluation_multiple_suggestions() {
        let evaluation = QualityEvaluation {
            quality_score: 80,
            accuracy: "High".to_string(),
            coherence: "Good".to_string(),
            suggestions: vec![
                "Suggestion 1".to_string(),
                "Suggestion 2".to_string(),
                "Suggestion 3".to_string(),
                "Suggestion 4".to_string(),
                "Suggestion 5".to_string(),
            ],
        };

        assert_eq!(evaluation.suggestions.len(), 5);
        assert_eq!(evaluation.suggestions[0], "Suggestion 1");
        assert_eq!(evaluation.suggestions[4], "Suggestion 5");
    }

    #[test]
    fn test_quality_evaluation_json_roundtrip() {
        let original = QualityEvaluation {
            quality_score: 88,
            accuracy: "Very High".to_string(),
            coherence: "Excellent".to_string(),
            suggestions: vec![
                "Improve documentation".to_string(),
                "Add error handling".to_string(),
            ],
        };

        let json = serde_json::to_string(&original).unwrap();
        let restored: QualityEvaluation = serde_json::from_str(&json).unwrap();

        assert_eq!(restored.quality_score, original.quality_score);
        assert_eq!(restored.accuracy, original.accuracy);
        assert_eq!(restored.coherence, original.coherence);
        assert_eq!(restored.suggestions, original.suggestions);
    }
}
