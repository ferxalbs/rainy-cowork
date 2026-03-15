import { useState } from "react";
import { Tooltip, Button, Separator } from "@heroui/react";
import {
  Bot,
  Check,
  ChevronLeft,
  ChevronRight,
  CpuIcon,
  Download,
  FileCode,
  FolderOpen,
  Library,
  MessageSquare,
  Network,
  Palette,
  Plus,
  RefreshCw,
  Settings,
  Sparkles,
  AlertCircle,
  MessagesSquare,
} from "lucide-react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

import type { Folder } from "../../types";
import { MandatoryUpdateOverlay } from "../updater/MandatoryUpdateOverlay";

interface AppSidebarProps {
  folders?: Folder[];
  onFolderSelect?: (folder: Folder) => void;
  onAddFolder?: () => void;
  onNavigate?: (section: string) => void;
  activeSection?: string;
  activeFolderId?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onSettingsClick?: () => void;
}

type UpdateStatus =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "up-to-date"
  | "error";

const folderIcons: Record<string, any> = {
  Documents: FolderOpen,
  Downloads: Download,
  Projects: FileCode,
};

const primaryNav = [
  { id: "agent-chat", label: "Agent Chat", icon: MessageSquare, accent: "text-sky-400" },
  { id: "neural-link", label: "Rainy ATM", icon: Network, accent: "text-emerald-400" },
  { id: "agent-builder", label: "Agent Builder", icon: Bot, accent: "text-amber-400" },
  { id: "agent-store", label: "Agents Store", icon: Library, accent: "text-orange-400" },
  { id: "wasm-skills", label: "Wasm Skills", icon: CpuIcon, accent: "text-cyan-400" },
];

function SidebarNavItem({
  id,
  label,
  icon: Icon,
  accent,
  isActive,
  isCollapsed,
  onNavigate,
}: {
  id: string;
  label: string;
  icon: any;
  accent: string;
  isActive: boolean;
  isCollapsed: boolean;
  onNavigate?: (id: string) => void;
}) {
  const content = (
    <Button
      variant="ghost"
      isIconOnly={isCollapsed}
      className={`transition-all duration-200 ${isCollapsed ? "mx-auto h-10 w-10 rounded-2xl" : "h-11 w-full justify-start gap-3 rounded-2xl px-3"} ${
        isActive
          ? "bg-white/10 text-foreground shadow-sm"
          : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
      }`}
      onPress={() => onNavigate?.(id)}
    >
      <Icon className={`size-4 shrink-0 ${isActive ? "text-foreground" : accent}`} />
      {!isCollapsed && <span className="truncate text-sm font-medium">{label}</span>}
    </Button>
  );

  if (isCollapsed) {
    return (
      <Tooltip delay={0}>
        {content}
        <Tooltip.Content placement="right">{label}</Tooltip.Content>
      </Tooltip>
    );
  }

  return content;
}

function WorkspaceButton({
  folder,
  isActive,
  isCollapsed,
  onSelect,
}: {
  folder: Folder;
  isActive: boolean;
  isCollapsed: boolean;
  onSelect?: (folder: Folder) => void;
}) {
  const Icon = folderIcons[folder.name] || FolderOpen;

  const content = (
    <Button
      variant="ghost"
      isIconOnly={isCollapsed}
      className={`transition-all duration-200 ${isCollapsed ? "mx-auto h-10 w-10 rounded-2xl" : "h-auto w-full justify-start gap-3 rounded-2xl px-3 py-3"} ${
        isActive
          ? "bg-white/10 text-foreground shadow-sm"
          : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
      }`}
      onPress={() => onSelect?.(folder)}
    >
      <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-white/8">
        <Icon className={`size-4 ${isActive ? "text-foreground" : "text-primary"}`} />
      </div>
      {!isCollapsed && (
        <div className="min-w-0 flex-1 text-left">
          <div className="truncate text-sm font-medium text-foreground">{folder.name}</div>
          <div className="truncate text-[11px] text-muted-foreground">{folder.path}</div>
        </div>
      )}
    </Button>
  );

  if (isCollapsed) {
    return (
      <Tooltip delay={0}>
        {content}
        <Tooltip.Content placement="right">{folder.name}</Tooltip.Content>
      </Tooltip>
    );
  }

  return content;
}

export function AppSidebar({
  folders = [],
  onFolderSelect,
  onAddFolder,
  onNavigate,
  activeSection = "agent-chat",
  activeFolderId,
  isCollapsed = false,
  onToggleCollapse,
  onSettingsClick,
}: AppSidebarProps) {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>("idle");
  const [updateVersion, setUpdateVersion] = useState("");
  const [currentVersion, setCurrentVersion] = useState("");
  const [pendingUpdate, setPendingUpdate] = useState<Awaited<ReturnType<typeof check>> | null>(
    null,
  );
  const [downloadProgress, setDownloadProgress] = useState<{
    downloaded: number;
    total: number | null;
  }>({ downloaded: 0, total: null });
  const [errorMsg, setErrorMsg] = useState("");

  const handleCheckUpdate = async () => {
    if (updateStatus === "checking" || updateStatus === "downloading") return;
    setUpdateStatus("checking");
    setErrorMsg("");
    try {
      const update = await check();
      if (update) {
        setUpdateVersion(update.version);
        setCurrentVersion(update.currentVersion);
        setPendingUpdate(update);
        setUpdateStatus("available");
      } else {
        setUpdateStatus("up-to-date");
        setTimeout(() => setUpdateStatus("idle"), 3000);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setUpdateStatus("error");
      setTimeout(() => setUpdateStatus("idle"), 3000);
    }
  };

  const handleInstallUpdate = async () => {
    if (!pendingUpdate) return;
    setUpdateStatus("downloading");
    setDownloadProgress({ downloaded: 0, total: null });
    try {
      await pendingUpdate.downloadAndInstall((event) => {
        if (event.event === "Started") {
          setDownloadProgress({
            downloaded: 0,
            total: event.data.contentLength ?? null,
          });
        } else if (event.event === "Progress") {
          setDownloadProgress((prev) => ({
            ...prev,
            downloaded: prev.downloaded + (event.data.chunkLength ?? 0),
          }));
        }
      });
      await relaunch();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setUpdateStatus("error");
    }
  };

  const handleRetryUpdate = async () => {
    setErrorMsg("");
    setDownloadProgress({ downloaded: 0, total: null });
    await handleCheckUpdate();
  };

  const showMandatoryOverlay =
    updateStatus === "available" ||
    updateStatus === "downloading" ||
    (updateStatus === "error" && pendingUpdate !== null);

  const progressPercent =
    downloadProgress.total && downloadProgress.total > 0
      ? Math.round((downloadProgress.downloaded / downloadProgress.total) * 100)
      : null;

  return (
    <>
      <aside
        className={`z-30 flex h-full flex-col border-r border-border/50 bg-sidebar/92 backdrop-blur-2xl transition-all duration-300 ease-in-out ${
          isCollapsed ? "w-[88px]" : "w-[320px]"
        }`}
      >
        <div
          data-tauri-drag-region
          className={`mt-8 flex shrink-0 items-center overflow-hidden px-4 pb-4 ${
            isCollapsed ? "justify-center" : "gap-3"
          }`}
        >
          <div
            className="size-9 shrink-0 bg-foreground"
            style={{
              maskImage: `url(/whale-dnf.png)`,
              maskSize: "contain",
              maskRepeat: "no-repeat",
              maskPosition: "center",
              WebkitMaskImage: `url(/whale-dnf.png)`,
              WebkitMaskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
            }}
          />
          {!isCollapsed && (
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold tracking-tight text-foreground">
                Rainy MaTE
              </div>
              <div className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground/70">
                Chat shell
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto overflow-x-hidden px-3 pb-3 scrollbar-hide">
          <div className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/60">
                Core
              </div>
            )}
            {primaryNav.map((item) => (
              <SidebarNavItem
                key={item.id}
                id={item.id}
                label={item.label}
                icon={item.icon}
                accent={item.accent}
                isActive={activeSection === item.id}
                isCollapsed={isCollapsed}
                onNavigate={onNavigate}
              />
            ))}
          </div>

          {!isCollapsed && (
            <div className="rounded-[24px] border border-white/10 bg-background/40 p-4 shadow-[0_16px_40px_rgba(0,0,0,0.08)] backdrop-blur-xl">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex size-9 items-center justify-center rounded-2xl bg-white/10 text-primary">
                  <MessagesSquare className="size-4" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">Conversation system</div>
                  <div className="text-[11px] text-muted-foreground">Foundation for dynamic chats</div>
                </div>
              </div>
              <p className="text-xs leading-5 text-muted-foreground">
                Today this shell still runs one persistent conversation. The layout is already preparing
                dedicated chat history, faster switching, and thread-level organization.
              </p>
              <Button
                variant="ghost"
                className="mt-3 w-full justify-start rounded-2xl border border-white/10 bg-white/5 text-foreground hover:bg-white/10"
                onPress={() => onNavigate?.("agent-chat")}
              >
                <Sparkles className="size-4 text-primary" />
                Open chat workspace
              </Button>
            </div>
          )}

          <div className="space-y-2">
            {!isCollapsed && (
              <div className="flex items-center justify-between px-3 py-1">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/60">
                  Recent workspaces
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  isIconOnly
                  onPress={onAddFolder}
                  className="h-7 w-7 min-w-7 rounded-full text-muted-foreground hover:bg-white/10 hover:text-foreground"
                >
                  <Plus className="size-3.5" />
                </Button>
              </div>
            )}

            {folders.length > 0 ? (
              <div className="space-y-1">
                {folders.map((folder) => (
                  <WorkspaceButton
                    key={folder.id}
                    folder={folder}
                    isActive={folder.id === activeFolderId}
                    isCollapsed={isCollapsed}
                    onSelect={onFolderSelect}
                  />
                ))}
              </div>
            ) : (
              !isCollapsed && (
                <div className="rounded-[24px] border border-dashed border-white/10 bg-background/30 px-4 py-5 text-center">
                  <div className="text-xs text-muted-foreground">No workspaces yet</div>
                  <Button
                    size="sm"
                    onPress={onAddFolder}
                    className="mt-3 rounded-full bg-background/50 text-foreground hover:bg-white/10"
                  >
                    Add first workspace
                  </Button>
                </div>
              )
            )}
          </div>
        </div>

        <div className="mt-auto p-3">
          <Separator className="bg-border/30" />
          <div className={`mt-3 ${isCollapsed ? "space-y-2" : "space-y-3"}`}>
            {!isCollapsed && (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="ghost"
                  className="justify-start rounded-2xl text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  onPress={() => onNavigate?.("settings-models")}
                >
                  <Sparkles className="size-4" />
                  AI Provider
                </Button>
                <Button
                  variant="ghost"
                  className="justify-start rounded-2xl text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  onPress={() => onNavigate?.("settings-appearance")}
                >
                  <Palette className="size-4" />
                  Appearance
                </Button>
              </div>
            )}

            {(() => {
              const isChecking = updateStatus === "checking";
              const isAvailable = updateStatus === "available";
              const isDownloading = updateStatus === "downloading";
              const isUpToDate = updateStatus === "up-to-date";
              const isError = updateStatus === "error";

              const UpdateIcon = isUpToDate
                ? Check
                : isError
                  ? AlertCircle
                  : isAvailable
                    ? Download
                    : RefreshCw;

              const label = isChecking
                ? "Checking…"
                : isAvailable
                  ? `Update v${updateVersion}`
                  : isDownloading
                    ? "Installing…"
                    : isUpToDate
                      ? "Up to date"
                      : isError
                        ? "Check failed"
                        : "Check updates";

              const handlePress = isAvailable ? handleInstallUpdate : handleCheckUpdate;

              const content = (
                <Button
                  variant="ghost"
                  isIconOnly={isCollapsed}
                  isDisabled={isChecking || isDownloading}
                  className={`${
                    isCollapsed
                      ? "mx-auto h-10 w-10 rounded-2xl"
                      : "h-11 w-full justify-start gap-3 rounded-2xl px-3"
                  } ${
                    isAvailable
                      ? "bg-white/10 text-foreground"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  }`}
                  onPress={handlePress}
                >
                  <UpdateIcon className={`size-4 ${isChecking || isDownloading ? "animate-spin" : ""}`} />
                  {!isCollapsed && <span className="truncate text-sm">{label}</span>}
                </Button>
              );

              if (isCollapsed) {
                return (
                  <Tooltip delay={0}>
                    {content}
                    <Tooltip.Content placement="right">{label}</Tooltip.Content>
                  </Tooltip>
                );
              }

              return content;
            })()}

            <div className={`flex items-center ${isCollapsed ? "flex-col gap-2" : "justify-between"}`}>
              <Button
                variant="ghost"
                size="sm"
                isIconOnly
                onPress={onSettingsClick}
                className="rounded-full text-muted-foreground hover:bg-white/10 hover:text-foreground"
              >
                <Settings className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                isIconOnly
                onPress={onToggleCollapse}
                className="rounded-full text-muted-foreground hover:bg-white/10 hover:text-foreground"
              >
                {isCollapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
              </Button>
            </div>
          </div>
        </div>
      </aside>

      {showMandatoryOverlay && (
        <MandatoryUpdateOverlay
          phase={
            updateStatus === "downloading"
              ? "downloading"
              : updateStatus === "error"
                ? "error"
                : "available"
          }
          currentVersion={currentVersion}
          newVersion={updateVersion}
          progressPercent={progressPercent}
          errorMsg={updateStatus === "error" ? errorMsg : ""}
          onInstall={() => {
            void handleInstallUpdate();
          }}
          onRetry={() => {
            void handleRetryUpdate();
          }}
        />
      )}
    </>
  );
}
