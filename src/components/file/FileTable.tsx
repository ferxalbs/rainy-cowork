import { Card, Label } from "@heroui/react";
import { FileEdit, FilePlus, FileX, FolderInput, FileType } from "lucide-react";
import type { FileChange } from "../../types";

interface FileTableProps {
    changes?: FileChange[];
    onFileClick?: (change: FileChange) => void;
}

const operationIcons = {
    create: <FilePlus className="size-4 text-green-500" />,
    modify: <FileEdit className="size-4 text-blue-500" />,
    delete: <FileX className="size-4 text-red-500" />,
    move: <FolderInput className="size-4 text-orange-500" />,
    rename: <FileType className="size-4 text-purple-500" />,
};

const operationLabels = {
    create: "created",
    modify: "modified",
    delete: "deleted",
    move: "moved",
    rename: "renamed",
};

function formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
}

// Demo data for development
const demoChanges: FileChange[] = [
    {
        id: "1",
        path: "~/Documents/report.md",
        filename: "report.md",
        operation: "modify",
        timestamp: new Date(Date.now() - 5 * 60000),
    },
    {
        id: "2",
        path: "~/Documents/summary.txt",
        filename: "summary.txt",
        operation: "create",
        timestamp: new Date(Date.now() - 15 * 60000),
    },
    {
        id: "3",
        path: "~/Downloads/temp.log",
        filename: "temp.log",
        operation: "delete",
        timestamp: new Date(Date.now() - 30 * 60000),
    },
];

export function FileTable({ changes = demoChanges, onFileClick }: FileTableProps) {
    if (changes.length === 0) {
        return (
            <Card variant="transparent" className="p-4">
                <p className="text-sm text-muted-foreground text-center">
                    No recent file changes
                </p>
            </Card>
        );
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">📁 Recent File Changes</Label>
            </div>

            <Card variant="secondary" className="divide-y divide-border">
                {changes.map((change) => (
                    <button
                        key={change.id}
                        onClick={() => onFileClick?.(change)}
                        className="flex items-center justify-between w-full p-3 hover:bg-muted/50 transition-colors text-left"
                    >
                        <div className="flex items-center gap-3">
                            {operationIcons[change.operation]}
                            <div className="flex flex-col">
                                <span className="text-sm font-medium">{change.filename}</span>
                                <span className="text-xs text-muted-foreground">
                                    {operationLabels[change.operation]}
                                </span>
                            </div>
                        </div>
                        <span className="text-xs text-muted-foreground">
                            {formatTimeAgo(change.timestamp)}
                        </span>
                    </button>
                ))}
            </Card>
        </div>
    );
}
