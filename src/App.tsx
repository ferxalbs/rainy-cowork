import { useState, useCallback, useEffect } from "react";
import {
  TahoeLayout,
  SettingsPanel,
  AIDocumentPanel,
  AIResearchPanel,
} from "./components";
import { SettingsPage } from "./components/settings";
import { AgentChatPanel } from "./components/agent-chat/AgentChatPanel";
import { Button, Card } from "@heroui/react";
import { AlertCircle, FolderPlus } from "lucide-react";
import { useAIProvider, useFolderManager } from "./hooks";
import type { Folder } from "./types";
import * as tauri from "./services/tauri";

function App() {
  const { refreshProviders } = useAIProvider();

  // Folder management hook
  const {
    folders: userFolders,
    addFolder,
    refreshFolders,
  } = useFolderManager();

  // Convert UserFolder to Folder type for sidebar
  const folders: Folder[] = userFolders.map((uf) => ({
    id: uf.id,
    path: uf.path,
    name: uf.name,
    accessType: uf.accessType,
  }));

  const [activeSection, setActiveSection] = useState("agent-chat");
  const [activeFolder, setActiveFolder] = useState<Folder | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Inspector State
  const [inspector, setInspector] = useState<{
    title?: string;
    type?: "preview" | "info" | "process" | "links";
    content?: string;
    filename?: string;
  }>({
    title: "System Status",
    type: "info",
  });

  // @ts-ignore - Reserved for future file preview implementation
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const showPreview = useCallback((filename: string, content: string) => {
    setInspector({
      title: "File Preview",
      type: "preview",
      content,
      filename,
    });
  }, []);

  // Load providers on mount
  useEffect(() => {
    refreshProviders();
  }, [refreshProviders]);

  // Handle folder selection
  const handleFolderSelect = useCallback(
    async (folder: Folder) => {
      try {
        await tauri.setWorkspace(folder.path, folder.name);
        await tauri.updateFolderAccess(folder.id);
        setActiveFolder(folder);
        refreshFolders();
        console.log("Workspace set:", folder);
      } catch (err) {
        console.error("Failed to set workspace:", err);
      }
    },
    [refreshFolders],
  );

  // Auto-select first folder when folders are loaded
  useEffect(() => {
    if (folders.length > 0 && !activeFolder) {
      handleFolderSelect(folders[0]);
    }
  }, [folders, activeFolder, handleFolderSelect]);

  // Handle navigation
  const handleNavigate = useCallback((section: string) => {
    setActiveSection(section);
  }, []);

  // Handle settings click from sidebar
  const handleSettingsClick = useCallback(() => {
    setSettingsOpen(true);
  }, []);

  // Check if we're in Settings section
  const isSettingsSection = activeSection.startsWith("settings-");
  const settingsTab = isSettingsSection
    ? activeSection.replace("settings-", "")
    : "models";

  return (
    <>
      <TahoeLayout
        folders={folders}
        activeFolderId={activeFolder?.id}
        workspacePath={activeFolder?.path}
        onFolderSelect={handleFolderSelect}
        onAddFolder={addFolder}
        onNavigate={handleNavigate}
        onSettingsClick={handleSettingsClick}
        activeSection={activeSection}
        inspectorTitle={inspector.title}
        inspectorType={inspector.type}
        inspectorContent={inspector.content}
        inspectorFilename={inspector.filename}
        isImmersive={
          !isSettingsSection &&
          activeSection !== "documents" &&
          activeSection !== "research"
        }
      >
        {/* Main Content Area - Dynamic based on section */}
        <div className="h-full w-full flex flex-col">
          {/* Error Display */}
          {submitError && (
            <div className="p-4 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 rounded-xl m-4">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <AlertCircle className="size-4 shrink-0" />
                <p className="text-sm">{submitError}</p>
                <Button
                  variant="secondary"
                  size="sm"
                  className="ml-auto"
                  onPress={() => {
                    setSubmitError(null);
                  }}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          )}

          {/* AI Documents */}
          {activeSection === "documents" && (
            <div className="flex-1 p-6">
              {activeFolder ? (
                <AIDocumentPanel />
              ) : (
                <NoFolderGate onAddFolder={addFolder} />
              )}
            </div>
          )}

          {/* AI Research */}
          {activeSection === "research" && (
            <div className="flex-1 p-6">
              {activeFolder ? (
                <AIResearchPanel />
              ) : (
                <NoFolderGate onAddFolder={addFolder} />
              )}
            </div>
          )}

          {/* Settings Section */}
          {isSettingsSection && (
            <div className="flex-1 overflow-auto">
              <SettingsPage
                initialTab={settingsTab}
                onBack={() => handleNavigate("agent-chat")}
              />
            </div>
          )}

          {/* Agent Chat Main View - Full Height */}
          {activeSection === "agent-chat" && (
            <div className="flex-1 h-full min-h-0">
              {activeFolder ? (
                <AgentChatPanel
                  workspacePath={activeFolder.path}
                  onOpenSettings={() => setSettingsOpen(true)}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <NoFolderGate onAddFolder={addFolder} />
                </div>
              )}
            </div>
          )}
        </div>
      </TahoeLayout>

      {/* Settings Modal */}
      <SettingsPanel
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  );
}

/**
 * Gate component shown when no folder is selected.
 * Prompts user to select a project folder before using the system.
 */
function NoFolderGate({ onAddFolder }: { onAddFolder: () => void }) {
  return (
    <Card className="p-12 text-center animate-appear bg-sidebar/30 backdrop-blur-2xl border-white/5 shadow-2xl max-w-lg mx-auto">
      <div className="space-y-4">
        <div className="size-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center">
          <FolderPlus className="size-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">
            Select a Project Folder
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            To get started, select a folder where Rainy Cowork will work. All
            files, documents, and AI-generated content will be saved there.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          onPress={onAddFolder}
          className="mt-2 font-medium"
        >
          <FolderPlus className="size-4" />
          Add Folder
        </Button>
      </div>
    </Card>
  );
}

export default App;
