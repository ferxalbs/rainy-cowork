import { useState, useEffect } from "react";
import { ChevronDown, Brain, Clock } from "lucide-react";
import { Button } from "@heroui/react";
import { motion, AnimatePresence } from "framer-motion";

interface ThoughtDisplayProps {
  thought: string;
  thinkingLevel?: "minimal" | "low" | "medium" | "high";
  modelName?: string;
  className?: string;
  isStreaming?: boolean;
  durationMs?: number;
}

export function ThoughtDisplay({
  thought,
  thinkingLevel = "medium",
  modelName,
  className,
  isStreaming = false,
  durationMs,
}: ThoughtDisplayProps) {
  // Default to expanded if currently streaming
  const [isExpanded, setIsExpanded] = useState(isStreaming);
  const [elapsed, setElapsed] = useState(0);

  // Auto-expand and track time during streaming
  useEffect(() => {
    if (isStreaming) {
      setIsExpanded(true);
      const start = Date.now();
      const interval = setInterval(() => {
        setElapsed(Date.now() - start);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isStreaming]);

  // Use provided duration (if finished) or local elapsed (if streaming)
  const displayTime = durationMs || (isStreaming ? elapsed : null);

  const formatTime = (ms: number) => {
    return (ms / 1000).toFixed(1) + "s";
  };

  // Use modelName if available
  const headerTitle = modelName ? `${modelName} Thinking` : "Thinking Process";

  const levelColor: Record<string, string> = {
    minimal: "text-slate-500",
    low: "text-blue-500",
    medium: "text-amber-500",
    high: "text-purple-500",
  };

  const bgColor: Record<string, string> = {
    minimal: "bg-slate-500",
    low: "bg-blue-500",
    medium: "bg-amber-500",
    high: "bg-purple-500",
  };

  const currentLevelColor = levelColor[thinkingLevel] || levelColor.medium;
  const currentBgColor = bgColor[thinkingLevel] || bgColor.medium;

  return (
    <div className={`w-full font-sans ${className}`}>
      <div
        className="flex items-center gap-2 cursor-pointer group select-none py-2"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div
          className={`p-1 rounded-md bg-opacity-10 ${currentBgColor} transition-colors`}
        >
          <Brain className={`size-3.5 ${currentLevelColor}`} />
        </div>

        <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors">
          {headerTitle}
        </span>

        {displayTime && (
          <span className="text-xs text-muted-foreground font-mono flex items-center gap-1 ml-1 bg-muted/30 px-1.5 py-0.5 rounded">
            <Clock className="size-3" />
            {formatTime(displayTime)}
          </span>
        )}

        <div className="flex-1" />

        <Button
          size="sm"
          variant="ghost"
          isIconOnly
          className="w-6 h-6 min-w-0 data-[hover=true]:bg-muted/50 text-muted-foreground"
          onPress={() => setIsExpanded(!isExpanded)}
        >
          <ChevronDown
            className={`size-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
          />
        </Button>
      </div>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pl-2 border-l-2 border-muted/30 ml-2.5 my-1">
              <div className="pl-4 py-2 text-sm text-muted-foreground/90 whitespace-pre-wrap leading-relaxed font-mono bg-muted/5 rounded-r-lg">
                {thought}
                {isStreaming && (
                  <span className="inline-block w-1.5 h-3.5 bg-current ml-1 animate-pulse align-middle" />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ThoughtBadge({
  thinkingLevel = "medium",
}: {
  thinkingLevel?: string;
}) {
  const levelColor: Record<string, string> = {
    minimal: "text-slate-500",
    low: "text-blue-500",
    medium: "text-amber-500",
    high: "text-purple-500",
  };

  const bgColor: Record<string, string> = {
    minimal: "bg-slate-500",
    low: "bg-blue-500",
    medium: "bg-amber-500",
    high: "bg-purple-500",
  };

  const currentLevelColor = levelColor[thinkingLevel] || levelColor.medium;
  const currentBgColor = bgColor[thinkingLevel] || bgColor.medium;

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-opacity-10 ${currentBgColor}`}
    >
      <Brain className={`size-3 ${currentLevelColor}`} />
      <span className={`text-[10px] font-medium ${currentLevelColor}`}>
        Thinking
      </span>
    </div>
  );
}
