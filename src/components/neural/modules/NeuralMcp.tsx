import { useEffect, useMemo, useState } from "react";
import { Button, Card, Switch } from "@heroui/react";
import { toast } from "sonner";
import {
  connectMcpSavedServer,
  disconnectMcpServer,
  getOrCreateDefaultMcpJsonConfig,
  getMcpPermissionMode,
  getMcpRuntimeStatus,
  getPendingMcpApprovals,
  importMcpServersFromDefaultJson,
  listMcpRuntimeServers,
  listMcpServers,
  refreshMcpServerTools,
  removeMcpServer,
  respondToMcpApproval,
  saveDefaultMcpJsonConfig,
  setMcpPermissionMode,
  type McpApprovalRequest,
  type McpPermissionMode,
  type McpRuntimeServerStatus,
  type McpRuntimeStatus,
  type McpJsonConfigFile,
  type PersistedMcpServerConfig,
} from "../../../services/tauri";

export function NeuralMcp() {
  const [servers, setServers] = useState<PersistedMcpServerConfig[]>([]);
  const [runtimeServers, setRuntimeServers] = useState<McpRuntimeServerStatus[]>([]);
  const [runtime, setRuntime] = useState<McpRuntimeStatus | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<McpApprovalRequest[]>([]);
  const [permissionMode, setPermissionModeState] = useState<McpPermissionMode>("ask");
  const [loading, setLoading] = useState(false);
  const [jsonFile, setJsonFile] = useState<McpJsonConfigFile | null>(null);
  const [jsonDraft, setJsonDraft] = useState("");
  const [jsonAutoConnect, setJsonAutoConnect] = useState(true);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const connectedMap = useMemo(
    () => new Map(runtimeServers.map((server) => [server.name, server.connected])),
    [runtimeServers],
  );

  const load = async () => {
    setLoading(true);
    try {
      const [saved, runtimeList, status, mode, approvals] = await Promise.all([
        listMcpServers(),
        listMcpRuntimeServers(),
        getMcpRuntimeStatus(),
        getMcpPermissionMode(),
        getPendingMcpApprovals(),
      ]);
      const config = await getOrCreateDefaultMcpJsonConfig();
      setServers(saved);
      setRuntimeServers(runtimeList);
      setRuntime(status);
      setPermissionModeState(mode);
      setPendingApprovals(approvals);
      setJsonFile(config);
      setJsonDraft(config.content);
      setJsonError(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load MCP state");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleConnect = async (server: PersistedMcpServerConfig) => {
    try {
      await connectMcpSavedServer(server.name);
      toast.success(`Connected ${server.name}`);
      await load();
    } catch (error: any) {
      toast.error(error?.message || "Failed to connect MCP server");
    }
  };

  const handleValidateJson = () => {
    try {
      const parsed = JSON.parse(jsonDraft);
      const pretty = JSON.stringify(parsed, null, 2);
      setJsonDraft(pretty);
      setJsonError(null);
      toast.success("JSON validated");
    } catch (error: any) {
      const msg = error?.message || "Invalid JSON";
      setJsonError(msg);
      toast.error(msg);
    }
  };

  const handleSaveJson = async () => {
    try {
      const saved = await saveDefaultMcpJsonConfig(jsonDraft);
      setJsonFile(saved);
      setJsonDraft(saved.content);
      setJsonError(null);
      toast.success("MCP JSON saved");
    } catch (error: any) {
      const msg = error?.message || "Failed to save MCP JSON";
      setJsonError(msg);
      toast.error(msg);
    }
  };

  const handleSaveAndRunJson = async () => {
    try {
      const saved = await saveDefaultMcpJsonConfig(jsonDraft);
      setJsonFile(saved);
      setJsonDraft(saved.content);
      setJsonError(null);
      const result = await importMcpServersFromDefaultJson(jsonAutoConnect);
      const failed = result.failed.length;
      if (failed > 0) {
        toast.warning(
          `Imported ${result.imported}, connected ${result.connected}, failed ${failed}`,
        );
        console.warn("MCP JSON import failures:", result.failed);
      } else {
        toast.success(
          `Imported ${result.imported} server(s), connected ${result.connected}`,
        );
      }
      await load();
    } catch (error: any) {
      const msg = error?.message || "Failed to save/run MCP JSON";
      setJsonError(msg);
      toast.error(msg);
    }
  };

  const handleRunJson = async () => {
    if (!jsonFile?.path) {
      toast.error("Default MCP JSON path is not ready");
      return;
    }
    try {
      const result = await importMcpServersFromDefaultJson(jsonAutoConnect);
      const failed = result.failed.length;
      if (failed > 0) {
        toast.warning(
          `Imported ${result.imported}, connected ${result.connected}, failed ${failed}`,
        );
        console.warn("MCP JSON import failures:", result.failed);
      } else {
        toast.success(
          `Imported ${result.imported} server(s), connected ${result.connected}`,
        );
      }
      await load();
    } catch (error: any) {
      toast.error(error?.message || "Failed to run MCP JSON");
    }
  };

  const handleDisconnect = async (name: string) => {
    try {
      await disconnectMcpServer(name);
      toast.success(`Disconnected ${name}`);
      await load();
    } catch (error: any) {
      toast.error(error?.message || "Failed to disconnect MCP server");
    }
  };

  const handleRemove = async (name: string) => {
    try {
      await removeMcpServer(name);
      toast.success(`Removed ${name}`);
      await load();
    } catch (error: any) {
      toast.error(error?.message || "Failed to remove MCP server");
    }
  };

  const handlePermissionMode = async (mode: McpPermissionMode) => {
    setPermissionModeState(mode);
    try {
      await setMcpPermissionMode(mode);
      await load();
    } catch (error: any) {
      toast.error(error?.message || "Failed to update MCP permission mode");
    }
  };

  const handleApproval = async (approvalId: string, approved: boolean) => {
    try {
      await respondToMcpApproval(approvalId, approved);
      await load();
    } catch (error: any) {
      toast.error(error?.message || "Failed to respond to MCP approval");
    }
  };

  return (
    <div className="space-y-6 animate-appear">
      <div className="flex items-center justify-between border-b border-border/10 pb-6">
        <div>
          <h3 className="text-2xl font-bold text-foreground tracking-tight">
            MCP Control Center
          </h3>
          <p className="text-muted-foreground text-sm">
            Manage stdio MCP servers and global approval policy.
          </p>
        </div>
        <Button onPress={load} isDisabled={loading} className="bg-primary/10 text-primary">
          Refresh
        </Button>
      </div>

      <Card className="p-4 border border-border/20 bg-card/30">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground">
              MCP Global Permission
            </p>
            <p className="text-xs text-muted-foreground">
              Ask prompts every MCP call; No-Ask runs MCP calls directly.
            </p>
          </div>
          <Switch
            isSelected={permissionMode === "no_ask"}
            onChange={(enabled) =>
              handlePermissionMode(enabled ? "no_ask" : "ask")
            }
          >
            {permissionMode === "ask" ? "Ask" : "No Ask"}
          </Switch>
        </div>
        {runtime && (
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
            <div>Connected: {runtime.connectedServers}</div>
            <div>Tools: {runtime.totalTools}</div>
            <div>Pending approvals: {runtime.pendingApprovals}</div>
            <div>Mode: {runtime.permissionMode}</div>
          </div>
        )}
      </Card>

      <Card className="p-4 border border-border/20 bg-card/30 space-y-3">
        <p className="text-sm font-semibold text-foreground">
          Default MCP JSON
        </p>
        <div className="rounded-xl border border-border/40 bg-background/30 px-3 py-2">
          <p className="text-[11px] text-muted-foreground mb-1">Config file path</p>
          <p className="text-xs font-mono text-foreground/90 break-all">
            {jsonFile?.path || "Loading..."}
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Edit JSON here. This file is created automatically for users and is the
          primary way to manage MCP servers.
        </p>
        <textarea
          value={jsonDraft}
          onChange={(event) => {
            setJsonDraft(event.target.value);
            setJsonError(null);
          }}
          className="w-full min-h-[260px] rounded-xl border border-border/50 bg-background/40 px-3 py-2 text-xs font-mono text-foreground outline-none focus:border-primary/40"
        />
        {jsonError && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
            {jsonError}
          </div>
        )}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Auto connect imported servers</p>
          <Switch
            isSelected={jsonAutoConnect}
            onChange={(enabled) => setJsonAutoConnect(enabled)}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onPress={handleValidateJson}>
            Validate / Format
          </Button>
          <Button variant="secondary" onPress={handleSaveJson}>
            Save JSON
          </Button>
          <Button onPress={handleRunJson}>Run JSON</Button>
          <Button className="bg-primary text-primary-foreground" onPress={handleSaveAndRunJson}>
            Save + Run
          </Button>
        </div>
      </Card>

      <div className="grid gap-3 md:grid-cols-2">
        {servers.map((server) => (
          <Card key={server.name} className="p-4 border border-border/20 bg-card/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">{server.name}</p>
                <p className="text-xs text-muted-foreground">
                  {server.transport.type} · timeout {server.timeoutSecs}s
                </p>
              </div>
              <span className="text-xs font-mono text-muted-foreground">
                {connectedMap.get(server.name) ? "connected" : "disconnected"}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {connectedMap.get(server.name) ? (
                <Button size="sm" onPress={() => handleDisconnect(server.name)}>
                  Disconnect
                </Button>
              ) : (
                <Button size="sm" onPress={() => handleConnect(server)}>
                  Connect
                </Button>
              )}
              <Button
                size="sm"
                variant="secondary"
                onPress={() => refreshMcpServerTools(server.name).then(load)}
              >
                Refresh Tools
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-red-500"
                onPress={() => handleRemove(server.name)}
              >
                Remove
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {pendingApprovals.length > 0 && (
        <Card className="p-4 border border-amber-500/20 bg-amber-500/5">
          <p className="text-sm font-semibold text-foreground mb-3">Pending MCP Approvals</p>
          <div className="space-y-2">
            {pendingApprovals.map((approval) => (
              <div
                key={approval.approvalId}
                className="rounded-xl border border-border/30 bg-background/40 p-3"
              >
                <p className="text-xs text-muted-foreground">
                  {approval.serverName} · {approval.toolName}
                </p>
                <pre className="text-xs mt-2 text-foreground/85 whitespace-pre-wrap">
                  {approval.argumentsSummary}
                </pre>
                <div className="mt-2 flex items-center justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onPress={() => handleApproval(approval.approvalId, false)}
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    onPress={() => handleApproval(approval.approvalId, true)}
                    className="bg-amber-500 text-black"
                  >
                    Approve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
