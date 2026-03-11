import { Button, Modal } from "@heroui/react";
import { ShieldAlert, Server } from "lucide-react";
import { useMcpApprovals } from "../../hooks";

export function McpApprovalEvents() {
  const { pendingApprovals, respond } = useMcpApprovals();
  if (pendingApprovals.length === 0) return null;
  const request = pendingApprovals[0];

  let formattedArgs = request.argumentsSummary;
  try {
    formattedArgs = JSON.stringify(JSON.parse(request.argumentsSummary), null, 2);
  } catch {
    // Keep raw summary.
  }

  return (
    <Modal.Backdrop
      isOpen={true}
      onOpenChange={() => {}}
      className="backdrop-blur-2xl bg-black/60 z-50"
    >
      <Modal.Container>
        <Modal.Dialog className="max-w-xl w-full rounded-3xl border border-amber-500/20 bg-zinc-950/85 backdrop-blur-2xl overflow-hidden">
          <Modal.Header className="p-6 pb-3">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <ShieldAlert className="size-5" />
              </div>
              <div>
                <Modal.Heading className="text-white text-lg">
                  MCP Permission Required
                </Modal.Heading>
                <p className="text-[11px] text-white/60">{request.approvalId}</p>
              </div>
            </div>
          </Modal.Header>
          <Modal.Body className="px-6 pb-4 space-y-4">
            <div className="text-sm text-white/80">
              <p>
                Server:{" "}
                <span className="text-amber-300 font-medium">
                  {request.serverName}
                </span>
              </p>
              <p>
                Tool:{" "}
                <span className="text-amber-300 font-medium">{request.toolName}</span>
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/30">
              <div className="px-4 py-2 border-b border-white/10 text-[10px] tracking-wide uppercase text-white/50 flex items-center gap-2">
                <Server className="size-3" />
                Arguments
              </div>
              <pre className="max-h-64 overflow-auto p-4 text-xs text-white/85 whitespace-pre-wrap">
                {formattedArgs}
              </pre>
            </div>
          </Modal.Body>
          <Modal.Footer className="px-6 pb-6 pt-1">
            <div className="w-full flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                onPress={() => respond(request.approvalId, false)}
                className="text-white/70 hover:text-white"
              >
                Reject
              </Button>
              <Button
                onPress={() => respond(request.approvalId, true)}
                className="bg-amber-500 text-black hover:bg-amber-400 font-semibold"
              >
                Approve MCP Call
              </Button>
            </div>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
