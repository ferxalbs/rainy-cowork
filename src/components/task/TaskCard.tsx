import { Card, Button, Slider, Label } from "@heroui/react";
import { Pause, Square, Eye, Loader2, CheckCircle2, XCircle, Timer, Play } from "lucide-react";
import type { Task } from "../../types";

interface TaskCardProps {
    task: Task;
    onPause?: (taskId: string) => void;
    onStop?: (taskId: string) => void;
    onViewDetails?: (taskId: string) => void;
}

const statusIcons = {
    queued: <Timer className="size-5 text-orange-500" />,
    running: <Loader2 className="size-5 text-blue-500 animate-spin" />,
    paused: <Pause className="size-5 text-yellow-500" />,
    completed: <CheckCircle2 className="size-5 text-green-500" />,
    failed: <XCircle className="size-5 text-red-500" />,
    cancelled: <Square className="size-5 text-muted-foreground" />,
};

const statusColors = {
    queued: "text-orange-500",
    running: "text-blue-500",
    paused: "text-yellow-500",
    completed: "text-green-500",
    failed: "text-red-500",
    cancelled: "text-muted-foreground",
};

export function TaskCard({ task, onPause, onStop, onViewDetails }: TaskCardProps) {
    const isActive = task.status === "running" || task.status === "paused";

    return (
        <Card className="w-full" variant="secondary">
            <Card.Header>
                <div className="flex items-start justify-between w-full">
                    <div className="flex items-center gap-3">
                        {statusIcons[task.status]}
                        <div className="flex flex-col">
                            <Card.Title className="text-base">{task.title}</Card.Title>
                            <Card.Description className="text-xs">
                                {task.provider.toUpperCase()} • {task.model}
                            </Card.Description>
                        </div>
                    </div>
                    <span className={`text-xs font-medium capitalize ${statusColors[task.status]}`}>
                        {task.status}
                    </span>
                </div>
            </Card.Header>

            <Card.Content className="space-y-3">
                {/* Progress Bar - simple div progress instead of Slider for display-only */}
                <div className="space-y-1">
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-muted-foreground">Progress</span>
                        <span className="text-xs text-muted-foreground">{task.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-300 ease-out rounded-full"
                            style={{ width: `${task.progress}%` }}
                        />
                    </div>
                </div>

                {/* Task Steps (if available) */}
                {task.steps && task.steps.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                        Step {task.steps.filter((s) => s.status === "completed").length + 1} of{" "}
                        {task.steps.length}:{" "}
                        <span className="text-foreground">
                            {task.steps.find((s) => s.status === "running")?.name || "Waiting..."}
                        </span>
                    </div>
                )}

                {/* Error message */}
                {task.error && (
                    <p className="text-xs text-red-500 bg-red-500/10 p-2 rounded">{task.error}</p>
                )}
            </Card.Content>

            {isActive && (
                <Card.Footer className="gap-2">
                    <Button
                        size="sm"
                        variant="secondary"
                        onPress={() => onPause?.(task.id)}
                    >
                        {task.status === "paused" ? <Play className="size-3" /> : <Pause className="size-3" />}
                        {task.status === "paused" ? "Resume" : "Pause"}
                    </Button>
                    <Button
                        size="sm"
                        variant="danger"
                        onPress={() => onStop?.(task.id)}
                    >
                        <Square className="size-3" />
                        Stop
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onPress={() => onViewDetails?.(task.id)}
                    >
                        <Eye className="size-3" />
                        View
                    </Button>
                </Card.Footer>
            )}
        </Card>
    );
}
