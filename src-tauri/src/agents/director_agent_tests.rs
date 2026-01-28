// Director Agent Tests
//
// This module contains comprehensive unit tests for the DirectorAgent implementation.
// Tests cover:
// - Agent creation and initialization
// - Subtask validation (unique IDs, dependencies, circular dependencies)
// - Task handling capabilities
// - Serialization and deserialization

use std::sync::Arc;

use super::director_agent::{AssignmentStatus, DirectorAgent, SubTask};
use super::*;
use crate::ai::provider::AIProviderManager;

#[tokio::test]
async fn test_director_agent_creation() {
    let ai_provider = Arc::new(AIProviderManager::new());
    let registry = Arc::new(AgentRegistry::new(ai_provider));

    let config = AgentConfig {
        agent_id: "director-1".to_string(),
        workspace_id: "workspace-1".to_string(),
        ai_provider: "gemini".to_string(),
        model: "gemini-2.0-flash".to_string(),
        settings: serde_json::json!({}),
    };

    let director = DirectorAgent::new(config, registry);
    assert_eq!(director.info().name, "Director");
    assert!(matches!(director.info().agent_type, AgentType::Director));
}

#[test]
fn test_subtask_serialization() {
    let subtask = SubTask {
        id: "subtask-1".to_string(),
        description: "Test subtask".to_string(),
        agent_type: "researcher".to_string(),
        dependencies: vec![],
        priority: TaskPriority::High,
    };

    let json = serde_json::to_string(&subtask).unwrap();
    let deserialized: SubTask = serde_json::from_str(&json).unwrap();
    assert_eq!(subtask.id, deserialized.id);
}

#[test]
fn test_assignment_status_equality() {
    assert_eq!(AssignmentStatus::Pending, AssignmentStatus::Pending);
    assert_ne!(AssignmentStatus::Pending, AssignmentStatus::Completed);
}

#[test]
fn test_validate_subtasks_unique_ids() {
    let ai_provider = Arc::new(AIProviderManager::new());
    let registry = Arc::new(AgentRegistry::new(ai_provider));
    let config = AgentConfig {
        agent_id: "director-1".to_string(),
        workspace_id: "workspace-1".to_string(),
        ai_provider: "gemini".to_string(),
        model: "gemini-2.0-flash".to_string(),
        settings: serde_json::json!({}),
    };
    let director = DirectorAgent::new(config, registry);

    let subtasks = vec![
        SubTask {
            id: "subtask-1".to_string(),
            description: "First".to_string(),
            agent_type: "researcher".to_string(),
            dependencies: vec![],
            priority: TaskPriority::High,
        },
        SubTask {
            id: "subtask-1".to_string(), // Duplicate ID
            description: "Second".to_string(),
            agent_type: "executor".to_string(),
            dependencies: vec![],
            priority: TaskPriority::Medium,
        },
    ];

    let result = director.validate_subtasks(&subtasks);
    assert!(result.is_err());
}

#[test]
fn test_validate_subtasks_invalid_dependency() {
    let ai_provider = Arc::new(AIProviderManager::new());
    let registry = Arc::new(AgentRegistry::new(ai_provider));
    let config = AgentConfig {
        agent_id: "director-1".to_string(),
        workspace_id: "workspace-1".to_string(),
        ai_provider: "gemini".to_string(),
        model: "gemini-2.0-flash".to_string(),
        settings: serde_json::json!({}),
    };
    let director = DirectorAgent::new(config, registry);

    let subtasks = vec![SubTask {
        id: "subtask-1".to_string(),
        description: "First".to_string(),
        agent_type: "researcher".to_string(),
        dependencies: vec!["non-existent".to_string()], // Invalid dependency
        priority: TaskPriority::High,
    }];

    let result = director.validate_subtasks(&subtasks);
    assert!(result.is_err());
}

#[test]
fn test_validate_subtasks_circular_dependency() {
    let ai_provider = Arc::new(AIProviderManager::new());
    let registry = Arc::new(AgentRegistry::new(ai_provider));
    let config = AgentConfig {
        agent_id: "director-1".to_string(),
        workspace_id: "workspace-1".to_string(),
        ai_provider: "gemini".to_string(),
        model: "gemini-2.0-flash".to_string(),
        settings: serde_json::json!({}),
    };
    let director = DirectorAgent::new(config, registry);

    let subtasks = vec![
        SubTask {
            id: "subtask-1".to_string(),
            description: "First".to_string(),
            agent_type: "researcher".to_string(),
            dependencies: vec!["subtask-2".to_string()],
            priority: TaskPriority::High,
        },
        SubTask {
            id: "subtask-2".to_string(),
            description: "Second".to_string(),
            agent_type: "executor".to_string(),
            dependencies: vec!["subtask-1".to_string()], // Circular!
            priority: TaskPriority::Medium,
        },
    ];

    let result = director.validate_subtasks(&subtasks);
    assert!(result.is_err());
}

#[test]
fn test_validate_subtasks_valid() {
    let ai_provider = Arc::new(AIProviderManager::new());
    let registry = Arc::new(AgentRegistry::new(ai_provider));
    let config = AgentConfig {
        agent_id: "director-1".to_string(),
        workspace_id: "workspace-1".to_string(),
        ai_provider: "gemini".to_string(),
        model: "gemini-2.0-flash".to_string(),
        settings: serde_json::json!({}),
    };
    let director = DirectorAgent::new(config, registry);

    let subtasks = vec![
        SubTask {
            id: "subtask-1".to_string(),
            description: "First".to_string(),
            agent_type: "researcher".to_string(),
            dependencies: vec![],
            priority: TaskPriority::High,
        },
        SubTask {
            id: "subtask-2".to_string(),
            description: "Second".to_string(),
            agent_type: "executor".to_string(),
            dependencies: vec!["subtask-1".to_string()], // Valid dependency
            priority: TaskPriority::Medium,
        },
    ];

    let result = director.validate_subtasks(&subtasks);
    assert!(result.is_ok());
}

#[test]
fn test_can_handle_complex_tasks() {
    let ai_provider = Arc::new(AIProviderManager::new());
    let registry = Arc::new(AgentRegistry::new(ai_provider));
    let config = AgentConfig {
        agent_id: "director-1".to_string(),
        workspace_id: "workspace-1".to_string(),
        ai_provider: "gemini".to_string(),
        model: "gemini-2.0-flash".to_string(),
        settings: serde_json::json!({}),
    };
    let director = DirectorAgent::new(config, registry);

    // Complex task (long description)
    let complex_task = Task {
        id: "task-1".to_string(),
        description: "This is a very long and complex task that requires decomposition into multiple subtasks to be handled by different specialized agents in the system.".to_string(),
        priority: TaskPriority::High,
        dependencies: vec![],
        context: TaskContext {
            workspace_id: "workspace-1".to_string(),
            user_instruction: "Test".to_string(),
            relevant_files: vec![],
            memory_context: vec![],
        },
    };

    assert!(director.can_handle(&complex_task));

    // Simple task (short description, no dependencies)
    let simple_task = Task {
        id: "task-2".to_string(),
        description: "Simple task".to_string(),
        priority: TaskPriority::Low,
        dependencies: vec![],
        context: TaskContext {
            workspace_id: "workspace-1".to_string(),
            user_instruction: "Test".to_string(),
            relevant_files: vec![],
            memory_context: vec![],
        },
    };

    assert!(!director.can_handle(&simple_task));

    // Task with dependencies
    let task_with_deps = Task {
        id: "task-3".to_string(),
        description: "Task with deps".to_string(),
        priority: TaskPriority::Medium,
        dependencies: vec!["other-task".to_string()],
        context: TaskContext {
            workspace_id: "workspace-1".to_string(),
            user_instruction: "Test".to_string(),
            relevant_files: vec![],
            memory_context: vec![],
        },
    };

    assert!(director.can_handle(&task_with_deps));
}

#[test]
fn test_capabilities() {
    let ai_provider = Arc::new(AIProviderManager::new());
    let registry = Arc::new(AgentRegistry::new(ai_provider));
    let config = AgentConfig {
        agent_id: "director-1".to_string(),
        workspace_id: "workspace-1".to_string(),
        ai_provider: "gemini".to_string(),
        model: "gemini-2.0-flash".to_string(),
        settings: serde_json::json!({}),
    };
    let director = DirectorAgent::new(config, registry);

    let capabilities = director.capabilities();
    assert!(capabilities.contains(&"task_decomposition".to_string()));
    assert!(capabilities.contains(&"agent_assignment".to_string()));
    assert!(capabilities.contains(&"parallel_coordination".to_string()));
    assert!(capabilities.contains(&"result_aggregation".to_string()));
}
