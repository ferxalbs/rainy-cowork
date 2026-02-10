import { useState, useMemo } from "react";
import {
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  Input,
} from "@heroui/react";
import { Check, ChevronDown, Search, Bot, User } from "lucide-react";
import { AgentSpec } from "../../types/agent-spec";

interface AgentSelectorProps {
  selectedAgentId: string;
  onSelect: (agentId: string) => void;
  agentSpecs: AgentSpec[];
  className?: string;
}

export function AgentSelector({
  selectedAgentId,
  onSelect,
  agentSpecs,
  className,
}: AgentSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const selectedAgent = useMemo(
    () => agentSpecs.find((a) => a.id === selectedAgentId),
    [agentSpecs, selectedAgentId],
  );

  const filteredAgents = useMemo(() => {
    if (!searchQuery) return agentSpecs;
    return agentSpecs.filter((agent) =>
      (agent.soul.name || "Untitled Agent")
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
    );
  }, [agentSpecs, searchQuery]);

  return (
    <Popover isOpen={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger>
        <Button
          variant="ghost"
          className={`h-auto py-1.5 px-3 gap-2 font-normal rounded-full transition-all duration-300
            bg-white/50 dark:bg-black/20 
            border border-black/5 dark:border-white/5
            hover:bg-black/5 dark:hover:bg-white/5
            backdrop-blur-md
            ${className}`}
        >
          {selectedAgent ? (
            <>
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center">
                  <Bot className="size-4 text-primary" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-xs font-medium leading-tight text-foreground/90">
                    {selectedAgent.soul.name || "Untitled Agent"}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <User className="size-4 text-muted-foreground" />
              <span className="text-muted-foreground text-xs">
                Default Agent
              </span>
            </div>
          )}
          <ChevronDown className="size-3 text-muted-foreground/70" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 mt-2 p-0 bg-background/60 backdrop-blur-2xl dark:bg-background/20 border border-white/10 rounded-lg overflow-hidden">
        <div className="flex flex-col">
          {/* Search */}
          <div className="p-3 border-b border-border/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4" />
              <Input
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-background/30 w-full pl-9 h-9 rounded-lg border-transparent focus:border-primary/20 transition-all text-white/50 dark:text-white/50"
              />
            </div>
          </div>

          {/* Agent List */}
          <div className="max-h-[300px] overflow-y-auto py-2 custom-scrollbar">
            {/* Default Agent Option */}
            <div className="px-2 py-1">
              <button
                onClick={() => {
                  onSelect("");
                  setIsPopoverOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left transition-all duration-200 group ${
                  !selectedAgentId
                    ? "bg-secondary/80 text-foreground ring-1 ring-border/50 shadow-sm"
                    : "hover:bg-muted/50 text-foreground/80 hover:text-foreground"
                }`}
              >
                <div className="flex items-center justify-center shrink-0 w-5 h-5">
                  <User className="size-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">
                      Default Agent
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-muted-foreground/80 truncate font-medium">
                      Standard system assistant
                    </span>
                  </div>
                </div>
                {!selectedAgentId && (
                  <Check className="size-3.5 shrink-0 text-primary" />
                )}
              </button>
            </div>

            {filteredAgents.length > 0 && (
              <div className="px-2 py-1">
                <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">
                  Custom Agents
                </div>
                {filteredAgents.map((agent) => (
                  <button
                    key={agent.id}
                    onClick={() => {
                      onSelect(agent.id);
                      setIsPopoverOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left transition-all duration-200 group ${
                      selectedAgentId === agent.id
                        ? "bg-secondary/80 text-foreground ring-1 ring-border/50 shadow-sm"
                        : "hover:bg-muted/50 text-foreground/80 hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center justify-center shrink-0 w-5 h-5">
                      <Bot className="size-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">
                          {agent.soul.name || "Untitled Agent"}
                        </span>
                        {/* You could add capability icons here if AgentSpec has them readily available */}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-muted-foreground/80 truncate font-medium">
                          {agent.soul.description || "No description"}
                        </span>
                      </div>
                    </div>
                    {selectedAgentId === agent.id && (
                      <Check className="size-3.5 shrink-0 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {filteredAgents.length === 0 && (
              <div className="py-8 text-center text-muted-foreground">
                <p className="text-xs">No agents found</p>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
