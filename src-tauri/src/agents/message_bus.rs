// Message Bus Module
//
// This module implements the MessageBus for inter-agent communication.
// It provides a simple in-memory message queue system that allows agents
// to send messages to each other asynchronously.
//
// ## Features
//
// - Point-to-point messaging: Send messages to specific agents
// - Broadcast messaging: Send messages to all agents except the sender
// - Thread-safe: Uses Arc<RwLock> for concurrent access
// - Simple API: Easy to use for agent communication
//
// ## Usage
//
// ```rust
// use rainy_cowork_lib::agents::{MessageBus, AgentMessage};
//
// let message_bus = Arc::new(MessageBus::new());
//
// // Send a message to a specific agent
// message_bus.send(
//     "director-1".to_string(),
//     "researcher-1".to_string(),
//     AgentMessage::TaskAssign { task_id: "task-1".to_string(), task }
// ).await?;
//
// // Receive messages
// let messages = message_bus.receive("researcher-1").await;
//
// // Broadcast to all agents
// message_bus.broadcast(
//     "director-1".to_string(),
//     AgentMessage::TaskResult { task_id: "task-1".to_string(), result }
// ).await;
// ```

use crate::agents::types::AgentMessage;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Message bus for inter-agent communication
///
/// Provides a simple in-memory message queue system that allows agents
/// to send messages to each other asynchronously.
///
/// # Thread Safety
///
/// The MessageBus is thread-safe and can be shared across multiple agents
/// using Arc<RwLock> for concurrent access.
pub struct MessageBus {
    /// Message queues for each agent
    /// Maps agent_id to a vector of pending messages
    queues: Arc<RwLock<HashMap<String, Vec<AgentMessage>>>>,
}

impl MessageBus {
    /// Create a new MessageBus
    ///
    /// # Returns
    ///
    /// A new MessageBus instance with empty message queues
    pub fn new() -> Self {
        Self {
            queues: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Receive all pending messages for an agent
    ///
    /// This method removes and returns all pending messages for the specified
    /// agent. After calling this method, the agent's message queue will be empty.
    ///
    /// # Arguments
    ///
    /// * `agent_id` - ID of the agent to receive messages for
    ///
    /// # Returns
    ///
    /// Vector of pending messages (empty if no messages are pending)
    pub async fn receive(&self, agent_id: &str) -> Vec<AgentMessage> {
        let mut queues = self.queues.write().await;
        queues.remove(agent_id).unwrap_or_default()
    }
}

impl Default for MessageBus {
    fn default() -> Self {
        Self::new()
    }
}
