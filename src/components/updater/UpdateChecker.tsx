import { useEffect, useState, useRef } from "react";
import { check, Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { MandatoryUpdateOverlay } from "./MandatoryUpdateOverlay";

type UpdatePhase =
  | "checking"
  | "available"
  | "downloading"
  | "installing"
  | "ready"
  | "idle"
  | "error";

/**
 * Mandatory update checker — renders a non-dismissable overlay when an update is available.
 * All updates are required; users cannot skip or close this modal.
 * Mount this component at the root of your app (e.g., in App.tsx).
 */
export function UpdateChecker() {
  const [phase, setPhase] = useState<UpdatePhase>("checking");
  const [update, setUpdate] = useState<Update | null>(null);
  const [progress, setProgress] = useState<{
    downloaded: number;
    total: number | null;
  }>({ downloaded: 0, total: null });
  const [errorMsg, setErrorMsg] = useState<string>("");
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;
    checkForUpdate();
  }, []);

  async function checkForUpdate() {
    try {
      setPhase("checking");
      const found = await check();
      if (found) {
        setUpdate(found);
        setPhase("available");
      } else {
        setPhase("idle");
      }
    } catch (err) {
      console.error("[Updater] Check failed:", err);
      // Don't block app usage if the check itself fails (e.g., offline)
      setPhase("idle");
    }
  }

  async function handleInstallUpdate() {
    if (!update) return;
    try {
      setPhase("downloading");
      await update.downloadAndInstall((event) => {
        if (event.event === "Started") {
          setProgress({
            downloaded: 0,
            total: event.data.contentLength ?? null,
          });
        } else if (event.event === "Progress") {
          setProgress((prev) => ({
            ...prev,
            downloaded: prev.downloaded + (event.data.chunkLength ?? 0),
          }));
        } else if (event.event === "Finished") {
          setPhase("installing");
        }
      });
      setPhase("ready");
      setTimeout(async () => {
        await relaunch();
      }, 1500);
    } catch (err) {
      console.error("[Updater] Install failed:", err);
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setPhase("error");
    }
  }

  async function handleRetry() {
    setErrorMsg("");
    setProgress({ downloaded: 0, total: null });
    hasChecked.current = false;
    await checkForUpdate();
  }

  // Don't render anything if no update or still checking
  if (phase === "idle" || phase === "checking") return null;

  const progressPercent =
    progress.total && progress.total > 0
      ? Math.round((progress.downloaded / progress.total) * 100)
      : null;

  return (
    <MandatoryUpdateOverlay
      phase={
        phase as "available" | "downloading" | "installing" | "ready" | "error"
      }
      currentVersion={update?.currentVersion ?? ""}
      newVersion={update?.version ?? ""}
      progressPercent={progressPercent}
      errorMsg={errorMsg}
      onInstall={handleInstallUpdate}
      onRetry={handleRetry}
    />
  );
}
