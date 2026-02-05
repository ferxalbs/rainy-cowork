// src/hooks/useAgentChat.ts
import { useState, useCallback } from "react";
import { useStreaming } from "./useStreaming";
import { useTauriTask } from "./useTauriTask";
import type { AgentMessage, TaskPlan } from "../types/agent";
import * as tauri from "../services/tauri";

export function useAgentChat() {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isPlanning, setIsPlanning] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<TaskPlan | null>(null);

  const { streamWithRouting } = useStreaming();
  const { createTask } = useTauriTask();

  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentPlan(null); // Reset plan too
  }, []);

  const streamChat = useCallback(
    async (instruction: string, modelId: string, hiddenContext?: string) => {
      const userMsg: AgentMessage = {
        id: crypto.randomUUID(),
        type: "user",
        content: instruction,
        timestamp: new Date(),
      };

      // Optimistically update UI
      setMessages((prev) => [...prev, userMsg]);

      const agentMsgId = crypto.randomUUID();
      const initialAgentMsg: AgentMessage = {
        id: agentMsgId,
        type: "agent",
        content: "",
        isLoading: true,
        timestamp: new Date(),
        modelUsed: { name: modelId, thinkingEnabled: false },
      };
      setMessages((prev) => [...prev, initialAgentMsg]);

      let accumulatedContent = "";

      try {
        // Construct history from current messages
        // Filter out temporary/loading states or failed messages if needed
        const history = messages
          .filter((m) => !m.isLoading && !m.content.startsWith("[Error"))
          .map((m) => ({
            role: m.type === "agent" ? "assistant" : "user",
            content: m.content,
          }));

        // Add the new user message (with hidden context if provided)
        const effectiveContent = hiddenContext
          ? `${hiddenContext}\n\nUser Query: "${instruction}"`
          : instruction;

        const fullMessages = [
          ...history,
          { role: "user", content: effectiveContent },
        ];

        await streamWithRouting(
          {
            messages: fullMessages,
            model: modelId,
          },
          (event) => {
            if (event.event === "chunk") {
              accumulatedContent += event.data.content;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === agentMsgId
                    ? { ...m, content: accumulatedContent, isLoading: false }
                    : m,
                ),
              );
            } else if (event.event === "finished") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === agentMsgId ? { ...m, isLoading: false } : m,
                ),
              );
            } else if (event.event === "error") {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === agentMsgId
                    ? {
                        ...m,
                        content:
                          accumulatedContent +
                          `\n[Error: ${event.data.message}]`,
                        isLoading: false,
                      }
                    : m,
                ),
              );
            }
          },
        );
      } catch (err) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === agentMsgId
              ? {
                  ...m,
                  content: accumulatedContent + `\n[Error: ${err}]`,
                  isLoading: false,
                }
              : m,
          ),
        );
      }
    },
    [streamWithRouting, messages], // Add messages to dependency array
  );

  const sendInstruction = useCallback(
    async (instruction: string, workspacePath: string, modelId: string) => {
      // This maps to "Deep Processing" / Task creation
      const userMsg: AgentMessage = {
        id: crypto.randomUUID(),
        type: "user",
        content: instruction,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);

      setIsPlanning(true);

      // Parse modelId (e.g. "gemini-2.0-flash" -> "gemini-2.0-flash")
      // Parse modelId - remove explicit 'rainy:' prefix handling if backend handles it
      // But keep safety check if ID comes formatted weirdly from other places
      let targetModel = modelId;
      if (targetModel.startsWith("rainy:")) {
        targetModel = targetModel.replace("rainy:", "");
      } else if (targetModel.startsWith("cowork:")) {
        targetModel = targetModel.replace("cowork:", "");
      }

      const targetProvider = "rainyapi"; // Default to rainyapi

      // created a task
      try {
        // Use selected model instead of hardcoded default
        const task = await createTask(
          instruction,
          targetProvider as any,
          targetModel,
          workspacePath,
        );

        // Create a placeholder plan message
        const planMsgId = crypto.randomUUID();
        const planMsg: AgentMessage = {
          id: planMsgId,
          type: "agent",
          content: "Planning task...",
          isLoading: true,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, planMsg]);

        // Execute the task
        await tauri.executeTask(task.id, (event) => {
          if (event.event === "progress") {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === planMsgId
                  ? {
                      ...m,
                      content: `Executing... ${event.data.progress}%: ${event.data.message || ""}`,
                    }
                  : m,
              ),
            );
          } else if (event.event === "completed") {
            setIsExecuting(false);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === planMsgId
                  ? {
                      ...m,
                      content: "Task completed successfully.",
                      isLoading: false,
                      result: { totalSteps: 0, totalChanges: 0, errors: [] },
                    } // Mock result
                  : m,
              ),
            );
          } else if (event.event === "failed") {
            setIsExecuting(false);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === planMsgId
                  ? {
                      ...m,
                      content: `Task failed: ${event.data.error}`,
                      isLoading: false,
                    }
                  : m,
              ),
            );
          }
        });

        setIsPlanning(false);
        setIsExecuting(true);
      } catch (err) {
        setIsPlanning(false);
        setIsExecuting(false);
        console.error(err);
      }
    },
    [createTask],
  );

  const executePlan = useCallback(async (_planId: string) => {
    // Legacy stub
  }, []);

  const cancelPlan = useCallback(async (_planId: string) => {
    // Legacy stub
  }, []);

  const executeDiscussedPlan = useCallback(
    async (workspaceId: string, _modelId: string) => {
      if (messages.length === 0) return;

      setIsExecuting(true);

      // 1. Find tool calls from the AI's last response
      const lastAgentMessage = [...messages]
        .reverse()
        .find((m) => m.type === "agent" && !m.isLoading);

      if (!lastAgentMessage) {
        setIsExecuting(false);
        return;
      }

      const content = lastAgentMessage.content;
      console.log("[executeDiscussedPlan] Parsing from AI response:", content);

      // Parse tool calls using regex patterns like: write_file("path", "content")
      const toolCalls: Array<{
        skill: string;
        method: string;
        params: Record<string, any>;
      }> = [];

      // Pattern: write_file("path", "content") or write_file("path", content)
      const writeFileRegex =
        /write_file\s*\(\s*["']([^"']+)["']\s*,\s*["']?([^)]*?)["']?\s*\)/gi;
      let match;
      while ((match = writeFileRegex.exec(content)) !== null) {
        toolCalls.push({
          skill: "filesystem",
          method: "write_file",
          params: {
            path: match[1],
            content: match[2] || "// Auto-generated file\n",
          },
        });
      }

      // Pattern: read_file("path")
      const readFileRegex = /read_file\s*\(\s*["']([^"']+)["']\s*\)/gi;
      while ((match = readFileRegex.exec(content)) !== null) {
        toolCalls.push({
          skill: "filesystem",
          method: "read_file",
          params: { path: match[1] },
        });
      }

      // Pattern: list_files("path")
      const listFilesRegex = /list_files\s*\(\s*["']([^"']+)["']\s*\)/gi;
      while ((match = listFilesRegex.exec(content)) !== null) {
        toolCalls.push({
          skill: "filesystem",
          method: "list_files",
          params: { path: match[1] },
        });
      }

      console.log("[executeDiscussedPlan] Parsed tool calls:", toolCalls);

      if (toolCalls.length === 0) {
        // No parseable tools, add error message
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            type: "agent",
            content:
              "❌ Could not find any executable operations in the plan. Please ask the AI to use write_file, read_file, or list_files commands.",
            isLoading: false,
            timestamp: new Date(),
          },
        ]);
        setIsExecuting(false);
        return;
      }

      // 2. Create execution status message
      const statusMsgId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        {
          id: statusMsgId,
          type: "agent",
          content: `Executing ${toolCalls.length} operation(s)...`,
          isLoading: true,
          timestamp: new Date(),
        },
      ]);

      try {
        // 3. Execute each tool
        const results: {
          call: (typeof toolCalls)[0];
          result: tauri.CommandResult;
        }[] = [];

        for (const call of toolCalls) {
          console.log("[executeDiscussedPlan] Executing:", call);

          setMessages((prev) =>
            prev.map((m) =>
              m.id === statusMsgId
                ? {
                    ...m,
                    content: `⏳ ${call.method}("${call.params.path}")...`,
                  }
                : m,
            ),
          );

          const result = await tauri.executeSkill(
            workspaceId,
            call.skill,
            call.method,
            call.params,
            workspaceId, // Pass workspacePath for local path resolution
          );

          console.log("[executeDiscussedPlan] Result:", result);
          results.push({ call, result });

          if (!result.success) {
            throw new Error(
              `Failed: ${call.method}("${call.params.path}"): ${result.error}`,
            );
          }
        }

        // 4. Success message
        const successDetails = results
          .map((r) => `✅ ${r.call.method}("${r.call.params.path}")`)
          .join("\n");

        setMessages((prev) =>
          prev.map((m) =>
            m.id === statusMsgId
              ? {
                  ...m,
                  content: `**Execution Complete**\n\n${successDetails}`,
                  isLoading: false,
                }
              : m,
          ),
        );
      } catch (err: any) {
        console.error("[executeDiscussedPlan] Error:", err);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === statusMsgId
              ? {
                  ...m,
                  content: `❌ ${err.message}`,
                  isLoading: false,
                }
              : m,
          ),
        );
      } finally {
        setIsExecuting(false);
      }
    },
    [messages],
  );

  return {
    messages,
    isPlanning,
    isExecuting,
    currentPlan,
    sendInstruction,
    streamChat,
    executePlan,
    cancelPlan,
    executeDiscussedPlan,
    clearMessages,
  };
}
