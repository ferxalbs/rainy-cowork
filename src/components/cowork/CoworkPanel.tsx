// Rainy Cowork - CoworkPanel Component
// Chat-style AI agent interface for file operations

import { useState, useRef, useEffect, useMemo } from "react";
import { Button, TextArea, Spinner, Tooltip } from "@heroui/react";
import * as tauri from "../../services/tauri";
import {
  FolderSearch,
  Play,
  ArrowUp,
  Sparkles,
  Trash2,
  AlertCircle,
  Paperclip,
  Folder,
  SlidersHorizontal,
  ChevronDown,
  X,
} from "lucide-react";
import { useCoworkAgent, AgentMessage } from "../../hooks/useCoworkAgent";
import { useCoworkStatus } from "../../hooks/useCoworkStatus";
import { useAIProvider } from "../../hooks/useAIProvider";
import { MarkdownRenderer } from "../shared/MarkdownRenderer";

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
      label: "File Organization",
      icon: Folder,
      action: () => sendInstruction("Organize files by type", workspacePath),
      color: "text-amber-500",
    },
    {
      label: "Media Publish",
      icon: Sparkles,
      action: () =>
        sendInstruction("Process and publish media files", workspacePath),
      color: "text-red-500",
    },
    {
      label: "Batch Processing",
      icon: FolderSearch,
      action: () => analyzeWorkspace(workspacePath),
      color: "text-green-500",
    },
    {
      label: "More",
      icon: null,
      action: () => {}, // Placeholder
      color: "text-muted-foreground",
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

  // Fallback state: model not available or no model info
  const isFallback = !isModelAvailable && !statusLoading;

  // Display model name
  const modelDisplay = isFallback
    ? "Auto (Fallback)"
    : currentModelInfo?.name || "Auto";

  const renderInputArea = (centered: boolean) => (
    <div
      className={`w-full max-w-2xl mx-auto transition-all duration-500 ${
        centered ? "scale-100 opacity-100" : "scale-100 opacity-100"
      }`}
    >
      <div className="relative group rounded-3xl bg-muted/20 border border-border/10 focus-within:bg-muted/30 transition-all">
        <TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            centered ? "Describe what you want to do..." : "Type a message..."
          }
          rows={centered ? 3 : 1}
          className={`w-full bg-transparent border-none shadow-none text-foreground placeholder:text-muted-foreground/50 focus:ring-0 px-4 py-3 resize-none ${
            centered ? "text-base min-h-[80px]" : "text-sm min-h-[44px]"
          }`}
          disabled={isProcessing}
        />

        {/* Input Footer Controls */}
        <div className="flex items-center justify-between px-2 pb-2 mt-1">
          <div className="flex items-center gap-1">
            <Tooltip delay={0}>
              <Button
                size="sm"
                variant="ghost"
                isIconOnly
                className="text-muted-foreground hover:text-foreground rounded-full"
              >
                <Paperclip className="size-4" />
              </Button>
              <Tooltip.Content>Attach files</Tooltip.Content>
            </Tooltip>
            <Tooltip delay={0}>
              <Button
                size="sm"
                variant="ghost"
                isIconOnly
                onPress={onOpenSettings}
                className="text-muted-foreground hover:text-foreground rounded-full"
              >
                <SlidersHorizontal className="size-4" />
              </Button>
              <Tooltip.Content>Settings</Tooltip.Content>
            </Tooltip>
            {/* Project Selector - simplified */}
            <div className="h-4 w-px bg-border/30 mx-1" />
            <Button
              size="sm"
              variant="ghost"
              className="text-xs text-muted-foreground hover:text-foreground h-7 gap-1.5 rounded-full px-3"
            >
              <Folder className="size-3.5" />
              <span>Project</span>
              <ChevronDown className="size-3 opacity-50" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="text-xs text-muted-foreground hover:text-foreground h-7 gap-1.5 rounded-full px-3"
              onPress={onOpenSettings}
            >
              {isFallback && <AlertCircle className="size-3 text-orange-400" />}
              <span>{modelDisplay.split(" ")[0]}</span>
              <ChevronDown className="size-3 opacity-50" />
            </Button>

            <Button
              size="sm"
              isIconOnly
              onPress={handleSubmit}
              isDisabled={!input.trim() || isProcessing}
              isPending={isProcessing}
              className={`rounded-full transition-all duration-200 ${
                input.trim()
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {!isProcessing && <ArrowUp className="size-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full relative">
      {/* Decorative gradient - very subtle */}
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-secondary/5 pointer-events-none -z-10 opacity-50" />

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin scrollbar-thumb-border/20 scrollbar-track-transparent">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center -mt-20 animate-in fade-in zoom-in duration-500">
            {/* Header Text */}
            <h1 className="text-3xl font-medium text-foreground mb-8 tracking-tight">
              Good afternoon, cowork with me!
            </h1>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                isIconOnly
                onPress={onClose}
                className="absolute top-4 right-4 opacity-50 hover:opacity-100"
              >
                <X size={16} />
              </Button>
            )}

            {/* Input Area */}
            {renderInputArea(true)}

            {/* Quick Actions */}
            <div className="flex flex-wrap justify-center gap-3 mt-8">
              {quickActions.map((action, idx) => (
                <Button
                  key={idx}
                  variant="secondary"
                  size="sm"
                  onPress={action.action}
                  className="bg-muted/30 hover:bg-muted/50 text-xs font-medium h-8 rounded-full px-4"
                >
                  {action.icon && (
                    <action.icon className={`size-3.5 mr-2 ${action.color}`} />
                  )}
                  <span className="opacity-80">{action.label}</span>
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6 max-w-3xl mx-auto pb-4">
            {/* Top Toolbar for chat mode */}
            <div className="sticky top-0 z-20 flex justify-between items-center py-2 mb-4 bg-background/80 backdrop-blur-md border-b border-border/5">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest pl-2">
                Session
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  isIconOnly
                  onPress={clearMessages}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="size-4" />
                </Button>
                {onClose && (
                  <Button
                    variant="ghost"
                    size="sm"
                    isIconOnly
                    onPress={onClose}
                    className="opacity-50 hover:opacity-100"
                  >
                    <X className="size-4" />
                  </Button>
                )}
              </div>
            </div>

            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                currentPlan={currentPlan}
                isExecuting={isExecuting}
                onExecute={executePlan}
                onCancel={cancelPlan}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Bottom Input Area (Only visible when messages exist) */}
      {messages.length > 0 && (
        <div className="relative z-20 shrink-0 bg-background/80 backdrop-blur-xl border-t border-border/10 p-4">
          {renderInputArea(false)}
          <div className="text-center mt-2">
            <p className="text-[10px] text-muted-foreground/40 font-medium tracking-tight">
              AI can make mistakes. Review generated plans carefully.
            </p>
          </div>
        </div>
      )}
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
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 fade-in duration-300 group`}
    >
      {!isUser && (
        <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center mr-3 mt-1 shrink-0">
          <Sparkles className="size-4 text-primary" />
        </div>
      )}

      <div
        className={`max-w-[85%] rounded-2xl px-5 py-4 text-sm leading-relaxed ${
          isUser
            ? "bg-muted text-foreground"
            : isSystem
              ? "bg-warning/10 text-warning-600 border border-warning/10"
              : "text-foreground"
        }`}
      >
        {message.isLoading && (
          <div className="flex items-center gap-2 mb-2">
            <Spinner size="sm" color="current" className="opacity-40" />
            <span className="text-xs font-semibold opacity-40 tracking-wider">
              THINKING...
            </span>
          </div>
        )}

        <MarkdownRenderer
          content={message.content}
          className={
            isUser
              ? "prose-neutral dark:prose-invert"
              : "prose-neutral dark:prose-invert"
          }
        />

        {/* Plan Actions */}
        {message.plan &&
          currentPlan?.id === message.plan.id &&
          !message.result && (
            <div className="flex gap-2 mt-4 pt-4 border-t border-border/10">
              <Button
                size="sm"
                onPress={() => onExecute(message.plan!.id)}
                isDisabled={isExecuting}
                isPending={isExecuting}
                className="bg-foreground text-background font-medium"
              >
                {!isExecuting && <Play className="size-3.5 mr-1.5" />}
                Execute Plan
              </Button>
              <Button
                variant="outline"
                size="sm"
                onPress={() => onCancel(message.plan!.id)}
                isDisabled={isExecuting}
                className="border-border/40 text-muted-foreground"
              >
                Cancel
              </Button>
            </div>
          )}

        {/* Execution Result */}
        {message.result && (
          <div className="mt-3 pt-3 border-t border-dashed border-border/20 text-xs text-muted-foreground flex items-center gap-2">
            <Sparkles className="size-3 text-green-500" />
            <span>
              Completed {message.result.completedSteps} steps in{" "}
              {message.result.durationMs}ms
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default CoworkPanel;
