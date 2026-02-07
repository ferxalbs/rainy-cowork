import { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { toast } from "sonner";

export type AgentEvent =
  | { type: "status"; data: string }
  | { type: "thought"; data: string }
  | { type: "tool_call"; data: any }
  | { type: "tool_result"; data: { id: string; result: string } }
  | { type: "error"; data: string };

export type AgentStatus = "idle" | "running" | "error" | "completed";

export interface AgentLogEvent {
  id: string;
  type: "status" | "thought" | "tool_call" | "tool_result" | "error";
  content: any;
  timestamp: Date;
}

export interface AgentState {
  status: AgentStatus;
  events: AgentLogEvent[];
  error: string | null;
}

export function useAgentRuntime() {
  const [state, setState] = useState<AgentState>({
    status: "idle",
    events: [],
    error: null,
  });

  // Listen for real-time events from Backend
  useEffect(() => {
    const unlistenPromise = listen<AgentEvent>("agent://event", (event) => {
      const payload = event.payload;
      console.log("Agent Event:", payload);

      const newEvent: AgentLogEvent = {
        id: Date.now().toString() + Math.random().toString().slice(2, 5),
        type: payload.type,
        content: payload.data,
        timestamp: new Date(),
      };

      setState((prev) => ({
        ...prev,
        events: [...prev.events, newEvent],
        status: payload.type === "error" ? "error" : prev.status,
        error: payload.type === "error" ? (payload.data as string) : prev.error,
      }));
    });

    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, []);

  const runAgent = useCallback(
    async (prompt: string, modelId: string, workspaceId: string) => {
      setState((prev) => ({
        status: "running",
        events: [], // Clear previous run events
        error: null,
      }));

      try {
        await invoke("run_agent_workflow", {
          prompt,
          modelId,
          workspaceId,
        });

        setState((prev) => ({ ...prev, status: "completed" }));
      } catch (err: any) {
        console.error("Agent execution failed:", err);
        setState((prev) => ({
          ...prev,
          status: "error",
          error: err.toString(),
          events: [
            ...prev.events,
            {
              id: Date.now().toString(),
              type: "error",
              content: err.toString(),
              timestamp: new Date(),
            },
          ],
        }));
        toast.error(`Agent failed: ${err.toString()}`);
      }
    },
    [],
  );

  const loadHistory = useCallback(async (chatId: string) => {
    try {
      const history = await invoke<Array<[string, string, string]>>(
        "get_chat_history",
        { chatId },
      );

      // Convert history to events
      const historyEvents: AgentLogEvent[] = history.map(
        ([id, role, content]) => ({
          id,
          type: role === "assistant" ? "thought" : "status", // Simplified mapping
          content: content,
          timestamp: new Date(), // We might want to fetch real timestamp
        }),
      );

      setState((prev) => ({
        ...prev,
        events: historyEvents,
      }));
    } catch (err) {
      console.error("Failed to load history:", err);
      toast.error("Failed to load history");
    }
  }, []);

  return {
    state,
    runAgent,
    loadHistory,
  };
}
