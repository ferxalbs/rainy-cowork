import { Button } from "@heroui/react";
import { Plus } from "lucide-react";
import { useState } from "react";
import { AgentList } from "../AgentList";

interface NeuralAgentsProps {
  onNavigate?: (section: string) => void;
}

export function NeuralAgents({ onNavigate }: NeuralAgentsProps) {
  const [refreshToken, setRefreshToken] = useState(0);

  return (
    <div className="space-y-8 animate-appear">
      <div className="flex items-center justify-between border-b border-border/10 pb-6">
        <div>
          <h3 className="text-2xl font-bold text-foreground tracking-tight">
            Neural Agents
          </h3>
          <p className="text-muted-foreground text-sm">
            Manage your active agent fleet.
          </p>
        </div>
        <Button
          onPress={() => onNavigate?.("agent-builder")}
          className="bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 hover:bg-primary/90"
        >
          <Plus className="size-4 mr-2" />
          Deploy Agent
        </Button>
      </div>

      <div className="rounded-2xl border border-border/20 bg-card/20 backdrop-blur-md overflow-hidden p-1">
        <AgentList
          onCreateClick={() => onNavigate?.("agent-builder")}
          refreshToken={refreshToken}
        />
      </div>
    </div>
  );
}
