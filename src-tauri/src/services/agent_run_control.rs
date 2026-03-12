use crate::services::agent_kill_switch::AgentKillSwitch;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Clone, Default)]
pub struct AgentRunControl {
    runs: Arc<RwLock<HashMap<String, AgentKillSwitch>>>,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum CancelRunResult {
    Cancelled,
    UnknownRun,
}

impl AgentRunControl {
    pub fn new() -> Self {
        Self::default()
    }

    pub async fn register_run(&self, run_id: String, kill_switch: AgentKillSwitch) {
        let mut runs = self.runs.write().await;
        runs.insert(run_id, kill_switch);
    }

    pub async fn unregister_run(&self, run_id: &str) {
        let mut runs = self.runs.write().await;
        runs.remove(run_id);
    }

    pub async fn cancel_run(&self, run_id: &str) -> CancelRunResult {
        let runs = self.runs.read().await;
        if let Some(kill_switch) = runs.get(run_id) {
            kill_switch.trigger();
            CancelRunResult::Cancelled
        } else {
            CancelRunResult::UnknownRun
        }
    }
}
