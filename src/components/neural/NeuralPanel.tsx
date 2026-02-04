import {
  Button,
  Card,
  Chip,
  Separator,
  Switch,
  Modal,
  TextField,
  Input,
  Label,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  Description,
} from "@heroui/react";
import {
  Network,
  RefreshCw,
  Shield,
  CheckCircle2,
  XCircle,
  Smartphone,
  Bot,
  Key,
  Database,
  Plus,
  Unplug,
  Fingerprint,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "@heroui/react";
import {
  bootstrapAtm,
  generatePairingCode,
  setNeuralCredentials,
  setNeuralWorkspaceId,
  loadNeuralCredentials,
  registerNode,
  respondToAirlock,
  getPendingAirlockApprovals,
  setHeadlessMode,
  ApprovalRequest,
  WorkspaceAuth,
  SkillManifest,
  getNeuralCredentialsValues,
  AirlockLevels,
} from "../../services/tauri";
import { AgentList } from "./AgentList";
import { CreateAgentForm } from "./CreateAgentForm";

const DEFAULT_SKILLS: SkillManifest[] = [
  {
    name: "file_ops",
    version: "1.0.0",
    methods: [
      {
        name: "read_file",
        description: "Read file content",
        airlockLevel: AirlockLevels.Safe,
        parameters: {
          path: {
            type: "string",
            description: "Absolute path to file",
            required: true,
          },
        },
      },
      {
        name: "write_file",
        description: "Write content to file",
        airlockLevel: AirlockLevels.Sensitive,
        parameters: {
          path: {
            type: "string",
            description: "Absolute path to file",
            required: true,
          },
          content: {
            type: "string",
            description: "Content to write",
            required: true,
          },
        },
      },
    ],
  },
  {
    name: "terminal",
    version: "1.0.0",
    methods: [
      {
        name: "exec",
        description: "Execute terminal command",
        airlockLevel: AirlockLevels.Dangerous,
        parameters: {
          command: {
            type: "string",
            description: "Command to execute",
            required: true,
          },
          cwd: {
            type: "string",
            description: "Working directory",
            required: false,
          },
        },
      },
    ],
  },
];

type NeuralState = "idle" | "restored" | "connected" | "connecting";

export function NeuralPanel() {
  const [state, setState] = useState<NeuralState>("idle");
  const [workspace, setWorkspace] = useState<WorkspaceAuth | null>(null);

  const [platformKey, setPlatformKey] = useState("");
  const [userApiKey, setUserApiKey] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");

  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [isCreatingAgent, setIsCreatingAgent] = useState(false);
  const [isHeadless, setIsHeadless] = useState(false);
  const [pendingApprovals, setPendingApprovals] = useState<ApprovalRequest[]>(
    [],
  );

  useEffect(() => {
    const init = async () => {
      try {
        const hasCredentials = await loadNeuralCredentials();
        if (hasCredentials) {
          const creds = await getNeuralCredentialsValues();
          if (creds) {
            setPlatformKey(creds[0]);
            setUserApiKey(creds[1]);
            setState("restored");
          }
        }
      } catch (err) {
        console.error("Failed to load credentials:", err);
      }

      try {
        const approvals = await getPendingAirlockApprovals();
        setPendingApprovals(approvals);
      } catch (err) {
        console.error("Failed to load approvals:", err);
      }
    };
    init();
  }, []);

  const handleConnect = async () => {
    if (!platformKey.trim() || !userApiKey.trim()) {
      toast.danger("Credentials are required");
      return;
    }

    setState("connecting");

    try {
      const ws = await bootstrapAtm(
        platformKey,
        userApiKey,
        workspaceName.trim() || "Desktop Workspace",
      );
      await setNeuralCredentials(platformKey, userApiKey);
      await setNeuralWorkspaceId(ws.id);
      await registerNode(DEFAULT_SKILLS, []);

      setWorkspace(ws);
      setState("connected");
      toast.success(`Neural Link Established! Welcome to ${ws.name}`);
    } catch (err: any) {
      console.error("Connection failed:", err);
      setState("idle");
      toast.danger("Connection failed. Please check your credentials.");
    }
  };

  const handleGeneratePairingCode = async () => {
    try {
      const res = await generatePairingCode();
      setPairingCode(res.code);
    } catch (err) {
      toast.danger("Failed to generate pairing code");
    }
  };

  const handleToggleHeadless = async (enabled: boolean) => {
    try {
      await setHeadlessMode(enabled);
      setIsHeadless(enabled);
      toast.success(`Headless Mode ${enabled ? "Enabled" : "Disabled"}`);
    } catch (err) {
      toast.danger("Failed to update settings");
    }
  };

  const handleAirlockRespond = async (requestId: string, approved: boolean) => {
    try {
      await respondToAirlock(requestId, approved);
      setPendingApprovals((prev) => prev.filter((req) => req.id !== requestId));
      toast.success(approved ? "Request Approved" : "Request Denied");
    } catch (err) {
      toast.danger("Failed to process response");
    }
  };

  const handleLogout = async () => {
    if (
      confirm(
        "⚠️ This will disconnect you from the Cloud Cortex. Are you sure?",
      )
    ) {
      try {
        const { resetNeuralWorkspace } = await import("../../services/tauri");
        await resetNeuralWorkspace(platformKey, userApiKey);
        setPlatformKey("");
        setUserApiKey("");
        setWorkspace(null);
        setState("idle");
        setPairingCode(null);
        toast.success("Succesfully disconnected");
      } catch (e: any) {
        toast.danger(e?.message || "Logout failed");
      }
    }
  };

  return (
    <div className="h-full w-full relative bg-transparent overflow-hidden text-foreground">
      {/* Background Ambience / Base Layer (Matches AgentChat) */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background/50 to-background/80 pointer-events-none z-0" />

      {/* Scrollable Content Area - Absolute Inset - Z-10 */}
      <div className="absolute inset-0 overflow-y-auto w-full h-full scrollbar-none z-10">
        <div className="flex flex-col gap-8 p-8 max-w-5xl mx-auto min-h-full pb-20 pt-20">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-linear-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Network className="size-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-linear-to-r from-foreground to-foreground/60">
                  Neural Link
                </h1>
                <p className="text-muted-foreground text-sm font-medium">
                  Desktop Node Management
                </p>
              </div>
            </div>

            {state === "connected" && (
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="h-9">
                  <RefreshCw className="size-3 mr-2" />
                  Refresh
                </Button>
                <Button
                  variant="danger-soft"
                  size="sm"
                  onPress={handleLogout}
                  className="h-9"
                >
                  <Unplug className="size-3 mr-2" />
                  Disconnect
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* STATE: IDLE (No Credentials Found) */}
          {state === "idle" && (
            <div className="max-w-xl mx-auto w-full pt-10">
              <Card className="animate-appear border-white/10 bg-background/40 backdrop-blur-xl shadow-xl transition-all hover:bg-background/50">
                <Card.Header>
                  <div className="flex items-center gap-2 mb-1">
                    <Key className="size-4 text-purple-400" />
                    <Card.Title className="text-xl">
                      Authentication Required
                    </Card.Title>
                  </div>
                  <Card.Description>
                    Provide your credentials to join the Cloud Cortex.
                  </Card.Description>
                </Card.Header>
                <Card.Content className="space-y-6 pt-4">
                  <TextField>
                    <Label className="text-xs font-semibold text-default-500 uppercase ml-1">
                      Platform API Key
                    </Label>
                    <Input
                      type="password"
                      placeholder="rk_live_..."
                      value={platformKey}
                      onChange={(e) => setPlatformKey(e.target.value)}
                      className="bg-background/40"
                    />
                    <Description className="text-xs">
                      Available at platform.rainymate.com
                    </Description>
                  </TextField>

                  <TextField>
                    <Label className="text-xs font-semibold text-default-500 uppercase ml-1">
                      Creator API Key
                    </Label>
                    <Input
                      type="password"
                      placeholder="rny_..."
                      value={userApiKey}
                      onChange={(e) => setUserApiKey(e.target.value)}
                      className="bg-background/40"
                    />
                  </TextField>

                  <TextField>
                    <Label className="text-xs font-semibold text-default-500 uppercase ml-1">
                      Workspace Name (Optional)
                    </Label>
                    <Input
                      placeholder="e.g. My Neural Net"
                      value={workspaceName}
                      onChange={(e) => setWorkspaceName(e.target.value)}
                      className="bg-background/40"
                    />
                  </TextField>
                </Card.Content>
                <Card.Footer className="flex justify-end pt-4 pb-8">
                  <Button
                    variant="primary"
                    className="h-12 px-8 font-bold shadow-xl shadow-primary/20"
                    onPress={handleConnect}
                  >
                    Connect Node
                  </Button>
                </Card.Footer>
              </Card>
            </div>
          )}

          {/* STATE: RESTORED (Credentials Found in Keychain) */}
          {state === "restored" && (
            <div className="max-w-xl mx-auto w-full pt-10">
              <Card className="animate-appear border-white/10 bg-background/40 backdrop-blur-xl p-4 shadow-3xl">
                <div className="flex flex-col items-center text-center py-8 space-y-6">
                  <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                    <Fingerprint className="size-10 text-primary" />
                  </div>
                  <div className="space-y-2 px-8">
                    <h2 className="text-2xl font-bold">Welcome Back</h2>
                    <p className="text-muted-foreground">
                      We found your credentials securely stored. Ready to
                      activate your Neural Link session?
                    </p>
                  </div>
                  <div className="flex flex-col gap-3 w-full max-w-xs pt-4">
                    <Button
                      variant="primary"
                      size="md"
                      className="h-14 font-extrabold text-lg shadow-2xl shadow-primary/30"
                      onPress={handleConnect}
                    >
                      Quick Connect
                    </Button>
                    <Button
                      variant="ghost"
                      onPress={() => setState("idle")}
                      className="font-medium text-default-500"
                    >
                      Use Different Keys
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* STATE: CONNECTING (Loading spinner) */}
          {state === "connecting" && (
            <div className="flex-1 flex flex-col items-center justify-center py-20 space-y-6 animate-appear">
              <div className="relative">
                <div className="size-24 border-4 border-primary/20 rounded-full" />
                <div className="size-24 border-t-4 border-primary rounded-full absolute top-0 animate-spin" />
                <Network className="size-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold animate-pulse">
                  Synchronizing Cortex...
                </h2>
                <p className="text-muted-foreground">
                  Registering desktop skills and establishing secure tunnel.
                </p>
              </div>
            </div>
          )}

          {/* STATE: CONNECTED (Dashboard) */}
          {state === "connected" && workspace && (
            <div className="animate-appear space-y-8">
              {/* Main Dashboard Info */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Connection Status Card */}
                <Card className="lg:col-span-8 overflow-hidden group border-white/10 bg-background/40 backdrop-blur-xl">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                    <Database className="size-32" />
                  </div>
                  <Card.Header>
                    <div className="flex items-center gap-3">
                      <Chip color="success" size="sm" className="pl-2">
                        <CheckCircle2 className="size-3 mr-1 inline-block" />
                        Active Session
                      </Chip>
                      <span className="text-xs font-mono text-muted-foreground hidden sm:block">
                        ID: {workspace.id}
                      </span>
                    </div>
                    <Card.Title className="text-4xl font-extrabold mt-2 font-mono tracking-tight">
                      {workspace.name}
                    </Card.Title>
                  </Card.Header>
                  <Card.Content className="pt-4 flex flex-col sm:flex-row gap-6">
                    <div className="flex-1 space-y-1 border-l-2 border-primary/20 pl-4 bg-primary/5 p-3 rounded-r-xl">
                      <span className="text-xs uppercase font-bold text-primary opacity-70">
                        Neural ID
                      </span>
                      <p className="font-mono text-lg font-bold break-all">
                        {workspace.id}
                      </p>
                    </div>
                    <div className="flex-1 space-y-1 border-l-2 border-orange-500/20 pl-4 bg-orange-500/5 p-3 rounded-r-xl">
                      <span className="text-xs uppercase font-bold text-orange-500 opacity-70">
                        Node Type
                      </span>
                      <p className="font-mono text-lg font-bold">Desktop_v2</p>
                    </div>
                  </Card.Content>
                  <Card.Footer className="bg-default-100/30 backdrop-blur-sm border-t border-border/40 py-4 px-6 flex justify-between items-center mt-4">
                    <div className="flex items-center gap-2">
                      <Tooltip>
                        <TooltipTrigger>
                          <Shield className="size-4 text-green-500 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          Keys are securely stored in your System Keychain
                        </TooltipContent>
                      </Tooltip>
                      <span className="text-xs font-medium text-muted-foreground">
                        E2E Encryption Active
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 font-bold text-xs"
                    >
                      <ExternalLink className="size-3 mr-1" />
                      View in Cloud
                    </Button>
                  </Card.Footer>
                </Card>

                {/* Quick Actions Side Card */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                  <Card className="flex-1 p-6 relative overflow-hidden border-white/10 bg-background/40 backdrop-blur-xl">
                    <div className="absolute top-0 right-0 size-20 bg-purple-500/10 blur-2xl rounded-full" />
                    <div className="flex flex-col h-full justify-between">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold flex items-center gap-2">
                            <Shield className="size-4 text-purple-500" />
                            Headless Mode
                          </h3>
                          <Switch
                            isSelected={isHeadless}
                            onChange={(e) =>
                              handleToggleHeadless(
                                (e as any).target?.checked ?? e,
                              )
                            }
                          >
                            <Switch.Thumb />
                          </Switch>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Auto-approve sensitive operations from trusted agents.
                          Use with caution.
                        </p>
                      </div>
                      <Separator className="my-4 opacity-50" />
                      <div className="space-y-4">
                        <h3 className="font-bold flex items-center gap-2">
                          <Smartphone className="size-4 text-primary" />
                          Mobile Link
                        </h3>
                        {pairingCode ? (
                          <div className="bg-primary/5 p-3 rounded-xl border border-primary/20 text-center space-y-1">
                            <div className="text-2xl font-mono font-black tracking-widest text-primary">
                              {pairingCode}
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                              Valid for 15 mins
                            </p>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            className="w-full h-10 border-dashed border-2 hover:border-solid transition-all"
                            onPress={handleGeneratePairingCode}
                          >
                            Pair Mobile Device
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
              </div>

              {/* Agents Management Section */}
              <div className="space-y-6 pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600">
                      <Bot className="size-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Cloud Agents</h2>
                      <p className="text-xs text-muted-foreground font-medium">
                        Manage neural instances running on this workspace
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    className="shadow-lg shadow-primary/20 font-bold px-6 h-12"
                    onPress={() => setIsCreatingAgent(true)}
                  >
                    <Plus className="size-4 shrink-0 mr-2" />
                    Create New Agent
                  </Button>
                </div>

                <Card className="p-1 border-white/10 bg-background/40 backdrop-blur-xl">
                  <AgentList onCreateClick={() => setIsCreatingAgent(true)} />
                </Card>
              </div>

              {/* Security & Airlock Section */}
              <div className="space-y-6 pt-8">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600">
                    <Shield className="size-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Airlock Monitor</h2>
                    <p className="text-xs text-muted-foreground font-medium">
                      Real-time security auditing and approvals
                    </p>
                  </div>
                </div>

                {pendingApprovals.length === 0 ? (
                  <Card className="p-12 text-center border-dashed border-2 bg-transparent opacity-60">
                    <CheckCircle2 className="size-10 mx-auto mb-4 text-green-500/50" />
                    <h3 className="text-lg font-semibold">Cortex Secure</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                      No pending security approvals. All agent operations are
                      synchronized.
                    </p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pendingApprovals.map((request) => (
                      <Card
                        key={request.id}
                        className="p-5 border-l-4 border-l-orange-500 animate-in slide-in-from-right-4 bg-background/60 backdrop-blur-xl"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2">
                              <Chip
                                size="sm"
                                className={
                                  request.level === AirlockLevels.Dangerous
                                    ? "bg-red-500 text-white"
                                    : request.level === AirlockLevels.Sensitive
                                      ? "bg-orange-500 text-white"
                                      : "bg-green-500 text-white"
                                }
                              >
                                {request.level === AirlockLevels.Dangerous
                                  ? "Critical"
                                  : request.level === AirlockLevels.Sensitive
                                    ? "Sensitive"
                                    : "Trust"}
                              </Chip>
                              <span className="font-bold text-sm tracking-tight">
                                {request.command_type}
                              </span>
                            </div>
                            <pre className="text-[10px] font-mono bg-default-100 p-3 rounded-lg overflow-x-auto max-h-32 border border-default-200/50">
                              {JSON.stringify(request.payload, null, 2)}
                            </pre>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-semibold uppercase">
                              <RefreshCw className="size-3" />
                              {new Date(request.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button
                              variant="primary"
                              size="sm"
                              isIconOnly
                              className="bg-green-600 text-white"
                              onPress={() =>
                                handleAirlockRespond(request.id, true)
                              }
                            >
                              <CheckCircle2 className="size-4" />
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              isIconOnly
                              onPress={() =>
                                handleAirlockRespond(request.id, false)
                              }
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
          )}

          {/* CREATE AGENT MODAL - PREMIUM GLASSMORPHISM */}
          <Modal isOpen={isCreatingAgent} onOpenChange={setIsCreatingAgent}>
            <Modal.Backdrop className="backdrop-blur-xl bg-black/40" />
            <Modal.Container>
              <Modal.Dialog className="backdrop-blur-2xl bg-white/60 dark:bg-black/20 border border-white/10 shadow-3xl shadow-black/50">
                <Modal.Header className="px-8 pt-8">
                  <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                      <Sparkles className="size-6" />
                    </div>
                    <div>
                      <Modal.Heading className="text-2xl font-black tracking-tight">
                        Deploy Agent
                      </Modal.Heading>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-0.5">
                        Cloud Cortex Instance
                      </p>
                    </div>
                  </div>
                </Modal.Header>
                <Modal.Body className="px-8 pb-4">
                  <CreateAgentForm
                    onSuccess={() => setIsCreatingAgent(false)}
                    onCancel={() => setIsCreatingAgent(false)}
                  />
                </Modal.Body>
              </Modal.Dialog>
            </Modal.Container>
          </Modal>
        </div>
      </div>
    </div>
  );
}
