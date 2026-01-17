import { ReactNode } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import type { Folder } from "../../types";

interface MainLayoutProps {
    children: ReactNode;
    onFolderSelect?: (folder: Folder) => void;
    onNavigate?: (section: string) => void;
    activeSection?: string;
    taskCounts?: {
        completed: number;
        running: number;
        queued: number;
    };
}

export function MainLayout({
    children,
    onFolderSelect,
    onNavigate,
    activeSection,
    taskCounts,
}: MainLayoutProps) {
    return (
        <div className="flex flex-col h-screen bg-background text-foreground">
            <Header />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar
                    onFolderSelect={onFolderSelect}
                    onNavigate={onNavigate}
                    activeSection={activeSection}
                    taskCounts={taskCounts}
                />
                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
