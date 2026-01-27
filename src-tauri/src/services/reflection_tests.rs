//! Unit tests for ReflectionEngine

use std::sync::Arc;
use crate::services::reflection::{
    ReflectionEngine, Reflection, ErrorPattern, Strategy, OptimizationReport,
};
use crate::ai::AIProviderManager;

#[cfg(test)]
mod tests {
    use super::*;

    fn create_test_ai_provider() -> Arc<AIProviderManager> {
        Arc::new(AIProviderManager::new())
    }

    #[test]
    fn test_reflection_serialization() {
        let reflection = Reflection {
            task_id: "task-1".to_string(),
            success: true,
            insights: vec!["Good performance".to_string()],
            improvements: vec!["Add caching".to_string()],
        };

        let json = serde_json::to_string(&reflection).unwrap();
        let deserialized: Reflection = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.task_id, "task-1");
        assert!(deserialized.success);
        assert_eq!(deserialized.insights.len(), 1);
        assert_eq!(deserialized.improvements.len(), 1);
    }

    #[test]
    fn test_reflection_deserialization() {
        let json = r#"{
            "task_id": "task-2",
            "success": false,
            "insights": ["Error occurred", "Timeout detected"],
            "improvements": ["Add retry logic", "Increase timeout"]
        }"#;

        let reflection: Reflection = serde_json::from_str(json).unwrap();

        assert_eq!(reflection.task_id, "task-2");
        assert!(!reflection.success);
        assert_eq!(reflection.insights.len(), 2);
        assert_eq!(reflection.improvements.len(), 2);
    }

    #[test]
    fn test_error_pattern_serialization() {
        let pattern = ErrorPattern {
            id: "pattern-1".to_string(),
            error_type: "Timeout".to_string(),
            root_cause: "Network latency".to_string(),
            prevention_strategy: "Add retry logic".to_string(),
            count: 5,
        };

        let json = serde_json::to_string(&pattern).unwrap();
        let deserialized: ErrorPattern = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.id, "pattern-1");
        assert_eq!(deserialized.error_type, "Timeout");
        assert_eq!(deserialized.root_cause, "Network latency");
        assert_eq!(deserialized.prevention_strategy, "Add retry logic");
        assert_eq!(deserialized.count, 5);
    }

    #[test]
    fn test_error_pattern_deserialization() {
        let json = r#"{
            "id": "pattern-2",
            "error_type": "AuthenticationError",
            "root_cause": "Invalid credentials",
            "prevention_strategy": "Implement proper auth flow",
            "count": 3
        }"#;

        let pattern: ErrorPattern = serde_json::from_str(json).unwrap();

        assert_eq!(pattern.id, "pattern-2");
        assert_eq!(pattern.error_type, "AuthenticationError");
        assert_eq!(pattern.root_cause, "Invalid credentials");
        assert_eq!(pattern.prevention_strategy, "Implement proper auth flow");
        assert_eq!(pattern.count, 3);
    }

    #[test]
    fn test_strategy_serialization() {
        let strategy = Strategy {
            id: "strategy-1".to_string(),
            name: "Caching".to_string(),
            description: "Implement caching for frequently accessed data".to_string(),
            effectiveness: 0.85,
        };

        let json = serde_json::to_string(&strategy).unwrap();
        let deserialized: Strategy = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.id, "strategy-1");
        assert_eq!(deserialized.name, "Caching");
        assert_eq!(deserialized.description, "Implement caching for frequently accessed data");
        assert_eq!(deserialized.effectiveness, 0.85);
    }

    #[test]
    fn test_strategy_deserialization() {
        let json = r#"{
            "id": "strategy-2",
            "name": "Parallel Processing",
            "description": "Use parallel processing for CPU-intensive tasks",
            "effectiveness": 0.92
        }"#;

        let strategy: Strategy = serde_json::from_str(json).unwrap();

        assert_eq!(strategy.id, "strategy-2");
        assert_eq!(strategy.name, "Parallel Processing");
        assert_eq!(strategy.description, "Use parallel processing for CPU-intensive tasks");
        assert_eq!(strategy.effectiveness, 0.92);
    }

    #[test]
    fn test_optimization_report_serialization() {
        let report = OptimizationReport {
            error_patterns_count: 10,
            strategies_count: 5,
            recommendations: vec![
                "Review error patterns".to_string(),
                "Implement strategies".to_string(),
            ],
        };

        let json = serde_json::to_string(&report).unwrap();
        let deserialized: OptimizationReport = serde_json::from_str(&json).unwrap();

        assert_eq!(deserialized.error_patterns_count, 10);
        assert_eq!(deserialized.strategies_count, 5);
        assert_eq!(deserialized.recommendations.len(), 2);
    }

    #[test]
    fn test_optimization_report_deserialization() {
        let json = r#"{
            "error_patterns_count": 15,
            "strategies_count": 8,
            "recommendations": ["Analyze patterns", "Apply top strategies", "Monitor results"]
        }"#;

        let report: OptimizationReport = serde_json::from_str(json).unwrap();

        assert_eq!(report.error_patterns_count, 15);
        assert_eq!(report.strategies_count, 8);
        assert_eq!(report.recommendations.len(), 3);
    }

    #[test]
    fn test_reflection_engine_creation() {
        let ai_provider = create_test_ai_provider();
        let reflection = ReflectionEngine::new(ai_provider);

        // Verify engine was created successfully
        // (More detailed tests would require async execution)
    }

    #[test]
    fn test_reflection_success_and_failure() {
        let success_reflection = Reflection {
            task_id: "task-success".to_string(),
            success: true,
            insights: vec!["Task completed successfully".to_string()],
            improvements: vec![],
        };
        assert!(success_reflection.success);

        let failure_reflection = Reflection {
            task_id: "task-failure".to_string(),
            success: false,
            insights: vec!["Task failed".to_string()],
            improvements: vec!["Fix error".to_string()],
        };
        assert!(!failure_reflection.success);
    }

    #[test]
    fn test_error_pattern_count() {
        let pattern = ErrorPattern {
            id: "pattern-1".to_string(),
            error_type: "Timeout".to_string(),
            root_cause: "Network latency".to_string(),
            prevention_strategy: "Add retry logic".to_string(),
            count: 0,
        };
        assert_eq!(pattern.count, 0);

        let pattern_with_count = ErrorPattern {
            id: "pattern-2".to_string(),
            error_type: "Timeout".to_string(),
            root_cause: "Network latency".to_string(),
            prevention_strategy: "Add retry logic".to_string(),
            count: 100,
        };
        assert_eq!(pattern_with_count.count, 100);
    }

    #[test]
    fn test_strategy_effectiveness_bounds() {
        let min_strategy = Strategy {
            id: "strategy-1".to_string(),
            name: "Min Strategy".to_string(),
            description: "Minimum effectiveness".to_string(),
            effectiveness: 0.0,
        };
        assert_eq!(min_strategy.effectiveness, 0.0);

        let max_strategy = Strategy {
            id: "strategy-2".to_string(),
            name: "Max Strategy".to_string(),
            description: "Maximum effectiveness".to_string(),
            effectiveness: 1.0,
        };
        assert_eq!(max_strategy.effectiveness, 1.0);

        let mid_strategy = Strategy {
            id: "strategy-3".to_string(),
            name: "Mid Strategy".to_string(),
            description: "Mid effectiveness".to_string(),
            effectiveness: 0.5,
        };
        assert_eq!(mid_strategy.effectiveness, 0.5);
    }

    #[test]
    fn test_reflection_json_roundtrip() {
        let original = Reflection {
            task_id: "task-123".to_string(),
            success: true,
            insights: vec![
                "Excellent performance".to_string(),
                "No errors detected".to_string(),
            ],
            improvements: vec![
                "Add logging".to_string(),
                "Improve documentation".to_string(),
            ],
        };

        let json = serde_json::to_string(&original).unwrap();
        let restored: Reflection = serde_json::from_str(&json).unwrap();

        assert_eq!(restored.task_id, original.task_id);
        assert_eq!(restored.success, original.success);
        assert_eq!(restored.insights, original.insights);
        assert_eq!(restored.improvements, original.improvements);
    }

    #[test]
    fn test_error_pattern_json_roundtrip() {
        let original = ErrorPattern {
            id: "pattern-xyz".to_string(),
            error_type: "DatabaseError".to_string(),
            root_cause: "Connection pool exhausted".to_string(),
            prevention_strategy: "Increase pool size and implement connection reuse".to_string(),
            count: 42,
        };

        let json = serde_json::to_string(&original).unwrap();
        let restored: ErrorPattern = serde_json::from_str(&json).unwrap();

        assert_eq!(restored.id, original.id);
        assert_eq!(restored.error_type, original.error_type);
        assert_eq!(restored.root_cause, original.root_cause);
        assert_eq!(restored.prevention_strategy, original.prevention_strategy);
        assert_eq!(restored.count, original.count);
    }

    #[test]
    fn test_strategy_json_roundtrip() {
        let original = Strategy {
            id: "strategy-abc".to_string(),
            name: "Load Balancing".to_string(),
            description: "Implement load balancing across multiple servers".to_string(),
            effectiveness: 0.95,
        };

        let json = serde_json::to_string(&original).unwrap();
        let restored: Strategy = serde_json::from_str(&json).unwrap();

        assert_eq!(restored.id, original.id);
        assert_eq!(restored.name, original.name);
        assert_eq!(restored.description, original.description);
        assert_eq!(restored.effectiveness, original.effectiveness);
    }

    #[test]
    fn test_optimization_report_json_roundtrip() {
        let original = OptimizationReport {
            error_patterns_count: 25,
            strategies_count: 12,
            recommendations: vec![
                "Review error patterns for common issues".to_string(),
                "Implement top strategies for improvement".to_string(),
                "Monitor system performance".to_string(),
                "Update policies based on findings".to_string(),
            ],
        };

        let json = serde_json::to_string(&original).unwrap();
        let restored: OptimizationReport = serde_json::from_str(&json).unwrap();

        assert_eq!(restored.error_patterns_count, original.error_patterns_count);
        assert_eq!(restored.strategies_count, original.strategies_count);
        assert_eq!(restored.recommendations, original.recommendations);
    }

    #[test]
    fn test_reflection_empty_insights_and_improvements() {
        let reflection = Reflection {
            task_id: "task-empty".to_string(),
            success: true,
            insights: vec![],
            improvements: vec![],
        };

        assert!(reflection.insights.is_empty());
        assert!(reflection.improvements.is_empty());
    }

    #[test]
    fn test_multiple_error_patterns() {
        let patterns = vec![
            ErrorPattern {
                id: "pattern-1".to_string(),
                error_type: "Timeout".to_string(),
                root_cause: "Network".to_string(),
                prevention_strategy: "Retry".to_string(),
                count: 10,
            },
            ErrorPattern {
                id: "pattern-2".to_string(),
                error_type: "AuthError".to_string(),
                root_cause: "Credentials".to_string(),
                prevention_strategy: "Refresh token".to_string(),
                count: 5,
            },
            ErrorPattern {
                id: "pattern-3".to_string(),
                error_type: "ValidationError".to_string(),
                root_cause: "Input".to_string(),
                prevention_strategy: "Validate input".to_string(),
                count: 3,
            },
        ];

        assert_eq!(patterns.len(), 3);
        assert_eq!(patterns[0].count, 10);
        assert_eq!(patterns[1].count, 5);
        assert_eq!(patterns[2].count, 3);
    }

    #[test]
    fn test_multiple_strategies() {
        let strategies = vec![
            Strategy {
                id: "strategy-1".to_string(),
                name: "Caching".to_string(),
                description: "Cache data".to_string(),
                effectiveness: 0.9,
            },
            Strategy {
                id: "strategy-2".to_string(),
                name: "Parallelism".to_string(),
                description: "Parallel processing".to_string(),
                effectiveness: 0.85,
            },
            Strategy {
                id: "strategy-3".to_string(),
                name: "Compression".to_string(),
                description: "Compress data".to_string(),
                effectiveness: 0.75,
            },
        ];

        assert_eq!(strategies.len(), 3);
        assert_eq!(strategies[0].effectiveness, 0.9);
        assert_eq!(strategies[1].effectiveness, 0.85);
        assert_eq!(strategies[2].effectiveness, 0.75);
    }
}
