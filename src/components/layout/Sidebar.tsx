import { ListBox, Separator, Label } from "@heroui/react";
import {
    FolderOpen,
    Download,
    FileCode,
    CheckCircle2,
    Timer,
    ListTodo,
    Clock,
    Settings,
    Sparkles,
    Shield,
    Palette,
} from "lucide-react";
import type { Folder, TaskStatus } from "../../types";

interface SidebarProps {
    folders?: Folder[];
    onFolderSelect?: (folder: Folder) => void;
    onNavigate?: (section: string) => void;
    activeSection?: string;
    taskCounts?: {
        completed: number;
        running: number;
        queued: number;
    };
}

const defaultFolders: Folder[] = [
    { id: "1", path: "~/Documents", name: "Documents", accessType: "full-access" },
    { id: "2", path: "~/Downloads", name: "Downloads", accessType: "read-only" },
    { id: "3", path: "~/Projects", name: "Projects", accessType: "full-access" },
];

export function Sidebar({
    folders = defaultFolders,
    onFolderSelect,
    onNavigate,
    activeSection = "tasks",
    taskCounts = { completed: 0, running: 0, queued: 0 },
}: SidebarProps) {
    return (
        <aside className="flex flex-col w-56 h-full border-r border-border bg-sidebar">
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
                {/* Folders Section */}
                <section>
                    <Label className="px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        📁 Folders
                    </Label>
                    <ListBox
                        aria-label="Folders"
                        className="mt-2"
                        selectionMode="single"
                        onSelectionChange={(keys) => {
                            const selectedId = [...keys][0];
                            const folder = folders.find((f) => f.id === selectedId);
                            if (folder && onFolderSelect) {
                                onFolderSelect(folder);
                            }
                        }}
                    >
                        {folders.map((folder) => (
                            <ListBox.Item key={folder.id} id={folder.id} textValue={folder.name}>
                                <div className="flex items-center gap-2">
                                    {folder.name === "Documents" && <FolderOpen className="size-4" />}
                                    {folder.name === "Downloads" && <Download className="size-4" />}
                                    {folder.name === "Projects" && <FileCode className="size-4" />}
                                    {!["Documents", "Downloads", "Projects"].includes(folder.name) && (
                                        <FolderOpen className="size-4" />
                                    )}
                                    <span className="truncate">{folder.name}</span>
                                </div>
                            </ListBox.Item>
                        ))}
                    </ListBox>
                </section>

                <Separator />

                {/* Tasks Section */}
                <section>
                    <Label className="px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        📋 Tasks
                    </Label>
                    <ListBox
                        aria-label="Tasks"
                        className="mt-2"
                        selectionMode="single"
                        selectedKeys={[activeSection]}
                        onSelectionChange={(keys) => {
                            const selected = [...keys][0] as string;
                            if (onNavigate) {
                                onNavigate(selected);
                            }
                        }}
                    >
                        <ListBox.Item id="completed" textValue="Completed">
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="size-4 text-green-500" />
                                    <span>Completed</span>
                                </div>
                                {taskCounts.completed > 0 && (
                                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{taskCounts.completed}</span>
                                )}
                            </div>
                        </ListBox.Item>
                        <ListBox.Item id="running" textValue="Running">
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                    <Timer className="size-4 text-blue-500" />
                                    <span>Running</span>
                                </div>
                                {taskCounts.running > 0 && (
                                    <span className="text-xs bg-blue-500/20 text-blue-500 px-1.5 py-0.5 rounded">
                                        {taskCounts.running}
                                    </span>
                                )}
                            </div>
                        </ListBox.Item>
                        <ListBox.Item id="queued" textValue="Queued">
                            <div className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                    <ListTodo className="size-4 text-orange-500" />
                                    <span>Queued</span>
                                </div>
                                {taskCounts.queued > 0 && (
                                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{taskCounts.queued}</span>
                                )}
                            </div>
                        </ListBox.Item>
                    </ListBox>
                </section>

                <Separator />

                {/* History Section */}
                <section>
                    <Label className="px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        🕐 History
                    </Label>
                    <ListBox aria-label="History" className="mt-2" selectionMode="single">
                        <ListBox.Item id="history-7d" textValue="Last 7 days">
                            <div className="flex items-center gap-2">
                                <Clock className="size-4" />
                                <span>Last 7 days</span>
                            </div>
                        </ListBox.Item>
                    </ListBox>
                </section>

                <Separator />

                {/* Settings Section */}
                <section>
                    <Label className="px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        ⚙️ Settings
                    </Label>
                    <ListBox aria-label="Settings" className="mt-2" selectionMode="single">
                        <ListBox.Item id="ai-provider" textValue="AI Provider">
                            <div className="flex items-center gap-2">
                                <Sparkles className="size-4" />
                                <span>AI Provider</span>
                            </div>
                        </ListBox.Item>
                        <ListBox.Item id="permissions" textValue="Permissions">
                            <div className="flex items-center gap-2">
                                <Shield className="size-4" />
                                <span>Permissions</span>
                            </div>
                        </ListBox.Item>
                        <ListBox.Item id="appearance" textValue="Appearance">
                            <div className="flex items-center gap-2">
                                <Palette className="size-4" />
                                <span>Appearance</span>
                            </div>
                        </ListBox.Item>
                    </ListBox>
                </section>
            </div>
        </aside>
    );
}
