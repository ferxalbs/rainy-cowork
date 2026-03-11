import { useEffect, useMemo, useState } from "react";
import { Button, Card, Input, Switch } from "@heroui/react";
import { toast } from "sonner";
import {
  connectMcpSavedServer,
  disconnectMcpServer,
  getMcpPermissionMode,
  getMcpRuntimeStatus,
  getPendingMcpApprovals,
  listMcpRuntimeServers,
  listMcpServers,
  refreshMcpServerTools,
  removeMcpServer,
  respondToMcpApproval,
  setMcpPermissionMode,
  upsertMcpServer,
  type McpApprovalRequest,
  type McpPermissionMode,
  type McpRuntimeServerStatus,
  type McpRuntimeStatus,
  type PersistedMcpServerConfig,
} from "../../../services/tauri";

const defaultServer: PersistedMcpServerConfig = {
  name: "",
  transport: { type: "stdio", command: "", args: [] },
  timeoutSecs: 30,
  enabled: true,
};

export function NeuralMcp() {
  const [servers, setServers] = useState<PersistedMcpServerConfig[]>([]);
  const [runtimeServers, setRuntimeServers] = useState<McpRuntimeServerStatus[]>([]);
  const [runtime, setRuntime] = useState<McpRuntimeStatus | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<McpApprovalRequest[]>([]);
  const [permissionMode, setPermissionModeState] = useState<McpPermissionMode>("ask");
  const [form, setForm] = useState<PersistedMcpServerConfig>(defaultServer);
  const [sessionEnv, setSessionEnv] = useState("");
  const [loading, setLoading] = useState(false);

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
      setServers(saved);
      setRuntimeServers(runtimeList);
      setRuntime(status);
      setPermissionModeState(mode);
      setPendingApprovals(approvals);
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

  const parseEnv = (): Record<string, string> => {
    const map: Record<string, string> = {};
    const lines = sessionEnv
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    for (const line of lines) {
      const idx = line.indexOf("=");
      if (idx <= 0) continue;
      map[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    }
    return map;
  };

  const handleSaveServer = async () => {
    if (!form.name.trim()) {
      toast.error("Server name is required");
      return;
    }
    if (form.transport.type === "stdio" && !form.transport.command.trim()) {
      toast.error("Command is required for stdio transport");
      return;
    }

    try {
      await upsertMcpServer({
        ...form,
        name: form.name.trim(),
        transport:
          form.transport.type === "stdio"
            ? {
                type: "stdio",
                command: form.transport.command.trim(),
                args: form.transport.args,
              }
            : form.transport,
      });
      toast.success("MCP server saved");
      setForm(defaultServer);
      await load();
    } catch (error: any) {
      toast.error(error?.message || "Failed to save MCP server");
    }
  };

  const handleConnect = async (server: PersistedMcpServerConfig) => {
    try {
      const env = parseEnv();
      await connectMcpSavedServer(
        server.name,
        Object.keys(env).length > 0 ? env : undefined,
      );
      toast.success(`Connected ${server.name}`);
      await load();
    } catch (error: any) {
      toast.error(error?.message || "Failed to connect MCP server");
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
        <p className="text-sm font-semibold text-foreground">Add MCP Server</p>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Name</p>
          <Input
            value={form.name}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, name: event.target.value }))
            }
            placeholder="filesystem"
          />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Command (stdio)</p>
          <Input
            value={form.transport.type === "stdio" ? form.transport.command : ""}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                transport: { type: "stdio", command: event.target.value, args: [] },
              }))
            }
            placeholder="npx"
          />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Args (space separated)</p>
          <Input
            value={
              form.transport.type === "stdio"
                ? form.transport.args.join(" ")
                : ""
            }
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                transport: {
                  type: "stdio",
                  command:
                    prev.transport.type === "stdio"
                      ? prev.transport.command
                      : "",
                  args: event.target.value
                    .split(" ")
                    .map((item) => item.trim())
                    .filter(Boolean),
                },
              }))
            }
            placeholder="-y @modelcontextprotocol/server-filesystem /Users/fer/Projects"
          />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Timeout (seconds)</p>
          <Input
            type="number"
            value={String(form.timeoutSecs)}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                timeoutSecs: Math.max(1, Number(event.target.value || "30")),
              }))
            }
          />
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            Session ENV (KEY=VALUE per line, optional)
          </p>
          <textarea
            value={sessionEnv}
            onChange={(event) => setSessionEnv(event.target.value)}
            placeholder={"API_KEY=...\nTOKEN=..."}
            className="w-full min-h-[88px] rounded-xl border border-border/50 bg-background/40 px-3 py-2 text-sm text-foreground outline-none focus:border-primary/40"
          />
        </div>
        <div className="flex justify-end">
          <Button onPress={handleSaveServer} className="bg-primary text-primary-foreground">
            Save MCP Server
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
