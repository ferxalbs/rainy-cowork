import { memo, useMemo } from "react";
import type { AirlockConfig, AirlockLevel } from "../../../../types/airlock";
import { getToolSkill } from "../../../../constants/toolPolicy";
import { inputClass, LEVELS, sectionTitleClass } from "./constants";

interface PolicySectionProps {
  airlock: AirlockConfig;
  allTools: string[];
  activeTools: string[];
  customToolInput: string;
  getToolLevel: (toolName: string) => AirlockLevel;
  onModeChange: (mode: "all" | "allowlist") => void;
  onAllowAllTools: () => void;
  onAllowSafeOnly: () => void;
  onAllowSafeSensitive: () => void;
  onClearAllowlist: () => void;
  onSetToolLevel: (toolName: string, level: AirlockLevel) => void;
  onSetAllowed: (toolName: string, enabled: boolean) => void;
  onSetDenied: (toolName: string, enabled: boolean) => void;
  onCustomToolInputChange: (value: string) => void;
  onAddCustomTool: () => void;
}

interface ToolPermissionRowProps {
  toolName: string;
  mode: "all" | "allowlist";
  level: AirlockLevel;
  isAllowed: boolean;
  isDenied: boolean;
  onSetToolLevel: (toolName: string, level: AirlockLevel) => void;
  onSetAllowed: (toolName: string, enabled: boolean) => void;
  onSetDenied: (toolName: string, enabled: boolean) => void;
}

const ToolPermissionRow = memo(function ToolPermissionRow({
  toolName,
  mode,
  level,
  isAllowed,
  isDenied,
  onSetToolLevel,
  onSetAllowed,
  onSetDenied,
}: ToolPermissionRowProps) {
  const levelMeta = LEVELS.find((item) => item.level === level)!;
  const skill = getToolSkill(toolName);

  return (
    <div className="grid grid-cols-1 md:grid-cols-7 gap-3 rounded-2xl border border-border/20 bg-card/30 backdrop-blur-md p-3 items-center">
      <div className="md:col-span-2 min-w-0">
        <code className="text-xs text-foreground/90">{toolName}</code>
        <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
          {skill}
        </div>
      </div>

      <div className="md:col-span-2">
        <select
          value={level}
          onChange={(e) =>
            onSetToolLevel(toolName, Number(e.target.value) as AirlockLevel)
          }
          className={inputClass}
        >
          {LEVELS.map((item) => (
            <option key={item.level} value={item.level}>
              L{item.level} {item.title}
            </option>
          ))}
        </select>
        <p className={`text-[11px] mt-1 ${levelMeta.tone}`}>{levelMeta.modalBehavior}</p>
      </div>

      {mode === "allowlist" ? (
        <label className="md:col-span-3 text-xs text-muted-foreground flex items-center gap-2 justify-start md:justify-end">
          <input
            type="checkbox"
            checked={isAllowed}
            onChange={(e) => onSetAllowed(toolName, e.target.checked)}
            className="accent-primary"
          />
          Allow this tool
        </label>
      ) : (
        <label className="md:col-span-3 text-xs text-muted-foreground flex items-center gap-2 justify-start md:justify-end">
          <input
            type="checkbox"
            checked={isDenied}
            onChange={(e) => onSetDenied(toolName, e.target.checked)}
            className="accent-primary"
          />
          Block this tool (deny)
        </label>
      )}
    </div>
  );
});

export function PolicySection({
  airlock,
  allTools,
  activeTools,
  customToolInput,
  getToolLevel,
  onModeChange,
  onAllowAllTools,
  onAllowSafeOnly,
  onAllowSafeSensitive,
  onClearAllowlist,
  onSetToolLevel,
  onSetAllowed,
  onSetDenied,
  onCustomToolInputChange,
  onAddCustomTool,
}: PolicySectionProps) {
  const allowSet = useMemo(() => new Set(airlock.tool_policy.allow), [airlock.tool_policy.allow]);
  const denySet = useMemo(() => new Set(airlock.tool_policy.deny), [airlock.tool_policy.deny]);

  const activeLevelCounts = useMemo(() => {
    return LEVELS.reduce<Record<number, number>>((acc, item) => {
      acc[item.level] = activeTools.filter((tool) => getToolLevel(tool) === item.level).length;
      return acc;
    }, {});
  }, [activeTools, getToolLevel]);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h4 className={sectionTitleClass}>Policy Mode</h4>
        <select
          value={airlock.tool_policy.mode}
          onChange={(e) => onModeChange(e.target.value as "all" | "allowlist")}
          className={`${inputClass} max-w-[260px]`}
        >
          <option value="all">Allow all unless denied</option>
          <option value="allowlist">Allowlist only (manual)</option>
        </select>
        <span className="text-xs text-muted-foreground">
          Active tools: <strong>{activeTools.length}</strong>
        </span>
      </div>

      {airlock.tool_policy.mode === "allowlist" && (
        <div className="rounded-2xl border border-primary/20 bg-primary/[0.05] p-4 space-y-3">
          <p className="text-sm text-foreground">
            Manual allowlist is enabled. Select exactly which tools this agent can execute.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onAllowAllTools}
              className="px-3 py-1.5 rounded-full text-xs border border-border/30 hover:border-primary/50 hover:text-primary transition-colors"
            >
              Allow all known tools
            </button>
            <button
              onClick={onAllowSafeOnly}
              className="px-3 py-1.5 rounded-full text-xs border border-border/30 hover:border-emerald-500/50 hover:text-emerald-500 transition-colors"
            >
              Allow L0 only
            </button>
            <button
              onClick={onAllowSafeSensitive}
              className="px-3 py-1.5 rounded-full text-xs border border-border/30 hover:border-amber-500/50 hover:text-amber-500 transition-colors"
            >
              Allow L0 + L1
            </button>
            <button
              onClick={onClearAllowlist}
              className="px-3 py-1.5 rounded-full text-xs border border-border/30 hover:border-red-500/50 hover:text-red-500 transition-colors"
            >
              Clear allowlist
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h4 className={sectionTitleClass}>Tool Permissions</h4>
        <p className="text-xs text-muted-foreground">
          Levels control Airlock prompts: <span className="text-emerald-500">L0 auto</span>,{" "}
          <span className="text-amber-500">L1 asks approval</span>,{" "}
          <span className="text-red-500">L2 requires explicit approval</span>.
        </p>
        {allTools.map((toolName) => (
          <ToolPermissionRow
            key={toolName}
            toolName={toolName}
            mode={airlock.tool_policy.mode}
            level={getToolLevel(toolName)}
            isAllowed={allowSet.has(toolName)}
            isDenied={denySet.has(toolName)}
            onSetToolLevel={onSetToolLevel}
            onSetAllowed={onSetAllowed}
            onSetDenied={onSetDenied}
          />
        ))}
      </div>

      <div className="rounded-2xl border border-border/20 bg-card/20 p-4 space-y-3">
        <h4 className={sectionTitleClass}>Custom Tool</h4>
        <div className="flex gap-2">
          <input
            value={customToolInput}
            onChange={(e) => onCustomToolInputChange(e.target.value)}
            placeholder="tool_name"
            className={inputClass}
          />
          <button
            onClick={onAddCustomTool}
            className="px-4 rounded-xl border border-border/30 text-sm hover:border-primary/50 hover:text-primary transition-colors"
          >
            Add
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {LEVELS.map((item) => (
          <div key={item.level} className="rounded-xl border border-border/20 bg-card/20 p-3">
            <p className={`text-sm font-semibold ${item.tone}`}>
              LEVEL {item.level} - {item.title}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {activeLevelCounts[item.level] ?? 0} active tool(s)
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
