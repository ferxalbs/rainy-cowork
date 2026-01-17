import { useState, useCallback } from "react";
import { MainLayout, TaskInput, TaskCard, FileTable } from "./components";
import { Card, Label, Separator } from "@heroui/react";
import { Zap } from "lucide-react";
import type { Task, ProviderType, Folder, FileChange } from "./types";

// Generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 11);

function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeSection, setActiveSection] = useState("tasks");
  const [fileChanges, setFileChanges] = useState<FileChange[]>([]);

  // Calculate task counts for sidebar
  const taskCounts = {
    completed: tasks.filter((t) => t.status === "completed").length,
    running: tasks.filter((t) => t.status === "running").length,
    queued: tasks.filter((t) => t.status === "queued").length,
  };

  // Handle new task submission
  const handleTaskSubmit = useCallback((description: string, provider: ProviderType) => {
    const newTask: Task = {
      id: generateId(),
      title: description.length > 50 ? description.substring(0, 47) + "..." : description,
      description,
      status: "running",
      progress: 0,
      provider,
      model: provider === "openai" ? "gpt-4o" : provider === "anthropic" ? "claude-3.5-sonnet" : "llama3.2",
      createdAt: new Date(),
      startedAt: new Date(),
    };

    setTasks((prev) => [newTask, ...prev]);

    // Simulate task progress
    simulateTaskProgress(newTask.id);
  }, []);

  // Simulate task progress (demo functionality)
  const simulateTaskProgress = (taskId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15;
      if (progress >= 100) {
        progress = 100;
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? { ...t, progress: 100, status: "completed", completedAt: new Date() }
              : t
          )
        );

        // Add a demo file change
        setFileChanges((prev) => [
          {
            id: generateId(),
            path: "~/Documents/task-output.md",
            filename: "task-output.md",
            operation: "create",
            timestamp: new Date(),
            taskId,
          },
          ...prev,
        ]);

        clearInterval(interval);
      } else {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? { ...t, progress: Math.round(progress) } : t))
        );
      }
    }, 500);
  };

  // Handle task pause
  const handleTaskPause = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: t.status === "paused" ? "running" : "paused" }
          : t
      )
    );
  }, []);

  // Handle task stop
  const handleTaskStop = useCallback((taskId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, status: "cancelled", completedAt: new Date() } : t
      )
    );
  }, []);

  // Handle folder selection
  const handleFolderSelect = useCallback((folder: Folder) => {
    console.log("Selected folder:", folder);
    // TODO: Implement folder navigation
  }, []);

  // Handle navigation
  const handleNavigate = useCallback((section: string) => {
    setActiveSection(section);
  }, []);

  // Filter tasks based on active section
  const getFilteredTasks = () => {
    switch (activeSection) {
      case "completed":
        return tasks.filter((t) => t.status === "completed");
      case "running":
        return tasks.filter((t) => t.status === "running" || t.status === "paused");
      case "queued":
        return tasks.filter((t) => t.status === "queued");
      default:
        return tasks.filter((t) => t.status === "running" || t.status === "paused");
    }
  };

  const filteredTasks = getFilteredTasks();
  const activeTasks = tasks.filter((t) => t.status === "running" || t.status === "paused");

  return (
    <MainLayout
      onFolderSelect={handleFolderSelect}
      onNavigate={handleNavigate}
      activeSection={activeSection}
      taskCounts={taskCounts}
    >
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Task Input Section */}
        <Card className="p-6">
          <TaskInput onSubmit={handleTaskSubmit} />
        </Card>

        {/* Active Tasks Section */}
        {activeTasks.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="size-5 text-blue-500" />
              <Label className="text-lg font-semibold">Active Tasks</Label>
            </div>
            <div className="space-y-3">
              {activeTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onPause={handleTaskPause}
                  onStop={handleTaskStop}
                />
              ))}
            </div>
          </section>
        )}

        {/* Divider */}
        {activeTasks.length > 0 && fileChanges.length > 0 && <Separator />}

        {/* File Changes Section */}
        {fileChanges.length > 0 && <FileTable changes={fileChanges} />}

        {/* Empty State */}
        {tasks.length === 0 && (
          <Card variant="transparent" className="p-8 text-center">
            <div className="space-y-2">
              <p className="text-lg font-medium text-muted-foreground">
                No tasks yet
              </p>
              <p className="text-sm text-muted-foreground">
                Type a task above to get started with your AI assistant
              </p>
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}

export default App;
