use crate::ai::agent::runtime::{AgentConfig, AgentRuntime};
use crate::commands::router::IntelligentRouterState;
use crate::services::SkillExecutor;
use std::sync::Arc;
use tauri::{Emitter, Manager, State};

#[tauri::command]
pub async fn run_agent_workflow(
    app_handle: tauri::AppHandle,
    prompt: String,
    model_id: String,
    workspace_id: String,
    router: State<'_, IntelligentRouterState>,
    skills: State<'_, Arc<SkillExecutor>>,
    agent_manager: State<'_, crate::ai::agent::manager::AgentManager>,
) -> Result<String, String> {
    // 0. Ensure Chat Session Exists (Persist Metadata)
    // We use workspace_id as the chat_id for this simple implementation
    let chat_id = workspace_id.clone();
    let _ = agent_manager
        .ensure_chat_session(&chat_id, "Rainy Agent")
        .await
        .map_err(|e| format!("Failed to initialize chat session: {}", e))?;

    // 1. Initialize Runtime (Ephemeral for now, persistent later)
    let config = AgentConfig {
        name: "Rainy Agent".to_string(),
        model: model_id,
        instructions: format!(
            "You are Rainy Agent, an autonomous AI assistant capable of performing complex tasks in the workspace.
            
            Workspace Path: {}
            
            CAPABILITIES:
            - You can read, write, list, and search files in the workspace.
            - **MULTIMODAL: You can SEE images.** If you use `read_file` on an image, you will receive its visual content.
            - You can plan multi-step tasks.
            
            GUIDELINES:
            1. PLAN: Before executing, briefly state your plan.
            2. EXECUTE: Use the provided tools to carry out the plan.
            3. VERIFY: After critical operations, verify the result (e.g., read_file after write_file).
            
            Tools are provided natively. Use them for all file operations.
            Do not hallucinate file contents. trust the tool outputs.
            If a tool fails, analyze the error and try a different approach.",
            workspace_id
        ),
        workspace_id: workspace_id.clone(),
        max_steps: None,
    };

    // Initialize Persistent Memory
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;

    let memory =
        Arc::new(crate::ai::agent::memory::AgentMemory::new(&workspace_id, app_data_dir).await);

    let runtime = AgentRuntime::new(config, router.0.clone(), skills.inner().clone(), memory);

    // 2. Run Workflow with Persistence
    let app_handle_clone = app_handle.clone();
    let manager = agent_manager.inner().clone();
    let chat_id_persist = chat_id.clone();

    // Persist Initial User Prompt
    let _ = manager
        .save_message(&chat_id_persist, "user", &prompt)
        .await
        .map_err(|e| format!("Failed to save user message: {}", e))?;

    let response = runtime
        .run(&prompt, move |event| {
            // Emit to frontend
            let _ = app_handle_clone.emit("agent://event", event.clone());

            // Persist relevant events to DB asynchronously
            let manager = manager.clone();
            let chat_id = chat_id_persist.clone();

            tauri::async_runtime::spawn(async move {
                let (role, content) = match event {
                    crate::ai::agent::runtime::AgentEvent::Thought(thought) => {
                        (Some("assistant"), Some(thought))
                    }
                    crate::ai::agent::runtime::AgentEvent::ToolCall(call) => (
                        Some("assistant"),
                        Some(format!(
                            "Tool Call: {} ({})",
                            call.function.name, call.function.arguments
                        )),
                    ),
                    crate::ai::agent::runtime::AgentEvent::ToolResult { id: _, result } => {
                        (Some("tool"), Some(result))
                    }
                    crate::ai::agent::runtime::AgentEvent::Error(err) => {
                        (Some("system"), Some(format!("Error: {}", err)))
                    }
                    _ => (None, None),
                };

                if let (Some(r), Some(c)) = (role, content) {
                    if let Err(e) = manager.save_message(&chat_id, r, &c).await {
                        eprintln!("Failed to persist agent event: {}", e);
                    }
                }
            });
        })
        .await?;

    // Persist Final Response
    // Note: The callback handles intermediate steps.
    // Ideally, the final response is also just the last Thought/Message.
    // If run returns a string distinct from events, we should save it.
    // Looking at runtime.rs, it returns the last message content if assistant.
    // So it might be redundant if we capture Thoughts, but let's double check.

    Ok(response)
}
