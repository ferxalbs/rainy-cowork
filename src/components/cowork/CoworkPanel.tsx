// Rainy Cowork - CoworkPanel Component
// Chat-style AI agent interface for file operations

import { useState, useRef, useEffect, useMemo } from "react";
import { Button, TextArea, Spinner } from "@heroui/react";
import * as tauri from "../../services/tauri";
import {
  Settings as SettingsIcon,
  BrainCircuit,
  FolderSearch,
  Play,
  Send,
  Sparkles,
  Trash2,
  X,
  AlertCircle,
} from "lucide-react";
import { useCoworkAgent, AgentMessage } from "../../hooks/useCoworkAgent";
import { useCoworkStatus } from "../../hooks/useCoworkStatus";
import { useAIProvider } from "../../hooks/useAIProvider";

interface CoworkPanelProps {
  workspacePath: string;
  onClose?: () => void;
  onOpenSettings?: () => void;
}

export function CoworkPanel({
  workspacePath,
  onClose,
  onOpenSettings,
}: CoworkPanelProps) {
  const [input, setInput] = useState("");
  const [currentModel, setCurrentModel] = useState<string>("");
  const [availableModels, setAvailableModels] = useState<tauri.ModelOption[]>(
    [],
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch current model and available models on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [model, models] = await Promise.all([
          tauri.getSelectedModel(),
          tauri.getAvailableModels(),
        ]);
        setCurrentModel(model);
        setAvailableModels(models);
      } catch (err) {
        console.error("Failed to fetch model data", err);
      }
    };
    fetchData();
  }, []);

  const {
    messages,
    isPlanning,
    isExecuting,
    currentPlan,
    sendInstruction,
    executePlan,
    cancelPlan,
    analyzeWorkspace,
    clearMessages,
  } = useCoworkAgent();

  const isProcessing = isPlanning || isExecuting;

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async () => {
    if (!input.trim() || isProcessing) return;

    const instruction = input.trim();
    setInput("");
    await sendInstruction(instruction, workspacePath);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const quickActions = [
    {
      label: "Analyze",
      icon: FolderSearch,
      action: () => analyzeWorkspace(workspacePath),
    },
    {
      label: "Organize by type",
      icon: Sparkles,
      action: () =>
        sendInstruction("Organize all files by type", workspacePath),
    },
  ];

  // Cowork status for validation
  const { isLoading: statusLoading } = useCoworkStatus();

  // AI provider for API key checks
  const { hasApiKey } = useAIProvider();

  // Find the current model in available models to get provider info
  const currentModelInfo = availableModels.find(
    (model) => model.id === currentModel,
  );

  // Check if current model is actually available based on provider and API keys
  const isModelAvailable = useMemo(() => {
    if (!currentModelInfo) return false;

    // Strict provider matching to avoid confusion between Cowork and BYOK
    const provider = currentModelInfo.provider;

    // Rainy API models (pay-as-you-go, premium models)
    if (provider === "Rainy API") {
      return hasApiKey("rainy_api");
    }

    // Cowork Subscription models (available for both free and paid plans with API key)
    if (provider === "Cowork Subscription") {
      // Cowork models work with either cowork_api or rainy_api key
      return hasApiKey("cowork_api") || hasApiKey("rainy_api");
    }

    // Google Gemini BYOK models (user's own API key)
    if (provider === "Google Gemini") {
      return hasApiKey("gemini");
    }

    return false;
  }, [currentModelInfo, hasApiKey]);

  // Determine model type based on provider (strict matching)
  const isRainyApiModel = currentModelInfo?.provider === "Rainy API";
  const isCoworkApiModel = currentModelInfo?.provider === "Cowork Subscription";
  const isByokModel = currentModelInfo?.provider === "Google Gemini";

  // Fallback state: model not available or no model info
  const isFallback = !isModelAvailable && !statusLoading;

  // Display model name
  const modelDisplay = isFallback
    ? "Gemini Flash (Fallback)"
    : currentModelInfo?.name || currentModel || "Loading...";

  // Badge states for UI display
  const isRainyApiBadge = isRainyApiModel && isModelAvailable;
  const isCoworkApiBadge = isCoworkApiModel && isModelAvailable;
  const isByokBadge = isByokModel && isModelAvailable;
  const isFallbackBadge = isFallback;

  return (
    <div className="flex flex-col h-full bg-background/50 backdrop-blur-xl rounded-xl border border-border shadow-2xl relative overflow-hidden">
      {/* Decorative Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-background/30 backdrop-blur-md relative z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary animate-pulse-slow" />
            <span className="font-medium text-foreground tracking-tight">
              AI Cowork Agent
            </span>
          </div>

          {/* Model Indicator */}
          <div
            className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs border cursor-pointer hover:bg-white/5 transition-colors ${
              isCoworkApiBadge
                ? "bg-purple-500/10 border-purple-500/30 text-purple-300"
                : isRainyApiBadge
                  ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
                  : isByokBadge
                    ? "bg-blue-500/10 border-blue-500/30 text-blue-300"
                    : isFallbackBadge
                      ? "bg-orange-500/10 border-orange-500/30 text-orange-300"
                      : "bg-gray-500/10 border-gray-500/30 text-gray-300"
            }`}
            onClick={onOpenSettings}
            title={
              isCoworkApiBadge
                ? "Using Cowork Subscription models (available for free and paid plans)"
                : isRainyApiBadge
                  ? "Using Rainy API pay-as-you-go models"
                  : isByokBadge
                    ? "Using your own Gemini API key (BYOK)"
                    : isFallbackBadge
                      ? "Model not available. Configure API keys in settings."
                      : "Click to change model in settings"
            }
          >
            {isFallbackBadge ? (
              <AlertCircle className="w-3 h-3" />
            ) : (
              <BrainCircuit className="w-3 h-3" />
            )}
            <span className="font-medium truncate max-w-[120px]">
              {modelDisplay}
            </span>
            <span className="opacity-60 text-[10px] uppercase tracking-wider font-semibold">
              {isCoworkApiBadge
                ? "COWORK"
                : isRainyApiBadge
                  ? "RAINY"
                  : isByokBadge
                    ? "BYOK"
                    : isFallbackBadge
                      ? "FALLBACK"
                      : "UNKNOWN"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            onPress={onOpenSettings}
            className="text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <SettingsIcon className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            onPress={clearMessages}
            isDisabled={messages.length === 0}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              isIconOnly
              onPress={onClose}
              className="hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 relative z-10 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground animate-in fade-in zoom-in duration-500">
            <div className="p-4 rounded-full bg-primary/5 mb-6 ring-1 ring-primary/10">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <p className="text-xl font-medium mb-3 text-foreground">
              AI File Assistant
            </p>
            <p className="text-sm max-w-sm text-balance leading-relaxed text-muted-foreground">
              Describe what you want to do with your files. For example:
              "Organize my downloads by file type" or "Rename all photos with
              date prefix"
            </p>

            {/* Quick Actions */}
            <div className="flex gap-2.5 mt-8">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant="secondary"
                  size="sm"
                  onPress={action.action}
                  isDisabled={isProcessing}
                  className="bg-card hover:bg-accent hover:text-accent-foreground border border-border/50 shadow-sm transition-all duration-200"
                >
                  <action.icon className="w-4 h-4 mr-1.5 opacity-70" />
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              currentPlan={currentPlan}
              isExecuting={isExecuting}
              onExecute={executePlan}
              onCancel={cancelPlan}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border/50 bg-background/50 backdrop-blur-md relative z-10">
        <div className="flex gap-2 items-end bg-input/50 border border-input rounded-xl p-1.5 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all duration-200 shadow-inner">
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe what you want to do..."
            rows={1}
            className="flex-1 bg-transparent border-none shadow-none text-foreground placeholder:text-muted-foreground focus:ring-0 px-3 py-2 min-h-[44px]"
            disabled={isProcessing}
          />
          <Button
            size="sm"
            isIconOnly
            onPress={handleSubmit}
            isDisabled={!input.trim() || isProcessing}
            isPending={isProcessing}
            className={`mb-0.5 mr-0.5 w-8 h-8 min-w-8 rounded-lg transition-all duration-200 ${
              input.trim() && !isProcessing
                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                : "bg-muted text-muted-foreground opacity-50"
            }`}
          >
            {!isProcessing && <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2.5 ml-1 flex items-center gap-1.5 opacity-60">
          <span className="px-1.5 py-0.5 rounded border border-border bg-card/50">
            Enter
          </span>{" "}
          to send
          <span className="w-1 h-1 rounded-full bg-border" />
          <span className="px-1.5 py-0.5 rounded border border-border bg-card/50">
            Shift + Enter
          </span>{" "}
          for new line
        </p>
      </div>
    </div>
  );
}

// Message bubble component
interface MessageBubbleProps {
  message: AgentMessage;
  currentPlan: ReturnType<typeof useCoworkAgent>["currentPlan"];
  isExecuting: boolean;
  onExecute: (planId: string) => void;
  onCancel: (planId: string) => void;
}

function MessageBubble({
  message,
  currentPlan,
  isExecuting,
  onExecute,
  onCancel,
}: MessageBubbleProps) {
  const isUser = message.type === "user";
  const isSystem = message.type === "system";

  return (
    <div
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 fade-in duration-300`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-5 py-3.5 shadow-sm text-sm leading-relaxed ${
          isUser
            ? "bg-primary text-primary-foreground rounded-br-none"
            : isSystem
              ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
              : "bg-card border border-border text-foreground rounded-bl-none shadow-sm"
        }`}
      >
        {message.isLoading && (
          <div className="flex items-center gap-2.5">
            <Spinner size="sm" color="current" className="opacity-60" />
            <span className="text-xs font-medium opacity-70 tracking-wide">
              THINKING...
            </span>
          </div>
        )}

        <div className="whitespace-pre-wrap text-sm">{message.content}</div>

        {/* Plan Actions */}
        {message.plan &&
          currentPlan?.id === message.plan.id &&
          !message.result && (
            <div className="flex gap-2 mt-4 pt-3 border-t border-border/10">
              <Button
                size="sm"
                onPress={() => onExecute(message.plan!.id)}
                isDisabled={isExecuting}
                isPending={isExecuting}
                className="bg-primary text-primary-foreground shadow-sm hover:shadow-md transition-all"
              >
                {!isExecuting && <Play className="w-3.5 h-3.5 mr-1.5" />}
                Execute Plan
              </Button>
              <Button
                variant="outline"
                size="sm"
                onPress={() => onCancel(message.plan!.id)}
                isDisabled={isExecuting}
                className="border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
              >
                Cancel
              </Button>
            </div>
          )}

        {/* Execution Result */}
        {message.result && (
          <div className="mt-2 pt-2 border-t border-white/10 text-xs opacity-70">
            {message.result.completedSteps}/{message.result.totalSteps} steps •
            {message.result.totalChanges} changes •{message.result.durationMs}ms
          </div>
        )}
      </div>
    </div>
  );
}

export default CoworkPanel;
