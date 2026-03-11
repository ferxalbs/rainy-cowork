import { useCallback, useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import {
  getPendingMcpApprovals,
  respondToMcpApproval,
  type McpApprovalRequest,
} from "../services/tauri";

export function useMcpApprovals() {
  const [pendingApprovals, setPendingApprovals] = useState<McpApprovalRequest[]>(
    [],
  );

  useEffect(() => {
    const addApproval = (approval: McpApprovalRequest) => {
      setPendingApprovals((prev) => {
        if (prev.some((item) => item.approvalId === approval.approvalId)) {
          return prev;
        }
        return [...prev, approval];
      });
    };

    const removeApproval = (approvalId: string) => {
      setPendingApprovals((prev) =>
        prev.filter((item) => item.approvalId !== approvalId),
      );
    };

    const unlistenRequired = listen<McpApprovalRequest>(
      "mcp:approval_required",
      (event) => addApproval(event.payload),
    );
    const unlistenResolved = listen<string>("mcp:approval_resolved", (event) =>
      removeApproval(event.payload),
    );

    getPendingMcpApprovals()
      .then((approvals) => approvals.forEach(addApproval))
      .catch((error) => {
        console.error("Failed to load pending MCP approvals:", error);
      });

    return () => {
      unlistenRequired.then((fn) => fn());
      unlistenResolved.then((fn) => fn());
    };
  }, []);

  const respond = useCallback(async (approvalId: string, approved: boolean) => {
    await respondToMcpApproval(approvalId, approved);
    setPendingApprovals((prev) =>
      prev.filter((item) => item.approvalId !== approvalId),
    );
  }, []);

  return { pendingApprovals, respond };
}
