import { Button, Spinner } from "@heroui/react";
import { Download } from "lucide-react";

type OverlayPhase =
  | "available"
  | "downloading"
  | "installing"
  | "ready"
  | "error";

interface MandatoryUpdateOverlayProps {
  phase: OverlayPhase;
  currentVersion: string;
  newVersion: string;
  progressPercent: number | null;
  errorMsg: string;
  onInstall: () => void;
  onRetry: () => void;
}

/**
 * Mandatory update overlay — non-dismissable fullscreen blocker.
 * Uses HeroUI components for buttons and spinners.
 * All updates are required; users cannot skip or close this overlay.
 */
export function MandatoryUpdateOverlay({
  phase,
  currentVersion,
  newVersion,
  progressPercent,
  errorMsg,
  onInstall,
  onRetry,
}: MandatoryUpdateOverlayProps) {
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-background/60 dark:bg-background/20 backdrop-blur-2xl">
      <div className="w-full max-w-md mx-4 p-8 rounded-2xl bg-content1 border border-divider shadow-2xl text-center space-y-5">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="size-14 rounded-2xl bg-success/10 flex items-center justify-center">
            <Download className="size-7 text-success" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-foreground">Update Required</h2>

        {/* Available */}
        {phase === "available" && (
          <div className="space-y-4">
            <p className="text-sm text-foreground-500">
              A new version of{" "}
              <strong className="text-foreground">Rainy MaTE</strong> is
              available.
            </p>

            {/* Version comparison */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-4 py-2.5 rounded-xl bg-default-100">
                <span className="text-xs text-foreground-400">Current</span>
                <span className="text-xs font-semibold font-mono text-foreground-500">
                  {currentVersion}
                </span>
              </div>
              <div className="flex justify-between items-center px-4 py-2.5 rounded-xl bg-default-100">
                <span className="text-xs text-foreground-400">New</span>
                <span className="text-xs font-semibold font-mono text-success">
                  {newVersion}
                </span>
              </div>
            </div>

            <Button
              variant="primary"
              className="w-full bg-success text-white font-semibold shadow-lg shadow-success/25"
              size="lg"
              onPress={onInstall}
            >
              Update Now
            </Button>

            <p className="text-[10px] text-foreground-400 italic">
              This update is required to continue using the app.
            </p>
          </div>
        )}

        {/* Downloading */}
        {phase === "downloading" && (
          <div className="space-y-4">
            <p className="text-sm text-foreground-500">Downloading update...</p>
            <div className="w-full h-1.5 rounded-full bg-default-200 overflow-hidden">
              <div
                className={`h-full rounded-full bg-success transition-all duration-300 ${
                  progressPercent === null ? "animate-pulse w-3/5" : ""
                }`}
                style={
                  progressPercent !== null
                    ? { width: `${progressPercent}%` }
                    : undefined
                }
              />
            </div>
            {progressPercent !== null && (
              <p className="text-xs font-mono text-foreground-400">
                {progressPercent}%
              </p>
            )}
          </div>
        )}

        {/* Installing */}
        {phase === "installing" && (
          <div className="space-y-4">
            <p className="text-sm text-foreground-500">Installing update...</p>
            <div className="flex justify-center">
              <Spinner size="lg" />
            </div>
          </div>
        )}

        {/* Ready to relaunch */}
        {phase === "ready" && (
          <div className="space-y-4">
            <p className="text-sm text-foreground-500">
              Update installed! Restarting...
            </p>
            <div className="flex justify-center">
              <Spinner size="lg" />
            </div>
          </div>
        )}

        {/* Error */}
        {phase === "error" && (
          <div className="space-y-4">
            <p className="text-sm text-danger">Update failed</p>
            {errorMsg && (
              <p className="text-xs font-mono text-danger bg-danger/10 px-3 py-2 rounded-lg break-all text-left">
                {errorMsg}
              </p>
            )}
            <Button
              variant="primary"
              className="w-full bg-success text-white font-semibold shadow-lg shadow-success/25"
              size="lg"
              onPress={onRetry}
            >
              Retry
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
