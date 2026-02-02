import { Button, Card, Chip, Separator, Switch } from "@heroui/react";
import {
  Network,
  RefreshCw,
  Copy,
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { useNeuralService } from "../../hooks/useNeuralService";
import { useEffect, useState } from "react";
import { toast } from "@heroui/react";
import { setNeuralWorkspaceId } from "../../services/tauri";

export function NeuralPanel() {
  const {
    status,
    nodeId,
    pendingApprovals,
    lastHeartbeat,
    connect,
    respond,
    isHeadless,
    toggleHeadless,
  } = useNeuralService();

  const [inputWorkspaceId, setInputWorkspaceId] = useState("");
  const [isPairing, setIsPairing] = useState(false);

  // Auto-connect on mount if we have a node ID, otherwise wait for pairing
  useEffect(() => {
    if (status !== "pending-pairing" && !nodeId) {
      connect();
    }
  }, [status, nodeId, connect]);

  const copyNodeId = () => {
    if (nodeId) {
      navigator.clipboard.writeText(nodeId);
      toast.success("Node ID copied to clipboard");
    }
  };

  const handlePairing = async () => {
    if (!inputWorkspaceId.trim()) {
      toast.danger("Please enter a Workspace ID");
      return;
    }
    setIsPairing(true);
    try {
      await setNeuralWorkspaceId(inputWorkspaceId);
      await connect();
      toast.success("Pairing initiated");
    } catch (error) {
      console.error("Pairing failed:", error);
      toast.danger("Pairing failed");
    } finally {
      setIsPairing(false);
    }
  };

  const getStatusColor = (currentStatus: string) => {
    switch (currentStatus) {
      case "connected":
        return "text-green-500";
      case "pending-pairing":
        return "text-yellow-500";
      case "offline":
        return "text-gray-500";
      case "error":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Network className="size-8 text-purple-500" />
        <div>
          <h1 className="text-2xl font-bold">Neural Link</h1>
          <p className="text-muted-foreground text-sm">
            Connect your desktop to the Cloud Cortex
          </p>
        </div>
      </div>

      {/* Connection Status Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-full ${getStatusColor(status).replace("text-", "bg-")}/10`}
            >
              <Network className={`size-6 ${getStatusColor(status)}`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Neural Link</h3>
              <div className="flex items-center gap-2">
                <span
                  className={`size-2 rounded-full ${getStatusColor(status).replace("text-", "bg-")} animate-pulse`}
                />
                <span className="text-sm text-muted-foreground capitalize">
                  {status.replace("-", " ")}
                </span>
              </div>
            </div>
          </div>
          {status === "pending-pairing" ? (
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter Workspace ID"
                className="px-3 py-1 rounded border bg-background text-sm"
                value={inputWorkspaceId}
                onChange={(e) => setInputWorkspaceId(e.target.value)}
              />
              <Button
                size="sm"
                variant="primary"
                onPress={handlePairing}
                isDisabled={isPairing}
                className="min-w-[80px]"
              >
                {isPairing ? (
                  <RefreshCw className="size-4 animate-spin" />
                ) : (
                  "Pair"
                )}
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onPress={connect}
              className="gap-2"
            >
              <RefreshCw className="size-4" />
              {status === "error" ? "Retry" : "Reconnect"}
            </Button>
          )}
        </div>

        {/* Node ID */}
        {nodeId && (
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                  Node ID
                </span>
                <p className="font-mono text-sm mt-1 truncate max-w-[280px]">
                  {nodeId}
                </p>
              </div>
              <Button variant="ghost" size="sm" onPress={copyNodeId}>
                <Copy className="size-4" />
              </Button>
            </div>
          </div>
        )}

        {status === "connected" && lastHeartbeat && (
          <div className="text-right text-sm text-muted-foreground mt-4">
            <div className="flex items-center gap-1 justify-end">
              <Clock className="size-3" />
              <span>Last sync: {lastHeartbeat.toLocaleTimeString()}</span>
            </div>
          </div>
        )}
      </Card>

      {/* Settings Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
              <Shield className="size-5" />
            </div>
            <div>
              <h3 className="font-semibold">Headless Mode</h3>
              <p className="text-sm text-muted-foreground">
                Auto-approve sensitive commands
              </p>
            </div>
          </div>
          <Switch isSelected={isHeadless} onChange={toggleHeadless}>
            <Switch.Control className="bg-default-200 data-[selected=true]:bg-purple-500">
              <Switch.Thumb />
            </Switch.Control>
          </Switch>
        </div>
      </Card>

      <Separator />

      {/* Pending Approvals */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="size-5 text-orange-500" />
          <h2 className="text-lg font-semibold">Security Approvals</h2>
          {pendingApprovals.length > 0 && (
            <Chip color="warning" size="sm">
              {pendingApprovals.length}
            </Chip>
          )}
        </div>

        {pendingApprovals.length === 0 ? (
          <Card className="p-6 text-center text-muted-foreground">
            <CheckCircle2 className="size-8 mx-auto mb-2 text-green-500" />
            <p>No pending approvals</p>
            <p className="text-sm mt-1">
              Commands from the Cloud Cortex will appear here for review.
            </p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {pendingApprovals.map((request) => (
              <Card key={request.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Chip
                        color={
                          request.level === "Dangerous"
                            ? "danger"
                            : request.level === "Sensitive"
                              ? "warning"
                              : "success"
                        }
                        size="sm"
                      >
                        {request.level}
                      </Chip>
                      <span className="font-medium">
                        {request.command_type}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 font-mono">
                      {JSON.stringify(request.payload, null, 2).slice(0, 100)}
                      {JSON.stringify(request.payload).length > 100 && "..."}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(request.timestamp).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onPress={() => respond(request.id, true)}
                    >
                      <CheckCircle2 className="size-4" />
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onPress={() => respond(request.id, false)}
                    >
                      <XCircle className="size-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
