// Analyst Agent Module
//
// This module implements the AnalystAgent, which specializes in:
// - Data analysis and processing
// - Visualization
// - Insights generation
//
// ## Capabilities
//
// - Data analysis
// - Visualization
// - Insights generation
// - Pattern recognition
//
// ## Usage
//
// ```rust
// use rainy_cowork_lib::agents::{AnalystAgent, AgentConfig, AgentRegistry};
//
// let config = AgentConfig {
//     agent_id: "analyst-1".to_string(),
//     workspace_id: "workspace-1".to_string(),
//     ai_provider: "gemini".to_string(),
//     model: "gemini-2.0-flash".to_string(),
//     settings: serde_json::json!({}),
// };
//
// let registry = Arc::new(AgentRegistry::new());
// let agent = AnalystAgent::new(config, registry);
// ```

use std::sync::Arc;
use crate::agents::{
    Agent, AgentConfig, AgentError, AgentInfo, AgentMessage,
    AgentStatus, AgentType, Task, TaskResult,
    BaseAgent, AgentRegistry
};

/// AnalystAgent specializes in data analysis and insights generation
///
/// This agent handles:
/// - Data analysis and processing
/// - Data visualization recommendations
/// - Insights generation from data
/// - Pattern recognition and trend analysis
pub struct AnalystAgent {
    /// Base agent providing common functionality
    base: BaseAgent,
    /// Agent registry for accessing other agents and services
    registry: Arc<AgentRegistry>,
}

impl AnalystAgent {
    /// Create a new AnalystAgent
    ///
    /// # Arguments
    ///
    /// * `config` - Agent configuration
    /// * `registry` - Agent registry for accessing services
    ///
    /// # Returns
    ///
    /// A new AnalystAgent instance
    pub fn new(
        config: AgentConfig,
        registry: Arc<AgentRegistry>,
    ) -> Self {
        let ai_provider = registry.ai_provider();
        let message_bus = registry.message_bus();
        let base = BaseAgent::new(config, ai_provider, message_bus);

        Self { base, registry }
    }

    /// Analyze data and provide insights
    ///
    /// # Arguments
    ///
    /// * `data` - Data to analyze
    /// * `analysis_type` - Type of analysis (statistical, trend, etc.)
    ///
    /// # Returns
    ///
    /// Analysis results and insights
    async fn analyze_data(
        &self,
        data: &str,
        analysis_type: &str,
    ) -> Result<String, AgentError> {
        let prompt = format!(
            "Perform {} analysis on the following data:\n\n\
             {}\n\n\
             Provide:\n\
             - Key findings\n\
             - Statistical insights\n\
             - Patterns and trends\n\
             - Recommendations",
            analysis_type, data
        );

        let analysis = self.base.query_ai(&prompt).await?;

        Ok(format!(
            "Data Analysis ({})\n\
             ==================\n\n\
             {}",
            analysis_type, analysis
        ))
    }

    /// Generate visualization recommendations
    ///
    /// # Arguments
    ///
    /// * `data` - Data to visualize
    /// * `visualization_goals` - Goals for visualization
    ///
    /// # Returns
    ///
    /// Visualization recommendations and specifications
    async fn generate_visualization(
        &self,
        data: &str,
        visualization_goals: &str,
    ) -> Result<String, AgentError> {
        let prompt = format!(
            "Generate visualization recommendations for the following data:\n\n\
             Data:\n{}\n\n\
             Goals: {}\n\n\
             Provide:\n\
             - Recommended chart types\n\
             - Visualization specifications\n\
             - Color schemes and styling\n\
             - Implementation guidance",
            data, visualization_goals
        );

        let visualization = self.base.query_ai(&prompt).await?;

        Ok(format!(
            "Visualization Recommendations\n\
             Goals: {}\n\n\
             {}",
            visualization_goals, visualization
        ))
    }

    /// Generate insights from data
    ///
    /// # Arguments
    ///
    /// * `data` - Data to analyze for insights
    /// * `insight_type` - Type of insights (business, technical, etc.)
    ///
    /// # Returns
    ///
    /// Generated insights
    async fn generate_insights(
        &self,
        data: &str,
        insight_type: &str,
    ) -> Result<String, AgentError> {
        let prompt = format!(
            "Generate {} insights from the following data:\n\n\
             {}\n\n\
             Provide:\n\
             - Key insights\n\
             - Actionable recommendations\n\
             - Impact analysis\n\
             - Next steps",
            insight_type, data
        );

        let insights = self.base.query_ai(&prompt).await?;

        Ok(format!(
            "Generated Insights ({})\n\
             =======================\n\n\
             {}",
            insight_type, insights
        ))
    }

    /// Recognize patterns in data
    ///
    /// # Arguments
    ///
    /// * `data` - Data to analyze for patterns
    /// * `pattern_type` - Type of patterns to look for
    ///
    /// # Returns
    ///
    /// Pattern recognition results
    async fn recognize_patterns(
        &self,
        data: &str,
        pattern_type: &str,
    ) -> Result<String, AgentError> {
        let prompt = format!(
            "Recognize {} patterns in the following data:\n\n\
             {}\n\n\
             Provide:\n\
             - Identified patterns\n\
             - Pattern significance\n\
             - Predictions based on patterns\n\
             - Anomalies or outliers",
            pattern_type, data
        );

        let patterns = self.base.query_ai(&prompt).await?;

        Ok(format!(
            "Pattern Recognition ({})\n\
             =======================\n\n\
             {}",
            pattern_type, patterns
        ))
    }
}

#[async_trait::async_trait]
impl Agent for AnalystAgent {
    fn info(&self) -> AgentInfo {
        AgentInfo {
            id: self.base.info().id,
            name: "Analyst".to_string(),
            agent_type: AgentType::Analyst,
            status: self.base.info().status,
            current_task: self.base.info().current_task,
        }
    }

    async fn process_task(&self, task: Task) -> Result<TaskResult, AgentError> {
        self.base.update_status(AgentStatus::Busy).await;
        self.base.set_current_task(Some(task.id.clone())).await;

        let result = if task.description.contains("analyze") ||
                       task.description.contains("analysis") {
            // Data analysis
            let analysis_type = if task.description.contains("statistical") {
                "statistical"
            } else if task.description.contains("trend") {
                "trend"
            } else if task.description.contains("comparative") {
                "comparative"
            } else {
                "comprehensive"
            };

            let default_data = "No data provided".to_string();
            let data = task.context.relevant_files
                .first()
                .unwrap_or(&default_data);

            self.analyze_data(
                data,
                analysis_type,
            ).await?
        } else if task.description.contains("visualize") ||
                    task.description.contains("chart") ||
                    task.description.contains("graph") {
            // Visualization
            let default_data = "No data provided".to_string();
            let data = task.context.relevant_files
                .first()
                .unwrap_or(&default_data);

            let visualization_goals = if task.description.contains("trend") {
                "show trends over time"
            } else if task.description.contains("comparison") {
                "compare different categories"
            } else if task.description.contains("distribution") {
                "show data distribution"
            } else {
                "general visualization"
            };

            self.generate_visualization(
                data,
                visualization_goals,
            ).await?
        } else if task.description.contains("insight") ||
                   task.description.contains("recommendation") {
            // Insights generation
            let default_data = "No data provided".to_string();
            let data = task.context.relevant_files
                .first()
                .unwrap_or(&default_data);

            let insight_type = if task.description.contains("business") {
                "business"
            } else if task.description.contains("technical") {
                "technical"
            } else {
                "general"
            };

            self.generate_insights(
                data,
                insight_type,
            ).await?
        } else if task.description.contains("pattern") ||
                   task.description.contains("trend") {
            // Pattern recognition
            let default_data = "No data provided".to_string();
            let data = task.context.relevant_files
                .first()
                .unwrap_or(&default_data);

            let pattern_type = if task.description.contains("seasonal") {
                "seasonal"
            } else if task.description.contains("recurring") {
                "recurring"
            } else {
                "general"
            };

            self.recognize_patterns(
                data,
                pattern_type,
            ).await?
        } else {
            // Use AI to process general analysis task
            let prompt = format!(
                "Analysis Task: {}\n\nContext: {}\n\n\
                 Please complete this analysis task and provide comprehensive insights.",
                task.description,
                task.context.user_instruction
            );
            self.base.query_ai(&prompt).await?
        };

        self.base.update_status(AgentStatus::Idle).await;
        self.base.set_current_task(None).await;

        Ok(TaskResult {
            success: true,
            output: result,
            errors: vec![],
            metadata: serde_json::json!({
                "task_id": task.id,
                "agent_type": "Analyst",
                "agent_id": self.base.config().agent_id,
            }),
        })
    }

    async fn handle_message(&self, message: AgentMessage) -> Result<(), AgentError> {
        match message {
            AgentMessage::TaskAssign { task, .. } => {
                let result = self.process_task(task).await?;
                // Send result back to sender
                // TODO: Implement result sending logic
                let _ = result;
            }
            _ => {}
        }
        Ok(())
    }

    fn capabilities(&self) -> Vec<String> {
        vec![
            "data_analysis".to_string(),
            "visualization".to_string(),
            "insights_generation".to_string(),
            "pattern_recognition".to_string(),
        ]
    }

    fn can_handle(&self, task: &Task) -> bool {
        let desc = task.description.to_lowercase();
        desc.contains("analyze") ||
        desc.contains("analysis") ||
        desc.contains("data") ||
        desc.contains("visualize") ||
        desc.contains("chart") ||
        desc.contains("graph") ||
        desc.contains("insight") ||
        desc.contains("pattern") ||
        desc.contains("trend") ||
        desc.contains("statistics")
    }

    async fn initialize(&mut self, config: AgentConfig) -> Result<(), AgentError> {
        self.base.initialize(config).await
    }

    async fn shutdown(&mut self) -> Result<(), AgentError> {
        self.base.shutdown().await
    }

    async fn update_status(&self, status: AgentStatus) {
        self.base.update_status(status).await;
    }

    async fn set_current_task(&self, task_id: Option<String>) {
        self.base.set_current_task(task_id).await;
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::agents::types::TaskContext;
    use crate::ai::provider::AIProviderManager;

    #[tokio::test]
    async fn test_analyst_agent_creation() {
        let config = AgentConfig {
            agent_id: "analyst-1".to_string(),
            workspace_id: "workspace-1".to_string(),
            ai_provider: "gemini".to_string(),
            model: "gemini-2.0-flash".to_string(),
            settings: serde_json::json!({}),
        };

        let ai_provider = Arc::new(AIProviderManager::new());
        let registry = Arc::new(AgentRegistry::new(ai_provider));

        let agent = AnalystAgent::new(config, registry);
        assert_eq!(agent.info().name, "Analyst");
        assert_eq!(agent.info().agent_type, AgentType::Analyst);
    }

    #[tokio::test]
    async fn test_analyst_capabilities() {
        let config = AgentConfig {
            agent_id: "analyst-1".to_string(),
            workspace_id: "workspace-1".to_string(),
            ai_provider: "gemini".to_string(),
            model: "gemini-2.0-flash".to_string(),
            settings: serde_json::json!({}),
        };

        let ai_provider = Arc::new(AIProviderManager::new());
        let registry = Arc::new(AgentRegistry::new(ai_provider));

        let agent = AnalystAgent::new(config, registry);
        let capabilities = agent.capabilities();

        assert!(capabilities.contains(&"data_analysis".to_string()));
        assert!(capabilities.contains(&"visualization".to_string()));
        assert!(capabilities.contains(&"insights_generation".to_string()));
        assert!(capabilities.contains(&"pattern_recognition".to_string()));
    }

    #[tokio::test]
    async fn test_analyst_can_handle() {
        let config = AgentConfig {
            agent_id: "analyst-1".to_string(),
            workspace_id: "workspace-1".to_string(),
            ai_provider: "gemini".to_string(),
            model: "gemini-2.0-flash".to_string(),
            settings: serde_json::json!({}),
        };

        let ai_provider = Arc::new(AIProviderManager::new());
        let registry = Arc::new(AgentRegistry::new(ai_provider));

        let agent = AnalystAgent::new(config, registry);

        let analysis_task = Task {
            id: "task-1".to_string(),
            description: "Analyze sales data".to_string(),
            priority: crate::agents::types::TaskPriority::Medium,
            dependencies: vec![],
            context: TaskContext {
                workspace_id: "ws-1".to_string(),
                user_instruction: "Analyze data".to_string(),
                relevant_files: vec!["sales data".to_string()],
                memory_context: vec![],
            },
        };

        assert!(agent.can_handle(&analysis_task));

        let code_task = Task {
            id: "task-2".to_string(),
            description: "Write a function".to_string(),
            priority: crate::agents::types::TaskPriority::Medium,
            dependencies: vec![],
            context: TaskContext {
                workspace_id: "ws-1".to_string(),
                user_instruction: "Write code".to_string(),
                relevant_files: vec![],
                memory_context: vec![],
            },
        };

        assert!(!agent.can_handle(&code_task));
    }
}
