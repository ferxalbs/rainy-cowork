import { useState, useEffect, useCallback } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { ApprovalRequest } from "../types";

export function useAirlock() {
  const [pendingRequests, setPendingRequests] = useState<ApprovalRequest[]>([]);

  useEffect(() => {
    // Listen for new requests
    const unlistenNew = listen<ApprovalRequest>(
      "airlock:approval_required",
      (event) => {
        console.log("Airlock Request:", event.payload);
        setPendingRequests((prev) => {
          // Prevent duplicates
          if (prev.some((r) => r.commandId === event.payload.commandId))
            return prev;
          return [...prev, event.payload];
        });
      },
    );

    // Listen for resolved/timed-out requests (cleanup)
    const unlistenResolved = listen<string>(
      "airlock:approval_resolved",
      (event) => {
        const commandId = event.payload;
        console.log("Airlock Resolved:", commandId);
        setPendingRequests((prev) =>
          prev.filter((r) => r.commandId !== commandId),
        );
      },
    );

    // Check for existing pending requests on mount
    invoke<ApprovalRequest[]>("get_pending_airlock_approvals")
      .then((requests) => {
        if (!requests || requests.length === 0) return;

        setPendingRequests((prev) => {
          const existingIds = new Set(prev.map((r) => r.commandId));
          const next = [...prev];
          for (const request of requests) {
            if (!existingIds.has(request.commandId)) {
              next.push(request);
            }
          }
          return next;
        });
      })
      .catch((e) => console.error("Failed to check pending approvals:", e));

    return () => {
      unlistenNew.then((f) => f());
      unlistenResolved.then((f) => f());
    };
  }, []);

  const respond = useCallback(async (commandId: string, approved: boolean) => {
    try {
      await invoke("respond_to_airlock", { commandId, approved });
      setPendingRequests((prev) =>
        prev.filter((r) => r.commandId !== commandId),
      );
    } catch (e) {
      console.error("Failed to respond to airlock:", e);
    }
  }, []);

  return {
    pendingRequests,
    respond,
  };
}
