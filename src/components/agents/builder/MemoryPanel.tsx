import { useMemo, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { toast } from "sonner";
import type { MemoryConfig, KnowledgeFile } from "../../../types/memory";
import * as tauri from "../../../services/tauri";

interface MemoryPanelProps {
  agentId: string;
  memoryConfig: MemoryConfig;
  onChange: (memoryConfig: MemoryConfig) => void;
}

const sectionTitleClass =
  "text-[10px] font-bold uppercase tracking-widest text-muted-foreground";
const inputClass =
  "w-full bg-card/40 hover:bg-card/60 backdrop-blur-md rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 leading-relaxed border border-border/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all shadow-sm";

function upsertKnowledgeFile(
  files: KnowledgeFile[],
  next: KnowledgeFile,
): KnowledgeFile[] {
  const kept = files.filter((file) => file.id !== next.id && file.path !== next.path);
  return [next, ...kept].sort((a, b) => b.indexed_at - a.indexed_at);
}

export function MemoryPanel({ agentId, memoryConfig, onChange }: MemoryPanelProps) {
  const [isIndexing, setIsIndexing] = useState(false);
  const [query, setQuery] = useState("");
  const [isQuerying, setIsQuerying] = useState(false);
  const [results, setResults] = useState<tauri.AgentMemoryResult[]>([]);

  const indexedCount = useMemo(
    () => memoryConfig.knowledge.indexed_files.length,
    [memoryConfig.knowledge.indexed_files],
  );

  const updateRetrieval = (updates: Partial<MemoryConfig["retrieval"]>) => {
    onChange({
      ...memoryConfig,
      retrieval: {
        ...memoryConfig.retrieval,
        ...updates,
      },
    });
  };

  const updatePersistence = (updates: Partial<MemoryConfig["persistence"]>) => {
    onChange({
      ...memoryConfig,
      persistence: {
        ...memoryConfig.persistence,
        ...updates,
      },
    });
  };

  const handleIndexFile = async () => {
    try {
      const selected = await open({
        directory: false,
        multiple: false,
        filters: [
          {
            name: "Knowledge Files",
            extensions: ["md", "txt", "json", "csv", "yaml", "yml", "log"],
          },
        ],
      });

      if (!selected || Array.isArray(selected)) {
        return;
      }

      setIsIndexing(true);
      const indexed = await tauri.indexKnowledgeFile(agentId, selected);
      onChange({
        ...memoryConfig,
        knowledge: {
          enabled: true,
          indexed_files: upsertKnowledgeFile(
            memoryConfig.knowledge.indexed_files,
            indexed.file,
          ),
        },
      });
      toast.success(`Indexed ${indexed.file.name} (${indexed.chunks_indexed} chunks)`);
    } catch (error) {
      console.error("Failed to index knowledge file:", error);
      toast.error(`Indexing failed: ${error}`);
    } finally {
      setIsIndexing(false);
    }
  };

  const handleQuery = async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    try {
      setIsQuerying(true);
      const searchResults = await tauri.queryAgentMemory(
        agentId,
        query,
        memoryConfig.strategy,
        6,
      );
      setResults(searchResults);
    } catch (error) {
      console.error("Failed to query memory:", error);
      toast.error(`Memory query failed: ${error}`);
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="space-y-8 animate-appear">
      <div className="flex flex-col gap-1 border-b border-border/10 pb-6">
        <h3 className="text-2xl font-bold text-foreground tracking-tight">Memory</h3>
        <p className="text-muted-foreground text-sm">
          Configure retrieval and persist indexed knowledge for cross-session use.
        </p>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <label className={sectionTitleClass}>Retrieval Strategy</label>
          <select
            value={memoryConfig.strategy}
            onChange={(e) =>
              onChange({
                ...memoryConfig,
                strategy: e.target.value as "vector" | "simple_buffer" | "hybrid",
              })
            }
            className={`${inputClass} h-12`}
          >
            <option value="hybrid">Hybrid</option>
            <option value="vector">Vector</option>
            <option value="simple_buffer">Simple Buffer</option>
          </select>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className={sectionTitleClass}>Retention</label>
              <span className="font-mono text-xs text-foreground">
                {memoryConfig.retrieval.retention_days} days
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={90}
              value={memoryConfig.retrieval.retention_days}
              onChange={(e) =>
                updateRetrieval({
                  retention_days: Math.max(1, Number.parseInt(e.target.value || "1", 10)),
                })
              }
              className="w-full accent-primary h-1 bg-foreground/10 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className={sectionTitleClass}>Context Window</label>
              <span className="font-mono text-xs text-foreground">
                {memoryConfig.retrieval.max_tokens} tokens
              </span>
            </div>
            <input
              type="range"
              min={512}
              max={32000}
              step={512}
              value={memoryConfig.retrieval.max_tokens}
              onChange={(e) =>
                updateRetrieval({
                  max_tokens: Math.max(512, Number.parseInt(e.target.value || "512", 10)),
                })
              }
              className="w-full accent-primary h-1 bg-foreground/10 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h4 className={sectionTitleClass}>Persistence</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="text-sm text-foreground flex items-center gap-2">
            <input
              type="checkbox"
              checked={memoryConfig.persistence.cross_session}
              onChange={(e) => updatePersistence({ cross_session: e.target.checked })}
              className="accent-primary"
            />
            Cross-session
          </label>
          <label className="text-sm text-foreground flex items-center gap-2">
            <input
              type="checkbox"
              checked={memoryConfig.persistence.per_connector_isolation}
              onChange={(e) =>
                updatePersistence({ per_connector_isolation: e.target.checked })
              }
              className="accent-primary"
            />
            Per-connector isolation
          </label>
          <select
            value={memoryConfig.persistence.session_scope}
            onChange={(e) =>
              updatePersistence({
                session_scope: e.target.value as "per_user" | "per_channel" | "global",
              })
            }
            className={inputClass}
          >
            <option value="per_user">Per User</option>
            <option value="per_channel">Per Channel</option>
            <option value="global">Global</option>
          </select>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className={sectionTitleClass}>Knowledge Files</h4>
          <button
            type="button"
            onClick={handleIndexFile}
            disabled={isIndexing}
            className="px-3 py-1.5 text-xs rounded-lg border border-border/30 text-foreground hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-60"
          >
            {isIndexing ? "Indexing..." : "+ Add knowledge file"}
          </button>
        </div>

        <label className="text-sm text-foreground flex items-center gap-2">
          <input
            type="checkbox"
            checked={memoryConfig.knowledge.enabled}
            onChange={(e) =>
              onChange({
                ...memoryConfig,
                knowledge: {
                  ...memoryConfig.knowledge,
                  enabled: e.target.checked,
                },
              })
            }
            className="accent-primary"
          />
          Enable knowledge injection ({indexedCount} indexed)
        </label>

        {indexedCount === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-border/30 text-sm text-muted-foreground bg-card/20">
            No knowledge files indexed yet.
          </div>
        ) : (
          <div className="space-y-2">
            {memoryConfig.knowledge.indexed_files.map((file) => (
              <div
                key={file.id}
                className="p-3 rounded-xl border border-border/20 bg-card/30 flex items-start justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="text-sm text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{file.path}</p>
                </div>
                <span className="text-xs font-mono text-muted-foreground shrink-0">
                  {file.chunk_count} chunks
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h4 className={sectionTitleClass}>Query Preview</h4>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask memory to retrieve relevant context"
            className={inputClass}
          />
          <button
            type="button"
            onClick={handleQuery}
            disabled={isQuerying || !query.trim()}
            className="px-4 py-2 text-sm rounded-xl border border-border/30 text-foreground hover:border-primary/40 hover:text-primary transition-colors disabled:opacity-60"
          >
            {isQuerying ? "Searching..." : "Search"}
          </button>
        </div>

        {results.length > 0 && (
          <div className="space-y-2">
            {results.map((result) => (
              <div key={result.id} className="p-3 rounded-xl border border-border/20 bg-card/30">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <p className="text-xs font-semibold text-foreground/90 truncate">
                    {result.file_name}
                  </p>
                  <span className="text-[10px] font-mono text-primary">
                    score {result.score.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-4">
                  {result.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
