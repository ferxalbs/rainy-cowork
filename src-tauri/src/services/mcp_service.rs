use crate::ai::provider_types::{FunctionDefinition, Tool};
use crate::services::settings::SettingsManager;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::process::Stdio;
use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use tokio::io::{AsyncBufReadExt, AsyncReadExt, AsyncWriteExt, BufReader};
use tokio::process::{Child, ChildStdin, ChildStdout};
use tokio::sync::{oneshot, Mutex, RwLock};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum McpPermissionMode {
    Ask,
    NoAsk,
}

impl Default for McpPermissionMode {
    fn default() -> Self {
        Self::Ask
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PersistedMcpServerConfig {
    pub name: String,
    pub transport: PersistedMcpTransportConfig,
    #[serde(default = "default_timeout_secs")]
    pub timeout_secs: u64,
    #[serde(default = "default_enabled")]
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum PersistedMcpTransportConfig {
    Stdio { command: String, args: Vec<String> },
    Sse { url: String },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct McpServerConfig {
    pub name: String,
    pub transport: McpTransportConfig,
    #[serde(default = "default_timeout_secs")]
    pub timeout_secs: u64,
    pub env: Option<HashMap<String, String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum McpTransportConfig {
    Stdio { command: String, args: Vec<String> },
    Sse { url: String },
}

impl McpServerConfig {
    pub fn sanitize_name(name: &str) -> String {
        let mut out = String::new();
        for ch in name.chars() {
            if ch.is_ascii_alphanumeric() {
                out.push(ch.to_ascii_lowercase());
            }
        }
        if out.is_empty() {
            "server".to_string()
        } else {
            out
        }
    }

}

impl PersistedMcpServerConfig {
    pub fn to_runtime(&self, env: Option<HashMap<String, String>>) -> McpServerConfig {
        McpServerConfig {
            name: self.name.clone(),
            transport: match &self.transport {
                PersistedMcpTransportConfig::Stdio { command, args } => McpTransportConfig::Stdio {
                    command: command.clone(),
                    args: args.clone(),
                },
                PersistedMcpTransportConfig::Sse { url } => McpTransportConfig::Sse {
                    url: url.clone(),
                },
            },
            timeout_secs: self.timeout_secs,
            env,
        }
    }
}

fn default_timeout_secs() -> u64 {
    30
}

fn default_enabled() -> bool {
    true
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonRpcRequest {
    pub jsonrpc: String,
    pub id: u64,
    pub method: String,
    pub params: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonRpcResponse {
    pub jsonrpc: String,
    pub id: u64,
    pub result: Option<serde_json::Value>,
    pub error: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct McpApprovalRequest {
    pub approval_id: String,
    pub server_name: String,
    pub tool_name: String,
    pub arguments_summary: String,
    pub timestamp: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct McpServerRuntimeStatus {
    pub name: String,
    pub connected: bool,
    pub tool_count: usize,
    pub transport: String,
    pub last_error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct McpRuntimeStatus {
    pub permission_mode: McpPermissionMode,
    pub connected_servers: usize,
    pub total_tools: usize,
    pub pending_approvals: usize,
}

struct PendingMcpApproval {
    request: McpApprovalRequest,
    responder: oneshot::Sender<bool>,
}

struct StdioConnection {
    _child: Mutex<Child>,
    stdin: Mutex<ChildStdin>,
    stdout: Mutex<BufReader<ChildStdout>>,
    request_lock: Mutex<()>,
}

impl StdioConnection {
    fn new(mut child: Child) -> Result<Self, String> {
        let stdin = child
            .stdin
            .take()
            .ok_or_else(|| "Failed to acquire MCP child stdin".to_string())?;
        let stdout = child
            .stdout
            .take()
            .ok_or_else(|| "Failed to acquire MCP child stdout".to_string())?;
        Ok(Self {
            _child: Mutex::new(child),
            stdin: Mutex::new(stdin),
            stdout: Mutex::new(BufReader::new(stdout)),
            request_lock: Mutex::new(()),
        })
    }

    async fn send_request(&self, req: &JsonRpcRequest, timeout_secs: u64) -> Result<JsonRpcResponse, String> {
        let _guard = self.request_lock.lock().await;
        write_frame(&self.stdin, req).await?;
        read_response_with_timeout(&self.stdout, req.id, timeout_secs).await
    }

    async fn send_notification(&self, method: &str, params: Option<serde_json::Value>) -> Result<(), String> {
        let _guard = self.request_lock.lock().await;
        let notif = serde_json::json!({
            "jsonrpc": "2.0",
            "method": method,
            "params": params
        });
        write_raw_frame(&self.stdin, &notif).await
    }
}

enum McpTransportHandle {
    Stdio(Arc<StdioConnection>),
    Sse { _client: Client, _url: String },
}

struct McpConnection {
    config: McpServerConfig,
    tools: Vec<Tool>,
    original_names: HashMap<String, String>,
    handle: McpTransportHandle,
    next_id: std::sync::atomic::AtomicU64,
    last_error: Option<String>,
}

impl McpConnection {
    async fn connect(config: McpServerConfig) -> Result<Self, String> {
        let handle = match &config.transport {
            McpTransportConfig::Stdio { command, args } => {
                let mut cmd = tokio::process::Command::new(command);
                cmd.args(args);
                cmd.stdin(Stdio::piped());
                cmd.stdout(Stdio::piped());
                cmd.stderr(Stdio::null());
                if let Some(env) = &config.env {
                    cmd.envs(env);
                }
                let child = cmd
                    .spawn()
                    .map_err(|e| format!("Failed to spawn MCP stdio transport: {}", e))?;
                McpTransportHandle::Stdio(Arc::new(StdioConnection::new(child)?))
            }
            McpTransportConfig::Sse { url } => McpTransportHandle::Sse {
                _client: Client::new(),
                _url: url.clone(),
            },
        };

        let mut conn = Self {
            config,
            tools: Vec::new(),
            original_names: HashMap::new(),
            handle,
            next_id: std::sync::atomic::AtomicU64::new(1),
            last_error: None,
        };

        conn.initialize().await?;
        conn.discover_tools().await?;
        Ok(conn)
    }

    fn next_id(&self) -> u64 {
        self.next_id
            .fetch_add(1, std::sync::atomic::Ordering::SeqCst)
    }

    fn namespaced_tool_name(&self, tool_name: &str) -> String {
        let server_slug = McpServerConfig::sanitize_name(&self.config.name);
        let tool_slug: String = tool_name
            .chars()
            .map(|ch| {
                if ch.is_ascii_alphanumeric() {
                    ch.to_ascii_lowercase()
                } else {
                    '_'
                }
            })
            .collect();
        format!("mcp_{}_{}", server_slug, tool_slug)
    }

    async fn initialize(&mut self) -> Result<(), String> {
        match &self.handle {
            McpTransportHandle::Sse { .. } => Err(
                "SSE MCP transport is not supported in this version. Use stdio transport.".to_string(),
            ),
            McpTransportHandle::Stdio(transport) => {
                let req = JsonRpcRequest {
                    jsonrpc: "2.0".to_string(),
                    id: self.next_id(),
                    method: "initialize".to_string(),
                    params: Some(serde_json::json!({
                        "protocolVersion": "2024-11-05",
                        "capabilities": {},
                        "clientInfo": {
                            "name": "Rainy MaTE",
                            "version": env!("CARGO_PKG_VERSION")
                        }
                    })),
                };
                let response = transport
                    .send_request(&req, self.config.timeout_secs)
                    .await?;
                if let Some(error) = response.error {
                    return Err(format!("MCP initialize failed: {}", error));
                }
                let _ = transport
                    .send_notification("notifications/initialized", Some(serde_json::json!({})))
                    .await;
                Ok(())
            }
        }
    }

    async fn discover_tools(&mut self) -> Result<(), String> {
        let req = JsonRpcRequest {
            jsonrpc: "2.0".to_string(),
            id: self.next_id(),
            method: "tools/list".to_string(),
            params: Some(serde_json::json!({})),
        };

        let response = self.send_jsonrpc(&req).await?;
        if let Some(error) = response.error {
            return Err(format!("MCP tools/list failed: {}", error));
        }
        let result = response
            .result
            .ok_or_else(|| "MCP tools/list returned empty result".to_string())?;
        let tools_value = result
            .get("tools")
            .cloned()
            .ok_or_else(|| "MCP tools/list missing 'tools' key".to_string())?;
        let tools_arr = tools_value
            .as_array()
            .ok_or_else(|| "MCP tools/list 'tools' must be an array".to_string())?;

        let mut discovered = Vec::new();
        let mut mapping = HashMap::new();
        for entry in tools_arr {
            let raw_name = match entry.get("name").and_then(|v| v.as_str()) {
                Some(name) if !name.is_empty() => name,
                _ => continue,
            };
            let namespaced_name = self.namespaced_tool_name(raw_name);
            let description = entry
                .get("description")
                .and_then(|v| v.as_str())
                .unwrap_or("MCP tool")
                .to_string();
            let input_schema = entry
                .get("inputSchema")
                .cloned()
                .unwrap_or_else(|| serde_json::json!({ "type": "object", "properties": {} }));

            mapping.insert(namespaced_name.clone(), raw_name.to_string());
            discovered.push(Tool {
                r#type: "function".to_string(),
                function: FunctionDefinition {
                    name: namespaced_name,
                    description,
                    parameters: input_schema,
                },
            });
        }

        self.tools = discovered;
        self.original_names = mapping;
        Ok(())
    }

    async fn refresh_tools(&mut self) -> Result<(), String> {
        self.discover_tools().await
    }

    async fn call_tool(&self, namespaced_name: &str, input: serde_json::Value) -> Result<String, String> {
        let original_name = self
            .original_names
            .get(namespaced_name)
            .ok_or_else(|| format!("Unknown MCP tool: {}", namespaced_name))?;
        let req = JsonRpcRequest {
            jsonrpc: "2.0".to_string(),
            id: self.next_id(),
            method: "tools/call".to_string(),
            params: Some(serde_json::json!({
                "name": original_name,
                "arguments": input
            })),
        };
        let response = self.send_jsonrpc(&req).await?;
        if let Some(error) = response.error {
            return Err(format!("MCP tools/call failed: {}", error));
        }
        let result = response.result.unwrap_or_else(|| serde_json::json!({}));
        Ok(extract_mcp_call_output(&result))
    }

    async fn send_jsonrpc(&self, req: &JsonRpcRequest) -> Result<JsonRpcResponse, String> {
        match &self.handle {
            McpTransportHandle::Sse { .. } => Err(
                "SSE MCP transport is not supported in this version. Use stdio transport.".to_string(),
            ),
            McpTransportHandle::Stdio(transport) => {
                transport.send_request(req, self.config.timeout_secs).await
            }
        }
    }
}

fn extract_mcp_call_output(result: &serde_json::Value) -> String {
    if let Some(content) = result.get("content").and_then(|v| v.as_array()) {
        let mut parts = Vec::new();
        for item in content {
            if let Some(text) = item.get("text").and_then(|v| v.as_str()) {
                parts.push(text.to_string());
            } else {
                parts.push(item.to_string());
            }
        }
        if !parts.is_empty() {
            return parts.join("\n");
        }
    }
    if let Some(text) = result.get("text").and_then(|v| v.as_str()) {
        return text.to_string();
    }
    serde_json::to_string_pretty(result).unwrap_or_else(|_| result.to_string())
}

async fn write_raw_frame(
    stdin: &Mutex<ChildStdin>,
    payload: &serde_json::Value,
) -> Result<(), String> {
    let bytes = serde_json::to_vec(payload).map_err(|e| format!("Failed to serialize JSON: {}", e))?;
    let frame = format!("Content-Length: {}\r\n\r\n", bytes.len());
    let mut lock = stdin.lock().await;
    lock.write_all(frame.as_bytes())
        .await
        .map_err(|e| format!("Failed to write frame header: {}", e))?;
    lock.write_all(&bytes)
        .await
        .map_err(|e| format!("Failed to write frame body: {}", e))?;
    lock.flush()
        .await
        .map_err(|e| format!("Failed to flush frame: {}", e))?;
    Ok(())
}

async fn write_frame(stdin: &Mutex<ChildStdin>, req: &JsonRpcRequest) -> Result<(), String> {
    let val = serde_json::to_value(req).map_err(|e| format!("Failed to encode request: {}", e))?;
    write_raw_frame(stdin, &val).await
}

async fn read_response_with_timeout(
    stdout: &Mutex<BufReader<ChildStdout>>,
    expected_id: u64,
    timeout_secs: u64,
) -> Result<JsonRpcResponse, String> {
    tokio::time::timeout(
        std::time::Duration::from_secs(timeout_secs.max(1)),
        async {
            loop {
                let value = read_frame(stdout).await?;
                if value.get("id").and_then(|v| v.as_u64()) == Some(expected_id) {
                    return serde_json::from_value::<JsonRpcResponse>(value)
                        .map_err(|e| format!("Invalid JSON-RPC response: {}", e));
                }
            }
        },
    )
    .await
    .map_err(|_| "MCP request timed out".to_string())?
}

async fn read_frame(stdout: &Mutex<BufReader<ChildStdout>>) -> Result<serde_json::Value, String> {
    let mut reader = stdout.lock().await;
    let mut content_length: usize = 0;

    loop {
        let mut line = String::new();
        let read = reader
            .read_line(&mut line)
            .await
            .map_err(|e| format!("Failed to read MCP header line: {}", e))?;
        if read == 0 {
            return Err("MCP stream closed".to_string());
        }
        let trimmed = line.trim_end_matches(['\r', '\n']);
        if trimmed.is_empty() {
            break;
        }
        if let Some(value) = trimmed.strip_prefix("Content-Length:") {
            content_length = value
                .trim()
                .parse::<usize>()
                .map_err(|e| format!("Invalid Content-Length header: {}", e))?;
        }
    }

    if content_length == 0 {
        return Err("MCP frame missing Content-Length".to_string());
    }

    let mut payload = vec![0u8; content_length];
    reader
        .read_exact(&mut payload)
        .await
        .map_err(|e| format!("Failed to read MCP frame body: {}", e))?;

    serde_json::from_slice::<serde_json::Value>(&payload)
        .map_err(|e| format!("Failed to parse MCP frame JSON: {}", e))
}

pub struct McpService {
    app: Arc<RwLock<Option<AppHandle>>>,
    connections: Arc<Mutex<HashMap<String, McpConnection>>>,
    pending_approvals: Arc<Mutex<HashMap<String, PendingMcpApproval>>>,
    permission_mode: Arc<RwLock<McpPermissionMode>>,
}

impl McpService {
    pub fn new() -> Self {
        let settings = SettingsManager::new();
        let mode = settings.get_mcp_permission_mode();
        Self {
            app: Arc::new(RwLock::new(None)),
            connections: Arc::new(Mutex::new(HashMap::new())),
            pending_approvals: Arc::new(Mutex::new(HashMap::new())),
            permission_mode: Arc::new(RwLock::new(mode)),
        }
    }

    pub async fn set_app_handle(&self, app: AppHandle) {
        let mut lock = self.app.write().await;
        *lock = Some(app);
    }

    pub async fn get_tools(&self) -> Vec<Tool> {
        let lock = self.connections.lock().await;
        lock.values().flat_map(|conn| conn.tools.clone()).collect()
    }

    pub fn is_mcp_tool(name: &str) -> bool {
        name.starts_with("mcp_")
    }

    pub fn extract_mcp_server(name: &str) -> Option<String> {
        if !Self::is_mcp_tool(name) {
            return None;
        }
        let rest = name.strip_prefix("mcp_")?;
        let server = rest.split('_').next()?;
        if server.is_empty() {
            None
        } else {
            Some(server.to_string())
        }
    }

    pub async fn list_servers(&self) -> Vec<PersistedMcpServerConfig> {
        let mut settings = SettingsManager::new();
        settings.get_mcp_servers()
    }

    pub async fn upsert_server(&self, config: PersistedMcpServerConfig) -> Result<(), String> {
        let mut settings = SettingsManager::new();
        settings.upsert_mcp_server(config)
    }

    pub async fn remove_server(&self, name: &str) -> Result<(), String> {
        let mut settings = SettingsManager::new();
        settings.remove_mcp_server(name)?;
        self.connections.lock().await.remove(name);
        Ok(())
    }

    pub async fn connect_server(&self, config: McpServerConfig) -> Result<(), String> {
        let conn = McpConnection::connect(config.clone()).await?;
        let key = McpServerConfig::sanitize_name(&config.name);
        self.connections.lock().await.insert(key, conn);
        Ok(())
    }

    pub async fn connect_saved_server(
        &self,
        name: &str,
        env: Option<HashMap<String, String>>,
    ) -> Result<(), String> {
        let saved = self.list_servers().await;
        let found = saved
            .into_iter()
            .find(|s| McpServerConfig::sanitize_name(&s.name) == McpServerConfig::sanitize_name(name))
            .ok_or_else(|| format!("MCP server '{}' not found", name))?;
        self.connect_server(found.to_runtime(env)).await
    }

    pub async fn disconnect_server(&self, name: &str) -> Result<(), String> {
        let removed = self
            .connections
            .lock()
            .await
            .remove(&McpServerConfig::sanitize_name(name));
        if removed.is_some() {
            Ok(())
        } else {
            Err(format!("MCP server '{}' is not connected", name))
        }
    }

    pub async fn refresh_server_tools(&self, name: &str) -> Result<(), String> {
        let key = McpServerConfig::sanitize_name(name);
        let mut lock = self.connections.lock().await;
        let conn = lock
            .get_mut(&key)
            .ok_or_else(|| format!("MCP server '{}' is not connected", name))?;
        conn.refresh_tools().await
    }

    pub async fn call_mcp_tool(
        &self,
        server_name: &str,
        tool_name: &str,
        input: serde_json::Value,
    ) -> Result<String, String> {
        self.ensure_mcp_approval(server_name, tool_name, &input).await?;
        let key = McpServerConfig::sanitize_name(server_name);
        let lock = self.connections.lock().await;
        let conn = lock
            .get(&key)
            .ok_or_else(|| format!("MCP server '{}' not connected", server_name))?;
        conn.call_tool(tool_name, input).await
    }

    pub async fn list_runtime_statuses(&self) -> Vec<McpServerRuntimeStatus> {
        let saved = self.list_servers().await;
        let lock = self.connections.lock().await;
        saved.into_iter()
            .map(|cfg| {
                let key = McpServerConfig::sanitize_name(&cfg.name);
                if let Some(conn) = lock.get(&key) {
                    McpServerRuntimeStatus {
                        name: cfg.name.clone(),
                        connected: true,
                        tool_count: conn.tools.len(),
                        transport: transport_label(&cfg.transport),
                        last_error: conn.last_error.clone(),
                    }
                } else {
                    McpServerRuntimeStatus {
                        name: cfg.name.clone(),
                        connected: false,
                        tool_count: 0,
                        transport: transport_label(&cfg.transport),
                        last_error: None,
                    }
                }
            })
            .collect()
    }

    pub async fn get_runtime_status(&self) -> McpRuntimeStatus {
        let mode = self.get_permission_mode().await;
        let connections = self.connections.lock().await;
        let pending = self.pending_approvals.lock().await;
        let total_tools = connections.values().map(|conn| conn.tools.len()).sum();
        McpRuntimeStatus {
            permission_mode: mode,
            connected_servers: connections.len(),
            total_tools,
            pending_approvals: pending.len(),
        }
    }

    pub async fn get_permission_mode(&self) -> McpPermissionMode {
        self.permission_mode.read().await.clone()
    }

    pub async fn set_permission_mode(&self, mode: McpPermissionMode) -> Result<(), String> {
        {
            let mut lock = self.permission_mode.write().await;
            *lock = mode.clone();
        }
        let mut settings = SettingsManager::new();
        settings.set_mcp_permission_mode(mode)
    }

    pub async fn get_pending_approvals(&self) -> Vec<McpApprovalRequest> {
        let lock = self.pending_approvals.lock().await;
        let mut list: Vec<McpApprovalRequest> =
            lock.values().map(|p| p.request.clone()).collect();
        list.sort_by_key(|r| r.timestamp);
        list
    }

    pub async fn respond_to_approval(&self, approval_id: &str, approved: bool) -> Result<(), String> {
        let pending = self.pending_approvals.lock().await.remove(approval_id);
        if let Some(entry) = pending {
            entry
                .responder
                .send(approved)
                .map_err(|_| "MCP approval channel closed".to_string())?;
            if let Some(app) = self.app.read().await.as_ref() {
                let _ = app.emit("mcp:approval_resolved", approval_id);
            }
            Ok(())
        } else {
            Err(format!("No pending MCP approval for '{}'", approval_id))
        }
    }

    async fn ensure_mcp_approval(
        &self,
        server_name: &str,
        tool_name: &str,
        input: &serde_json::Value,
    ) -> Result<(), String> {
        let mode = self.get_permission_mode().await;
        if matches!(mode, McpPermissionMode::NoAsk) {
            return Ok(());
        }

        let app = self
            .app
            .read()
            .await
            .clone()
            .ok_or_else(|| "MCP approval requires UI app handle".to_string())?;

        let summary = serde_json::to_string(input).unwrap_or_else(|_| "{}".to_string());
        let approval_id = Uuid::new_v4().to_string();
        let request = McpApprovalRequest {
            approval_id: approval_id.clone(),
            server_name: server_name.to_string(),
            tool_name: tool_name.to_string(),
            arguments_summary: summary,
            timestamp: chrono::Utc::now().timestamp_millis(),
        };
        let (tx, rx) = oneshot::channel::<bool>();
        self.pending_approvals.lock().await.insert(
            approval_id.clone(),
            PendingMcpApproval {
                request: request.clone(),
                responder: tx,
            },
        );

        app.emit("mcp:approval_required", &request)
            .map_err(|e| format!("Failed to emit MCP approval event: {}", e))?;

        let decision = tokio::time::timeout(std::time::Duration::from_secs(30), rx).await;
        self.pending_approvals.lock().await.remove(&approval_id);
        let _ = app.emit("mcp:approval_resolved", &approval_id);
        match decision {
            Ok(Ok(true)) => Ok(()),
            Ok(Ok(false)) => Err("MCP tool call rejected by user".to_string()),
            Ok(Err(_)) | Err(_) => Err("MCP tool call timed out awaiting approval".to_string()),
        }
    }
}

fn transport_label(transport: &PersistedMcpTransportConfig) -> String {
    match transport {
        PersistedMcpTransportConfig::Stdio { .. } => "stdio".to_string(),
        PersistedMcpTransportConfig::Sse { .. } => "sse".to_string(),
    }
}
