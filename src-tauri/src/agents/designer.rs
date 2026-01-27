// Designer Agent Module
//
// This module implements the DesignerAgent, which specializes in:
// - UI mockups and diagrams
// - Visual formatting
// - Design tasks
//
// ## Capabilities
//
// - UI mockup generation
// - Diagram creation
// - Visual formatting
// - Design suggestions
//
// ## Usage
//
// ```rust
// use rainy_cowork_lib::agents::{DesignerAgent, AgentConfig, AgentRegistry};
//
// let config = AgentConfig {
//     agent_id: "designer-1".to_string(),
//     workspace_id: "workspace-1".to_string(),
//     ai_provider: "gemini".to_string(),
//     model: "gemini-2.0-flash".to_string(),
//     settings: serde_json::json!({}),
// };
//
// let registry = Arc::new(AgentRegistry::new());
// let agent = DesignerAgent::new(config, registry);
// ```

use std::sync::Arc;
use crate::agents::{
    Agent, AgentConfig, AgentError, AgentInfo, AgentMessage,
    AgentStatus, AgentType, Task, TaskResult,
    BaseAgent, AgentRegistry
};

/// DesignerAgent specializes in UI/UX design and visual elements
///
/// This agent handles:
/// - UI mockup generation and wireframing
/// - Diagram creation (flowcharts, sequence diagrams, etc.)
/// - Visual formatting and styling
/// - Design suggestions and recommendations
pub struct DesignerAgent {
    /// Base agent providing common functionality
    base: BaseAgent,
    /// Agent registry for accessing other agents and services
    registry: Arc<AgentRegistry>,
}

impl DesignerAgent {
    /// Create a new DesignerAgent
    ///
    /// # Arguments
    ///
    /// * `config` - Agent configuration
    /// * `registry` - Agent registry for accessing services
    ///
    /// # Returns
    ///
    /// A new DesignerAgent instance
    pub fn new(
        config: AgentConfig,
        registry: Arc<AgentRegistry>,
    ) -> Self {
        let ai_provider = registry.ai_provider();
        let message_bus = registry.message_bus();
        let base = BaseAgent::new(config, ai_provider, message_bus);

        Self { base, registry }
    }

    /// Generate a UI mockup
    ///
    /// # Arguments
    ///
    /// * `component_type` - Type of UI component (page, modal, form, etc.)
    /// * `requirements` - Design requirements and specifications
    ///
    /// # Returns
    ///
    /// UI mockup description and structure
    async fn generate_ui_mockup(
        &self,
        component_type: &str,
        requirements: &str,
    ) -> Result<String, AgentError> {
        let prompt = format!(
            "Generate a UI mockup for a {} with the following requirements:\n\n\
             {}\n\n\
             Provide a detailed description including:\n\
             - Layout structure\n\
             - Component hierarchy\n\
             - Visual elements\n\
             - User interactions\n\
             - Accessibility considerations",
            component_type, requirements
        );

        let mockup = self.base.query_ai(&prompt).await?;

        Ok(format!(
            "UI Mockup: {}\n\n\
             {}",
            component_type, mockup
        ))
    }

    /// Create a diagram
    ///
    /// # Arguments
    ///
    /// * `diagram_type` - Type of diagram (flowchart, sequence, architecture, etc.)
    /// * `content` - Content to represent in the diagram
    ///
    /// # Returns
    ///
    /// Diagram description and structure
    async fn create_diagram(
        &self,
        diagram_type: &str,
        content: &str,
    ) -> Result<String, AgentError> {
        let prompt = format!(
            "Create a {} diagram for the following:\n\n\
             {}\n\n\
             Provide a detailed description including:\n\
             - Diagram structure\n\
             - Nodes and connections\n\
             - Flow or sequence\n\
             - Labels and annotations",
            diagram_type, content
        );

        let diagram = self.base.query_ai(&prompt).await?;

        Ok(format!(
            "Diagram: {}\n\n\
             {}",
            diagram_type, diagram
        ))
    }

    /// Apply visual formatting to content
    ///
    /// # Arguments
    ///
    /// * `content` - Content to format
    /// * `formatting_style` - Style of formatting (markdown, HTML, etc.)
    ///
    /// # Returns
    ///
    /// Formatted content
    async fn apply_visual_formatting(
        &self,
        content: &str,
        formatting_style: &str,
    ) -> Result<String, AgentError> {
        let prompt = format!(
            "Apply {} visual formatting to the following content:\n\n\
             {}\n\n\
             Enhance readability with appropriate formatting, structure, and visual elements.",
            formatting_style, content
        );

        let formatted = self.base.query_ai(&prompt).await?;

        Ok(format!(
            "Formatted Content ({})\n\n\
             {}",
            formatting_style, formatted
        ))
    }

    /// Provide design suggestions
    ///
    /// # Arguments
    ///
    /// * `context` - Context for design suggestions
    /// * `requirements` - Design requirements
    ///
    /// # Returns
    ///
    /// Design suggestions and recommendations
    async fn provide_design_suggestions(
        &self,
        context: &str,
        requirements: &str,
    ) -> Result<String, AgentError> {
        let prompt = format!(
            "Provide design suggestions for the following:\n\n\
             Context: {}\n\n\
             Requirements: {}\n\n\
             Include recommendations for:\n\
             - Layout and structure\n\
             - Color scheme and typography\n\
             - User experience\n\
             - Accessibility\n\
             - Best practices",
            context, requirements
        );

        let suggestions = self.base.query_ai(&prompt).await?;

        Ok(format!(
            "Design Suggestions\n\
             Context: {}\n\n\
             {}",
            context, suggestions
        ))
    }
}

#[async_trait::async_trait]
impl Agent for DesignerAgent {
    fn info(&self) -> AgentInfo {
        AgentInfo {
            id: self.base.info().id,
            name: "Designer".to_string(),
            agent_type: AgentType::Designer,
            status: self.base.info().status,
            current_task: self.base.info().current_task,
        }
    }

    async fn process_task(&self, task: Task) -> Result<TaskResult, AgentError> {
        self.base.update_status(AgentStatus::Busy).await;
        self.base.set_current_task(Some(task.id.clone())).await;

        let result = if task.description.contains("mockup") ||
                       task.description.contains("wireframe") {
            // UI mockup generation
            let component_type = task.context.relevant_files
                .first()
                .unwrap_or(&"component".to_string());

            self.generate_ui_mockup(
                component_type,
                &task.context.user_instruction,
            ).await?
        } else if task.description.contains("diagram") ||
                   task.description.contains("flowchart") ||
                   task.description.contains("sequence") {
            // Diagram creation
            let diagram_type = if task.description.contains("flowchart") {
                "flowchart"
            } else if task.description.contains("sequence") {
                "sequence"
            } else if task.description.contains("architecture") {
                "architecture"
            } else {
                "diagram"
            };

            let content = task.context.relevant_files
                .first()
                .unwrap_or(&"No content provided".to_string());

            self.create_diagram(
                diagram_type,
                content,
            ).await?
        } else if task.description.contains("format") ||
                   task.description.contains("style") {
            // Visual formatting
            let formatting_style = if task.description.contains("markdown") {
                "markdown"
            } else if task.description.contains("html") {
                "HTML"
            } else {
                "formatted"
            };

            let content = task.context.relevant_files
                .first()
                .unwrap_or(&task.context.user_instruction);

            self.apply_visual_formatting(
                content,
                formatting_style,
            ).await?
        } else if task.description.contains("suggest") ||
                   task.description.contains("design") {
            // Design suggestions
            let context = task.context.relevant_files
                .first()
                .unwrap_or(&"No context provided".to_string());

            self.provide_design_suggestions(
                context,
                &task.context.user_instruction,
            ).await?
        } else {
            // Use AI to process general design task
            let prompt = format!(
                "Design Task: {}\n\nContext: {}\n\n\
                 Please complete this design task and provide detailed visual specifications.",
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
                "agent_type": "Designer",
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
            "ui_mockup_generation".to_string(),
            "diagram_creation".to_string(),
            "visual_formatting".to_string(),
            "design_suggestions".to_string(),
        ]
    }

    fn can_handle(&self, task: &Task) -> bool {
        let desc = task.description.to_lowercase();
        desc.contains("mockup") ||
        desc.contains("wireframe") ||
        desc.contains("diagram") ||
        desc.contains("flowchart") ||
        desc.contains("design") ||
        desc.contains("format") ||
        desc.contains("style") ||
        desc.contains("suggest")
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
    async fn test_designer_agent_creation() {
        let config = AgentConfig {
            agent_id: "designer-1".to_string(),
            workspace_id: "workspace-1".to_string(),
            ai_provider: "gemini".to_string(),
            model: "gemini-2.0-flash".to_string(),
            settings: serde_json::json!({}),
        };

        let ai_provider = Arc::new(AIProviderManager::new());
        let registry = Arc::new(AgentRegistry::new(ai_provider));

        let agent = DesignerAgent::new(config, registry);
        assert_eq!(agent.info().name, "Designer");
        assert_eq!(agent.info().agent_type, AgentType::Designer);
    }

    #[tokio::test]
    async fn test_designer_capabilities() {
        let config = AgentConfig {
            agent_id: "designer-1".to_string(),
            workspace_id: "workspace-1".to_string(),
            ai_provider: "gemini".to_string(),
            model: "gemini-2.0-flash".to_string(),
            settings: serde_json::json!({}),
        };

        let ai_provider = Arc::new(AIProviderManager::new());
        let registry = Arc::new(AgentRegistry::new(ai_provider));

        let agent = DesignerAgent::new(config, registry);
        let capabilities = agent.capabilities();

        assert!(capabilities.contains(&"ui_mockup_generation".to_string()));
        assert!(capabilities.contains(&"diagram_creation".to_string()));
        assert!(capabilities.contains(&"visual_formatting".to_string()));
        assert!(capabilities.contains(&"design_suggestions".to_string()));
    }

    #[tokio::test]
    async fn test_designer_can_handle() {
        let config = AgentConfig {
            agent_id: "designer-1".to_string(),
            workspace_id: "workspace-1".to_string(),
            ai_provider: "gemini".to_string(),
            model: "gemini-2.0-flash".to_string(),
            settings: serde_json::json!({}),
        };

        let ai_provider = Arc::new(AIProviderManager::new());
        let registry = Arc::new(AgentRegistry::new(ai_provider));

        let agent = DesignerAgent::new(config, registry);

        let mockup_task = Task {
            id: "task-1".to_string(),
            description: "Create a mockup for login page".to_string(),
            priority: crate::agents::types::TaskPriority::Medium,
            dependencies: vec![],
            context: TaskContext {
                workspace_id: "ws-1".to_string(),
                user_instruction: "Design login page".to_string(),
                relevant_files: vec!["login page".to_string()],
                memory_context: vec![],
            },
        };

        assert!(agent.can_handle(&mockup_task));

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
