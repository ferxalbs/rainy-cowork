import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Card, Input, Spinner, TextArea } from "@heroui/react";
import { toast } from "sonner";
import { AgentSpec } from "../../../types/agent-spec";
import * as tauri from "../../../services/tauri";
import {
  Bot,
  RefreshCw,
  Rocket,
  Pencil,
  Eye,
  FileJson,
  Plus,
  Save,
} from "lucide-react";

type StoreTab = "review" | "edit" | "json";

interface AgentStorePageProps {
  onCreateAgent: () => void;
  onEditInBuilder: (spec: AgentSpec) => void;
}

function cloneSpec(spec: AgentSpec): AgentSpec {
  return JSON.parse(JSON.stringify(spec)) as AgentSpec;
}

export function AgentStorePage({
  onCreateAgent,
  onEditInBuilder,
}: AgentStorePageProps) {
  const [agents, setAgents] = useState<AgentSpec[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [draft, setDraft] = useState<AgentSpec | null>(null);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<StoreTab>("review");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);

  const loadAgents = useCallback(async () => {
    setIsLoading(true);
    try {
      const specs = (await tauri.listAgentSpecs()) as AgentSpec[];
      setAgents(specs);
      if (specs.length > 0) {
        setSelectedId((prev) => prev || specs[0].id);
      } else {
        setSelectedId("");
        setDraft(null);
      }
    } catch (error) {
      console.error("Failed to load agents:", error);
      toast.error("Failed to load saved agents");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAgents();
  }, [loadAgents]);

  useEffect(() => {
    if (!selectedId) {
      setDraft(null);
      return;
    }
    const selected = agents.find((agent) => agent.id === selectedId);
    setDraft(selected ? cloneSpec(selected) : null);
  }, [agents, selectedId]);

  const filteredAgents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return agents;
    return agents.filter((agent) => {
      const name = agent.soul.name.toLowerCase();
      const description = agent.soul.description.toLowerCase();
      return name.includes(query) || description.includes(query);
    });
  }, [agents, search]);

  const selectedOriginal = useMemo(
    () => agents.find((agent) => agent.id === selectedId) ?? null,
    [agents, selectedId],
  );

  const isDirty = useMemo(() => {
    if (!selectedOriginal || !draft) return false;
    return JSON.stringify(selectedOriginal) !== JSON.stringify(draft);
  }, [selectedOriginal, draft]);

  const setMemoryNumber = (
    field: "retention_days" | "max_tokens",
    value: string,
  ) => {
    if (!draft) return;
    const parsed = Number.parseInt(value || "0", 10);
    const nextValue =
      field === "retention_days"
        ? Math.max(1, parsed || 1)
        : Math.max(512, parsed || 512);
    setDraft({
      ...draft,
      memory_config: {
        ...draft.memory_config,
        [field]: nextValue,
      },
    });
  };

  const handleSave = async () => {
    if (!draft) return;
    if (!draft.soul.name.trim()) {
      toast.error("Agent name is required");
      return;
    }

    setIsSaving(true);
    try {
      await tauri.saveAgentSpec(draft);
      toast.success("Agent updated");
      await loadAgents();
    } catch (error) {
      console.error("Failed to save agent:", error);
      toast.error("Failed to save agent");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeploy = async () => {
    if (!draft) return;
    setIsDeploying(true);
    try {
      const hasCredentials = await tauri.ensureAtmCredentialsLoaded();
      if (!hasCredentials) {
        throw new Error(
          "Rainy-ATM is not authenticated. Configure ATM credentials first.",
        );
      }
      await tauri.deployAgentSpec(draft);
      toast.success("Agent deployed to Rainy-ATM");
    } catch (error) {
      console.error("Failed to deploy agent:", error);
      toast.error(`Deploy failed: ${error}`);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="h-full min-h-0 flex gap-4">
      <Card className="w-[340px] shrink-0 h-full min-h-0 bg-background/60 dark:bg-background/20 backdrop-blur-2xl border">
        <Card.Header className="flex flex-col items-stretch gap-3 p-4 border-b border-divider">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-large font-bold">Agents Store</p>
                <div className="bg-default-100 text-default-600 text-tiny font-bold px-1.5 py-0.5 rounded-full">
                  {agents.length}
                </div>
              </div>
              <p className="text-tiny text-default-400 mt-1">
                Review, edit, and deploy saved agents
              </p>
            </div>
          </div>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or description"
          />
          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onPress={loadAgents}
              isDisabled={isLoading}
            >
              <RefreshCw
                className={`size-4 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              onPress={onCreateAgent}
            >
              <Plus className="size-4" />
              New
            </Button>
          </div>
        </Card.Header>
        <Card.Content className="p-2 overflow-auto space-y-1">
          {isLoading ? (
            <div className="py-16 flex items-center justify-center">
              <Spinner size="lg" />
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="py-12 px-4 text-center text-default-500 text-sm">
              No agents found.
            </div>
          ) : (
            filteredAgents.map((agent) => {
              const isSelected = selectedId === agent.id;
              return (
                <div
                  key={agent.id}
                  className={`w-full p-3 rounded-xl cursor-pointer transition-all duration-200 group ${
                    isSelected
                      ? "bg-primary/10 border-primary/20"
                      : "hover:bg-default-100 dark:hover:bg-white/5 border-transparent"
                  } border`}
                  onClick={() => setSelectedId(agent.id)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-default-200 text-default-500 dark:bg-default-100"
                      }`}
                    >
                      <Bot className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-semibold truncate ${
                          isSelected ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {agent.soul.name || "Untitled Agent"}
                      </p>
                      <p className="text-xs text-default-400 truncate mt-0.5 line-clamp-2">
                        {agent.soul.description || "No description"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </Card.Content>
      </Card>

      <Card className="flex-1 h-full min-h-0 bg-background/60 dark:bg-background/20 backdrop-blur-2xl border">
        {!draft ? (
          <div className="h-full flex items-center justify-center p-8 text-default-500 text-sm">
            Select an agent from the store to review or edit it.
          </div>
        ) : (
          <>
            <div className="p-8 border-b border-divider/50">
              <div className="flex flex-col gap-6">
                {/* Header Row: Name & Actions */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-3xl font-bold tracking-tight">
                      {draft.soul.name || "Untitled Agent"}
                    </h2>
                    <p className="text-base text-default-500 max-w-2xl">
                      {draft.soul.description ||
                        "No description provided for this agent."}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 bg-default-100 p-1 rounded-lg">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="bg-background shadow-sm hover:translate-y-[-1px] transition-transform"
                      onPress={() => onEditInBuilder(draft)}
                      isDisabled={isSaving || isDeploying}
                    >
                      <Pencil className="size-3.5 mr-2" />
                      Builder
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="bg-background shadow-sm hover:translate-y-[-1px] transition-transform"
                      onPress={handleDeploy}
                      isDisabled={isSaving || isDeploying}
                    >
                      <Rocket className="size-3.5 mr-2" />
                      {isDeploying ? "Deploying..." : "Deploy"}
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      className="shadow-md hover:translate-y-[-1px] transition-transform"
                      onPress={handleSave}
                      isDisabled={!isDirty || isSaving || isDeploying}
                    >
                      <Save className="size-3.5 mr-2" />
                      {isSaving ? "Saving..." : "Save"}
                    </Button>
                  </div>
                </div>

                {/* Metadata Row: Badges & Tabs */}
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <div className="px-2.5 py-1 rounded-md bg-default-100 border border-default-200 text-xs font-medium text-default-600">
                      v{draft.version}
                    </div>
                    <div className="px-2.5 py-1 rounded-md bg-default-100 border border-default-200 text-xs font-medium text-default-600">
                      {draft.memory_config.strategy}
                    </div>
                    <div className="px-2.5 py-1 rounded-md bg-default-100 border border-default-200 text-xs font-medium text-default-600">
                      caps: {draft.skills.capabilities.length}
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-1 bg-default-100/50 p-1 rounded-lg border border-default-200/50">
                    <Button
                      size="sm"
                      variant={activeTab === "review" ? "primary" : "ghost"}
                      onPress={() => setActiveTab("review")}
                      className={
                        activeTab === "review"
                          ? "font-medium shadow-sm"
                          : "text-default-500 hover:text-default-700"
                      }
                    >
                      <Eye className="size-3.5 mr-2" />
                      Review
                    </Button>
                    <Button
                      size="sm"
                      variant={activeTab === "edit" ? "primary" : "ghost"}
                      onPress={() => setActiveTab("edit")}
                      className={
                        activeTab === "edit"
                          ? "font-medium shadow-sm"
                          : "text-default-500 hover:text-default-700"
                      }
                    >
                      <Pencil className="size-3.5 mr-2" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant={activeTab === "json" ? "primary" : "ghost"}
                      onPress={() => setActiveTab("json")}
                      className={
                        activeTab === "json"
                          ? "font-medium shadow-sm"
                          : "text-default-500 hover:text-default-700"
                      }
                    >
                      <FileJson className="size-3.5 mr-2" />
                      JSON
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <Card.Content className="p-5 overflow-auto">
              {activeTab === "review" && (
                <div className="space-y-6 max-w-4xl">
                  {/* Personality Section */}
                  <div className="p-6 rounded-2xl bg-default-100/50 border border-default-200/50">
                    <p className="text-xs font-bold uppercase tracking-wider text-default-500 mb-4">
                      Personality
                    </p>
                    <p className="text-base leading-relaxed text-default-700 dark:text-default-300">
                      {draft.soul.personality ||
                        "No personality traits defined. Click Edit to add personality."}
                    </p>
                  </div>

                  {/* Soul Content Section */}
                  <div className="p-6 rounded-2xl bg-default-100/50 border border-default-200/50">
                    <p className="text-xs font-bold uppercase tracking-wider text-default-500 mb-4">
                      Soul Content
                    </p>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {/* Simple rendering for now, could use a Markdown component if available */}
                      <pre className="whitespace-pre-wrap font-sans text-sm text-default-700 dark:text-default-300 leading-relaxed">
                        {draft.soul.soul_content || "No soul content defined."}
                      </pre>
                    </div>
                  </div>

                  {/* Settings / Config Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-default-50 border border-default-200/50">
                      <p className="text-xs font-bold uppercase tracking-wider text-default-400 mb-1">
                        Memory
                      </p>
                      <p className="text-sm font-semibold">
                        {draft.memory_config.strategy}
                      </p>
                      <p className="text-xs text-default-400">
                        {draft.memory_config.retention_days} days •{" "}
                        {draft.memory_config.max_tokens} tokens
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-default-50 border border-default-200/50">
                      <p className="text-xs font-bold uppercase tracking-wider text-default-400 mb-1">
                        Connectors
                      </p>
                      <p className="text-sm font-semibold">
                        {draft.connectors.telegram_enabled
                          ? "Telegram Active"
                          : "No Connectors"}
                      </p>
                      <p className="text-xs text-default-400">
                        Auto-reply: {draft.connectors.auto_reply ? "On" : "Off"}
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-default-50 border border-default-200/50">
                      <p className="text-xs font-bold uppercase tracking-wider text-default-400 mb-1">
                        Capabilities
                      </p>
                      <p className="text-sm font-semibold">
                        {draft.skills.capabilities.length} Enabled
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {draft.skills.capabilities.slice(0, 3).map((c) => (
                          <span
                            key={c.name}
                            className="px-1.5 py-0.5 rounded-md bg-default-200 text-[10px] text-default-600"
                          >
                            {c.name}
                          </span>
                        ))}
                        {draft.skills.capabilities.length > 3 && (
                          <span className="px-1.5 py-0.5 rounded-md bg-default-200 text-[10px] text-default-600">
                            +{draft.skills.capabilities.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "edit" && (
                <div className="space-y-4 max-w-4xl">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-wide text-default-500">
                        Name
                      </p>
                      <Input
                        value={draft.soul.name}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            soul: { ...draft.soul, name: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-wide text-default-500">
                        Tone
                      </p>
                      <Input
                        value={draft.soul.tone}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            soul: { ...draft.soul, tone: e.target.value },
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wide text-default-500">
                      Description
                    </p>
                    <Input
                      value={draft.soul.description}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          soul: { ...draft.soul, description: e.target.value },
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wide text-default-500">
                      Personality
                    </p>
                    <TextArea
                      value={draft.soul.personality}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          soul: { ...draft.soul, personality: e.target.value },
                        })
                      }
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wide text-default-500">
                      Soul Content
                    </p>
                    <TextArea
                      value={draft.soul.soul_content}
                      onChange={(e) =>
                        setDraft({
                          ...draft,
                          soul: { ...draft.soul, soul_content: e.target.value },
                        })
                      }
                      rows={6}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-wide text-default-500">
                        Memory Strategy
                      </p>
                      <Input
                        value={draft.memory_config.strategy}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            memory_config: {
                              ...draft.memory_config,
                              strategy: e.target.value as
                                | "hybrid"
                                | "simple_buffer"
                                | "vector",
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-wide text-default-500">
                        Retention Days
                      </p>
                      <Input
                        type="number"
                        value={String(draft.memory_config.retention_days)}
                        onChange={(e) =>
                          setMemoryNumber("retention_days", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-wide text-default-500">
                        Max Tokens
                      </p>
                      <Input
                        type="number"
                        value={String(draft.memory_config.max_tokens)}
                        onChange={(e) =>
                          setMemoryNumber("max_tokens", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-wide text-default-500">
                        Telegram Channel ID
                      </p>
                      <Input
                        value={draft.connectors.telegram_channel_id || ""}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            connectors: {
                              ...draft.connectors,
                              telegram_channel_id: e.target.value || undefined,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <Button
                        className="flex-1"
                        variant={
                          draft.connectors.telegram_enabled
                            ? "secondary"
                            : "ghost"
                        }
                        onPress={() =>
                          setDraft({
                            ...draft,
                            connectors: {
                              ...draft.connectors,
                              telegram_enabled:
                                !draft.connectors.telegram_enabled,
                            },
                          })
                        }
                      >
                        Telegram{" "}
                        {draft.connectors.telegram_enabled
                          ? "Enabled"
                          : "Disabled"}
                      </Button>
                      <Button
                        className="flex-1"
                        variant={
                          draft.connectors.auto_reply ? "secondary" : "ghost"
                        }
                        onPress={() =>
                          setDraft({
                            ...draft,
                            connectors: {
                              ...draft.connectors,
                              auto_reply: !draft.connectors.auto_reply,
                            },
                          })
                        }
                      >
                        Auto Reply {draft.connectors.auto_reply ? "On" : "Off"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "json" && (
                <TextArea
                  value={JSON.stringify(draft, null, 2)}
                  readOnly
                  rows={24}
                  className="font-mono text-xs"
                />
              )}
            </Card.Content>
          </>
        )}
      </Card>
    </div>
  );
}
