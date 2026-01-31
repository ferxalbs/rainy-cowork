import { Card } from "@heroui/react";
import { Activity, Cpu } from "lucide-react";
import { useState, useEffect } from "react";

export function SystemStatusCard() {
  const [memoryUsage, setMemoryUsage] = useState("Optimal");
  const [tauriStatus, setTauriStatus] = useState("Active");

  // Mock checking status
  useEffect(() => {
    // Real implementation would check tauri payload or window.__TAURI__
    const checkStatus = () => {
      // Simple mock for now as requested to move the UI first
      setMemoryUsage("Optimal");
      setTauriStatus("Active");
    };
    checkStatus();
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card
        className="
          flex flex-row items-center gap-4 py-2 px-4
          bg-white/50 dark:bg-black/20
          border border-black/5 dark:border-white/5
          backdrop-blur-md shadow-lg
          rounded-full
        "
      >
        <div className="flex items-center gap-2 border-r border-black/5 dark:border-white/5 pr-4">
          <Activity className="size-3.5 text-green-500 animate-pulse" />
          <span className="text-[10px] font-medium opacity-80 uppercase tracking-wider">
            System
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5" title="Memory Usage">
            <Cpu className="size-3.5 text-muted-foreground/70" />
            <span className="text-xs font-medium">{memoryUsage}</span>
          </div>

          <div className="flex items-center gap-1.5" title="Tauri Bridge">
            <div
              className={`size-1.5 rounded-full ${tauriStatus === "Active" ? "bg-green-500" : "bg-red-500"}`}
            />
            <span className="text-xs font-medium">Bridge</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
