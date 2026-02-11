import { useEffect, useState, useRef } from "react";
import { check, Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

type UpdatePhase =
  | "checking"
  | "available"
  | "downloading"
  | "installing"
  | "ready"
  | "idle"
  | "error";

interface DownloadProgress {
  downloaded: number;
  total: number | null;
}

/**
 * Mandatory update checker — renders a non-dismissable overlay when an update is available.
 * All updates are required; users cannot skip or close this modal.
 * Mount this component at the root of your app (e.g., in App.tsx).
 */
export function UpdateChecker() {
  const [phase, setPhase] = useState<UpdatePhase>("checking");
  const [update, setUpdate] = useState<Update | null>(null);
  const [progress, setProgress] = useState<DownloadProgress>({
    downloaded: 0,
    total: null,
  });
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

      // Auto-relaunch after a brief delay so user sees the "ready" state
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
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Logo / Icon */}
        <div style={styles.iconContainer}>
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "#4ade80" }}
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </div>

        <h2 style={styles.title}>Update Required</h2>

        {/* Available */}
        {phase === "available" && update && (
          <>
            <p style={styles.subtitle}>
              A new version of <strong>Rainy Cowork</strong> is available.
            </p>
            <div style={styles.versionRow}>
              <span style={styles.versionLabel}>Current</span>
              <span style={styles.versionValue}>{update.currentVersion}</span>
            </div>
            <div style={styles.versionRow}>
              <span style={styles.versionLabel}>New</span>
              <span style={{ ...styles.versionValue, color: "#4ade80" }}>
                {update.version}
              </span>
            </div>
            {update.body && (
              <div style={styles.releaseNotes}>
                <p style={styles.releaseNotesTitle}>Release Notes</p>
                <p style={styles.releaseNotesBody}>{update.body}</p>
              </div>
            )}
            <button style={styles.button} onClick={handleInstallUpdate}>
              Update Now
            </button>
            <p style={styles.mandatory}>
              This update is required to continue using the app.
            </p>
          </>
        )}

        {/* Downloading */}
        {phase === "downloading" && (
          <>
            <p style={styles.subtitle}>Downloading update...</p>
            <div style={styles.progressBarTrack}>
              <div
                style={{
                  ...styles.progressBarFill,
                  width:
                    progressPercent !== null ? `${progressPercent}%` : "60%",
                  animation:
                    progressPercent === null
                      ? "pulse 1.5s ease-in-out infinite"
                      : "none",
                }}
              />
            </div>
            {progressPercent !== null && (
              <p style={styles.progressText}>{progressPercent}%</p>
            )}
          </>
        )}

        {/* Installing */}
        {phase === "installing" && (
          <>
            <p style={styles.subtitle}>Installing update...</p>
            <div style={styles.spinner} />
          </>
        )}

        {/* Ready to relaunch */}
        {phase === "ready" && (
          <>
            <p style={styles.subtitle}>Update installed! Restarting...</p>
            <div style={styles.spinner} />
          </>
        )}

        {/* Error */}
        {phase === "error" && (
          <>
            <p style={{ ...styles.subtitle, color: "#f87171" }}>
              Update failed
            </p>
            {errorMsg && <p style={styles.errorDetail}>{errorMsg}</p>}
            <button style={styles.button} onClick={handleRetry}>
              Retry
            </button>
          </>
        )}
      </div>

      {/* Keyframes for pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    zIndex: 99999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
  },
  modal: {
    width: "100%",
    maxWidth: 420,
    padding: "2.5rem 2rem",
    borderRadius: 16,
    background: "linear-gradient(145deg, #0d1117 0%, #161b22 100%)",
    border: "1px solid rgba(74, 222, 128, 0.15)",
    boxShadow:
      "0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 80px rgba(74, 222, 128, 0.05)",
    textAlign: "center" as const,
    color: "#e6edf3",
    fontFamily: "'Inter', -apple-system, sans-serif",
  },
  iconContainer: {
    marginBottom: "1rem",
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: 700,
    margin: "0 0 0.5rem 0",
    color: "#ffffff",
  },
  subtitle: {
    fontSize: "0.9rem",
    color: "#8b949e",
    margin: "0 0 1.25rem 0",
    lineHeight: 1.5,
  },
  versionRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "0.5rem 1rem",
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.04)",
    marginBottom: "0.4rem",
  },
  versionLabel: {
    fontSize: "0.85rem",
    color: "#8b949e",
  },
  versionValue: {
    fontSize: "0.85rem",
    fontWeight: 600,
    fontFamily: "'SF Mono', 'Fira Code', monospace",
    color: "#e6edf3",
  },
  releaseNotes: {
    marginTop: "1rem",
    padding: "0.75rem 1rem",
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.06)",
    textAlign: "left" as const,
    maxHeight: 140,
    overflowY: "auto" as const,
  },
  releaseNotesTitle: {
    fontSize: "0.75rem",
    color: "#8b949e",
    margin: "0 0 0.35rem 0",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
  releaseNotesBody: {
    fontSize: "0.8rem",
    color: "#c9d1d9",
    margin: 0,
    lineHeight: 1.5,
    whiteSpace: "pre-wrap" as const,
  },
  button: {
    marginTop: "1.5rem",
    width: "100%",
    padding: "0.75rem 1.5rem",
    border: "none",
    borderRadius: 10,
    background: "linear-gradient(135deg, #22c55e 0%, #16a34a 100%)",
    color: "#ffffff",
    fontSize: "0.95rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "transform 0.15s, box-shadow 0.15s",
    boxShadow: "0 4px 14px rgba(34, 197, 94, 0.3)",
  },
  mandatory: {
    marginTop: "0.75rem",
    fontSize: "0.7rem",
    color: "#6e7681",
    fontStyle: "italic",
  },
  progressBarTrack: {
    width: "100%",
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
    background: "linear-gradient(90deg, #22c55e, #4ade80)",
    transition: "width 0.3s ease",
  },
  progressText: {
    marginTop: "0.5rem",
    fontSize: "0.85rem",
    color: "#8b949e",
    fontFamily: "'SF Mono', 'Fira Code', monospace",
  },
  spinner: {
    width: 32,
    height: 32,
    border: "3px solid rgba(74, 222, 128, 0.15)",
    borderTopColor: "#4ade80",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    margin: "1rem auto 0",
  },
  errorDetail: {
    fontSize: "0.8rem",
    color: "#f87171",
    backgroundColor: "rgba(248, 113, 113, 0.08)",
    padding: "0.5rem 0.75rem",
    borderRadius: 6,
    marginBottom: "0.5rem",
    fontFamily: "'SF Mono', 'Fira Code', monospace",
    wordBreak: "break-all" as const,
  },
};
