import { Modal, Button } from "@heroui/react";
import { useAirlock } from "../../hooks";
import { ShieldCheck, ShieldAlert, Check, X } from "lucide-react";
import { AirlockLevel } from "../../types";

export function AirlockEvents() {
  const { pendingRequests, respond } = useAirlock();

  if (pendingRequests.length === 0) return null;

  // Process the first request in the queue
  const request = pendingRequests[0];

  // Format info
  const isDangerous = request.airlockLevel === AirlockLevel.Dangerous;

  // Try to format JSON payload if possible
  let formattedPayload = request.payloadSummary;
  try {
    const parsed = JSON.parse(request.payloadSummary);
    formattedPayload = JSON.stringify(parsed, null, 2);
  } catch (e) {
    // Keep as is
  }

  return (
    <Modal.Backdrop
      isOpen={true}
      onOpenChange={() => {}}
      className="backdrop-blur-3xl bg-black/60"
    >
      <Modal.Container>
        <Modal.Dialog
          className={`border shadow-2xl ${
            isDangerous
              ? "border-red-500/20 shadow-[0_0_50px_-12px_rgba(239,68,68,0.3)] bg-zinc-900/90"
              : "border-yellow-500/20 shadow-[0_0_50px_-12px_rgba(234,179,8,0.2)] bg-zinc-900/90"
          }`}
        >
          <Modal.Header>
            <div className="flex items-center gap-2">
              {isDangerous ? (
                <ShieldAlert className="text-red-500 size-6" />
              ) : (
                <ShieldCheck className="text-yellow-500 size-6" />
              )}
              <Modal.Heading className="text-xl font-bold">
                {isDangerous
                  ? "Dangerous Operation"
                  : "Authentication Required"}
              </Modal.Heading>
            </div>
          </Modal.Header>

          <Modal.Body>
            <div className="space-y-4">
              <p className="text-default-600">
                An agent is requesting permission to execute the following
                action:
              </p>

              <div className="bg-black/40 p-4 rounded-xl space-y-3 border border-white/5">
                <div className="flex justify-between items-center text-sm text-foreground/80 border-b border-white/5 pb-2">
                  <span>Command ID:</span>
                  <span className="font-mono text-xs opacity-70">
                    {request.commandId}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm text-foreground/80 border-b border-white/5 pb-2">
                  <span>Intent:</span>
                  <span
                    className={`uppercase font-bold tracking-wider text-[10px] px-2 py-0.5 rounded border ${
                      isDangerous
                        ? "bg-red-500/10 text-red-500 border-red-500/20"
                        : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                    }`}
                  >
                    {request.intent}
                  </span>
                </div>

                <div className="mt-2 text-left">
                  <p className="text-xs mb-1 text-muted-foreground font-medium ml-1">
                    Payload:
                  </p>
                  <pre className="w-full whitespace-pre-wrap max-h-60 overflow-y-auto block p-3 text-[10px] leading-relaxed font-mono bg-black/50 text-foreground/90 rounded-lg border border-white/5">
                    {formattedPayload}
                  </pre>
                </div>
              </div>

              {isDangerous && (
                <div className="flex gap-2 items-start text-red-500 text-sm font-medium border border-red-500/20 bg-red-500/10 p-3 rounded-lg">
                  <ShieldAlert className="size-5 flex-shrink-0 mt-0.5" />
                  <p>
                    This action can modify system state or files. Only approve
                    if you are sure about the agent's intent.
                  </p>
                </div>
              )}
            </div>
          </Modal.Body>

          <Modal.Footer>
            <div className="flex gap-2 justify-end w-full">
              <Button
                variant="secondary"
                onPress={() => respond(request.commandId, false)}
                className="text-red-500 hover:text-red-600"
              >
                <X className="size-4 mr-2" />
                Reject
              </Button>
              <Button
                variant="primary"
                onPress={() => respond(request.commandId, true)}
                className={isDangerous ? "bg-red-600 hover:bg-red-700" : ""}
              >
                <Check className="size-4 mr-2" />
                {isDangerous ? "Authorize Execution" : "Approve Action"}
              </Button>
            </div>
          </Modal.Footer>
        </Modal.Dialog>
      </Modal.Container>
    </Modal.Backdrop>
  );
}
