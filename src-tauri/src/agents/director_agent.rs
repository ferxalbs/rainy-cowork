// Director Agent Module
//
// This module implements the DirectorAgent, which serves as the central orchestrator
// for the multi-agent system. The DirectorAgent is responsible for:
//
// - Decomposing complex tasks into executable subtasks
// - Assigning subtasks to appropriate specialized agents
// - Coordinating parallel execution of subtasks
// - Aggregating results from multiple agents into a cohesive output
//
// ## Architecture
//
// The DirectorAgent wraps a BaseAgent and uses the AgentRegistry to manage
// specialized agents. It leverages AI to analyze tasks and determine optimal
// decomposition and assignment strategies.
//
// ## Usage
//
// ```rust
// use rainy_cowork_lib::agents::{DirectorAgent, AgentConfig, Task};
//
// let director = DirectorAgent::new(config, registry);
// let result = director.process_task(task).await?;
// ```

use crate::agents::agent_trait::{Agent, AgentConfig, AgentError};
use crate::agents::base_agent::BaseAgent;
use crate::agents::registry::AgentRegistry;
use crate::agents::types::{
    AgentInfo, AgentMessage, AgentStatus, AgentType, Task, TaskContext, TaskPriority, TaskResult,
};
use std::collections::HashSet;
use std::sync::Arc;
use tokio::sync::RwLock;

/// A subtask created by decomposing a complex task
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct SubTask {
    /// Unique identifier for the subtask
    pub id: String,
    /// Description of what the subtask should accomplish
    pub description: String,
    /// Type of agent that should handle this subtask
    pub agent_type: String,
    /// IDs of subtasks this subtask depends on
    pub dependencies: Vec<String>,
    /// Priority level for this subtask
    pub priority: TaskPriority,
}

/// Assignment of a subtask to a specific agent
#[derive(Debug, Clone)]
pub struct TaskAssignment {
    /// ID of the subtask
    pub subtask_id: String,
    /// ID of the agent assigned to handle the subtask
    pub agent_id: String,
    /// Current status of the assignment
    pub status: AssignmentStatus,
    /// Dependencies for this assignment
    pub dependencies: Vec<String>,
}

/// Status of a task assignment
#[derive(Debug, Clone, PartialEq)]
pub enum AssignmentStatus {
    /// Task is pending execution
    Pending,
    /// Task completed successfully
    Completed,
}

/// Director agent for orchestrating the multi-agent system
///
/// The DirectorAgent is responsible for:
/// - Decomposing complex tasks into subtasks
/// - Assigning subtasks to specialized agents
/// - Coordinating parallel execution
/// - Aggregating results from multiple agents
pub struct DirectorAgent {
    /// Base agent providing common functionality
    base: BaseAgent,
    /// Registry for managing specialized agents
    registry: Arc<AgentRegistry>,
    /// Current task assignments being tracked
    assignments: Arc<RwLock<Vec<TaskAssignment>>>,
    /// Results collected from subtasks
    results: Arc<RwLock<Vec<TaskResult>>>,
}

impl DirectorAgent {
    /// Create a new DirectorAgent
    ///
    /// # Arguments
    ///
    /// * `config` - Agent configuration
    /// * `registry` - Agent registry for managing specialized agents
    ///
    /// # Returns
    ///
    /// A new DirectorAgent instance
    pub fn new(config: AgentConfig, registry: Arc<AgentRegistry>) -> Self {
        let ai_provider = registry.ai_provider();
        let message_bus = registry.message_bus();
        let base = BaseAgent::new(config, ai_provider, message_bus);

        Self {
            base,
            registry,
            assignments: Arc::new(RwLock::new(Vec::new())),
            results: Arc::new(RwLock::new(Vec::new())),
        }
    }

    /// Decompose a complex task into subtasks
    ///
    /// Uses AI to analyze the task and create a structured decomposition
    /// with dependencies and agent type assignments.
    ///
    /// # Arguments
    ///
    /// * `task` - The task to decompose
    ///
    /// # Returns
    ///
    /// A vector of SubTask structs representing the decomposition
    async fn decompose_task(&self, task: &Task) -> Result<Vec<SubTask>, AgentError> {
        let prompt = format!(
            "Analyze this task and break it down into subtasks:\n\
            Task: {}\n\
            Context: {:?}\n\n\
            Return a JSON array of subtasks with:\n\
            - id: unique identifier (e.g., 'subtask-1', 'subtask-2')\n\
            - description: what to do\n\
            - agent_type: which agent should handle (researcher, executor, creator, designer, developer, analyst)\n\
            - dependencies: array of subtask IDs this depends on\n\
            - priority: low, medium, high, critical\n\n\
            Ensure dependencies form a valid DAG (no cycles).",
            task.description,
            task.context
        );

        let response = self.base.query_ai(&prompt).await?;

        // Parse AI response into SubTask structs
        let subtasks: Vec<SubTask> = serde_json::from_str(&response).map_err(|e| {
            AgentError::TaskExecutionFailed(format!("Failed to parse subtasks: {}", e))
        })?;

        // Validate subtasks
        self.validate_subtasks(&subtasks)?;

        Ok(subtasks)
    }

    /// Validate subtask structure and dependencies
    ///
    /// Ensures that:
    /// - All subtask IDs are unique
    /// - Dependencies reference valid subtask IDs
    /// - No circular dependencies exist
    pub fn validate_subtasks(&self, subtasks: &[SubTask]) -> Result<(), AgentError> {
        // Check for unique IDs
        let mut ids = HashSet::new();
        for subtask in subtasks {
            if !ids.insert(&subtask.id) {
                return Err(AgentError::TaskExecutionFailed(format!(
                    "Duplicate subtask ID: {}",
                    subtask.id
                )));
            }
        }

        // Check that all dependencies reference valid subtasks
        for subtask in subtasks {
            for dep in &subtask.dependencies {
                if !ids.contains(dep) {
                    return Err(AgentError::TaskExecutionFailed(format!(
                        "Subtask {} depends on non-existent subtask {}",
                        subtask.id, dep
                    )));
                }
            }
        }

        // Check for circular dependencies using DFS
        for subtask in subtasks {
            if self.has_cycle(subtask, subtasks, &mut HashSet::new())? {
                return Err(AgentError::TaskExecutionFailed(
                    "Circular dependency detected in subtasks".to_string(),
                ));
            }
        }

        Ok(())
    }

    /// Check for circular dependencies using DFS
    fn has_cycle(
        &self,
        subtask: &SubTask,
        all_subtasks: &[SubTask],
        visited: &mut HashSet<String>,
    ) -> Result<bool, AgentError> {
        if visited.contains(&subtask.id) {
            return Ok(true);
        }

        visited.insert(subtask.id.clone());

        for dep_id in &subtask.dependencies {
            if let Some(dep_subtask) = all_subtasks.iter().find(|s| &s.id == dep_id) {
                if self.has_cycle(dep_subtask, all_subtasks, visited)? {
                    return Ok(true);
                }
            }
        }

        visited.remove(&subtask.id);
        Ok(false)
    }

    /// Assign subtasks to specialized agents
    ///
    /// Finds appropriate agents for each subtask based on agent type
    /// and availability, then creates task assignments.
    ///
    /// # Arguments
    ///
    /// * `subtasks` - The subtasks to assign
    ///
    /// # Returns
    ///
    /// A vector of TaskAssignment structs
    async fn assign_subtasks(
        &self,
        subtasks: Vec<SubTask>,
    ) -> Result<Vec<TaskAssignment>, AgentError> {
        let mut assignments = Vec::new();

        for subtask in subtasks {
            // Find appropriate agent for this subtask
            let _agent_id = self.find_agent_for_subtask(&subtask).await?;

            // Create task for the agent
            let task = Task {
                id: subtask.id.clone(),
                description: subtask.description.clone(),
                priority: subtask.priority,
                dependencies: subtask.dependencies.clone(),
                context: TaskContext {
                    workspace_id: "default".to_string(),
                    user_instruction: subtask.description.clone(),
                    relevant_files: vec![],
                    memory_context: vec![],
                },
            };

            // Assign task to agent
            let assigned_agent_id = self.registry.assign_task(task).await?;

            assignments.push(TaskAssignment {
                subtask_id: subtask.id,
                agent_id: assigned_agent_id,
                status: AssignmentStatus::Pending,
                dependencies: subtask.dependencies,
            });
        }

        Ok(assignments)
    }

    /// Find appropriate agent for a subtask
    ///
    /// Searches for an idle agent of the required type.
    ///
    /// # Arguments
    ///
    /// * `subtask` - The subtask to find an agent for
    ///
    /// # Returns
    ///
    /// The ID of the selected agent
    async fn find_agent_for_subtask(&self, subtask: &SubTask) -> Result<String, AgentError> {
        // Get all agents
        let agents = self.registry.list_agents().await;

        // Filter agents by type and status
        let matching_agents: Vec<_> = agents
            .into_iter()
            .filter(|a| {
                // Check if agent type matches subtask requirement
                let type_matches = match subtask.agent_type.as_str() {
                    "researcher" => matches!(a.agent_type, AgentType::Researcher),
                    "executor" => matches!(a.agent_type, AgentType::Executor),
                    "creator" => matches!(a.agent_type, AgentType::Creator),
                    "designer" => matches!(a.agent_type, AgentType::Designer),
                    "developer" => matches!(a.agent_type, AgentType::Developer),
                    "analyst" => matches!(a.agent_type, AgentType::Analyst),
                    _ => false,
                };

                type_matches && matches!(a.status, AgentStatus::Idle)
            })
            .collect();

        // Return first idle agent
        if let Some(agent) = matching_agents.first() {
            return Ok(agent.id.clone());
        }

        Err(AgentError::AgentBusy(format!(
            "No available {} agent",
            subtask.agent_type
        )))
    }

    /// Coordinate parallel execution of subtasks
    ///
    /// Executes subtasks in parallel when possible, respecting dependencies
    /// between subtasks. Monitors progress and handles failures.
    ///
    /// # Arguments
    ///
    /// * `assignments` - The task assignments to coordinate
    ///
    /// # Returns
    ///
    /// A vector of TaskResult structs from completed subtasks
    async fn coordinate_execution(
        &self,
        assignments: Vec<TaskAssignment>,
    ) -> Result<Vec<TaskResult>, AgentError> {
        let mut assignments = assignments;
        let mut completed = HashSet::new();
        let mut results = Vec::new();

        loop {
            // Find subtasks whose dependencies are satisfied
            let ready_indices: Vec<usize> = assignments
                .iter()
                .enumerate()
                .filter(|(_, a)| {
                    matches!(a.status, AssignmentStatus::Pending)
                        && a.dependencies.iter().all(|dep| completed.contains(dep))
                })
                .map(|(i, _)| i)
                .collect();

            if ready_indices.is_empty() {
                // Check if all tasks are completed
                let all_completed = assignments.iter().all(|a| {
                    matches!(
                        a.status,
                        AssignmentStatus::Completed | AssignmentStatus::Failed
                    )
                });

                if all_completed {
                    break;
                }

                // Wait for some tasks to complete
                tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
                continue;
            }

            // Execute ready tasks in parallel
            let mut handles = Vec::new();
            for idx in ready_indices {
                let assignment = assignments[idx].clone();
                let _registry = self.registry.clone();
                let results_ref = self.results.clone();

                let handle = tokio::spawn(async move {
                    // Wait for task to complete
                    // In a real implementation, we'd poll the agent or use events
                    tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;

                    // Get result from agent
                    // TODO: Implement proper result retrieval via message bus
                    let result = TaskResult {
                        success: true,
                        output: format!("Result from {}", assignment.subtask_id),
                        errors: vec![],
                        metadata: serde_json::json!({
                            "subtask_id": assignment.subtask_id,
                            "agent_id": assignment.agent_id,
                        }),
                    };

                    // Store result
                    let mut results = results_ref.write().await;
                    results.push(result.clone());

                    result
                });

                handles.push((idx, handle));
            }

            // Wait for all tasks to complete
            for (idx, handle) in handles {
                let result = handle
                    .await
                    .map_err(|e| AgentError::TaskExecutionFailed(e.to_string()))?;

                results.push(result);
                assignments[idx].status = AssignmentStatus::Completed;
                completed.insert(assignments[idx].subtask_id.clone());
            }
        }

        Ok(results)
    }

    /// Aggregate results from multiple subtasks
    ///
    /// Uses AI to combine results from multiple subtasks into a
    /// cohesive output that addresses the original task.
    ///
    /// # Arguments
    ///
    /// * `results` - The results from completed subtasks
    ///
    /// # Returns
    ///
    /// A single TaskResult combining all subtask results
    async fn aggregate_results(&self, results: Vec<TaskResult>) -> Result<TaskResult, AgentError> {
        if results.is_empty() {
            return Ok(TaskResult {
                success: true,
                output: "No subtasks were executed".to_string(),
                errors: vec![],
                metadata: serde_json::json!({}),
            });
        }

        // Use AI to combine results
        let results_json = serde_json::to_string(&results)
            .map_err(|e| AgentError::TaskExecutionFailed(e.to_string()))?;

        let prompt = format!(
            "Combine these task results into a cohesive output:\n\
            Results: {}\n\n\
            Provide a unified response that addresses the original task. \
            Organize the information clearly and highlight key findings.",
            results_json
        );

        let combined_output = self.base.query_ai(&prompt).await?;

        Ok(TaskResult {
            success: true,
            output: combined_output,
            errors: vec![],
            metadata: serde_json::json!({
                "subtask_count": results.len(),
                "aggregated": true,
            }),
        })
    }
}

// Implement Agent trait for DirectorAgent
#[async_trait::async_trait]
impl Agent for DirectorAgent {
    fn info(&self) -> AgentInfo {
        AgentInfo {
            id: self.base.info().id,
            name: "Director".to_string(),
            agent_type: AgentType::Director,
            status: self.base.info().status,
            current_task: self.base.info().current_task,
        }
    }

    async fn process_task(&self, task: Task) -> Result<TaskResult, AgentError> {
        // Update status
        self.base.update_status(AgentStatus::Busy).await;
        self.base.set_current_task(Some(task.id.clone())).await;

        // Decompose task into subtasks
        let subtasks = self.decompose_task(&task).await?;

        // Assign subtasks to agents
        let assignments = self.assign_subtasks(subtasks).await?;

        // Store assignments
        *self.assignments.write().await = assignments.clone();

        // Coordinate parallel execution
        let results = self.coordinate_execution(assignments).await?;

        // Aggregate results
        let final_result = self.aggregate_results(results).await?;

        // Update status
        self.base.update_status(AgentStatus::Idle).await;
        self.base.set_current_task(None).await;

        Ok(final_result)
    }

    async fn handle_message(&self, message: AgentMessage) -> Result<(), AgentError> {
        match message {
            AgentMessage::TaskAssign { task_id, task } => {
                let result = self.process_task(task).await;
                // Send result back
                // TODO: Implement result sending via message bus
                println!("Task {} result: {:?}", task_id, result);
            }
            _ => {
                return Err(AgentError::MessageHandlingFailed(
                    "DirectorAgent only handles TaskAssign messages".to_string(),
                ));
            }
        }
        Ok(())
    }

    fn capabilities(&self) -> Vec<String> {
        vec![
            "task_decomposition".to_string(),
            "agent_assignment".to_string(),
            "parallel_coordination".to_string(),
            "result_aggregation".to_string(),
        ]
    }

    fn can_handle(&self, task: &Task) -> bool {
        // Director handles complex tasks that need decomposition
        task.description.len() > 100 || !task.dependencies.is_empty()
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
