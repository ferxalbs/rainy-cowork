import { useCallback, useMemo, useState } from "react";
import type { AirlockConfig, AirlockLevel } from "../../../types/airlock";
import { KNOWN_TOOL_NAMES, getToolAirlockLevel } from "../../../constants/toolPolicy";
import { PolicySection } from "./airlock/PolicySection";
import { RateLimitsSection } from "./airlock/RateLimitsSection";
import { ScopesSection } from "./airlock/ScopesSection";
import { Shield } from "lucide-react";

interface AirlockPanelProps {
  airlock: AirlockConfig;
  onChange: (airlock: AirlockConfig) => void;
}

export function AirlockPanel({ airlock, onChange }: AirlockPanelProps) {
  const [customToolInput, setCustomToolInput] = useState("");

  const allTools = useMemo(
    () =>
      Array.from(
        new Set([
          ...KNOWN_TOOL_NAMES,
          ...Object.keys(airlock.tool_levels),
          ...airlock.tool_policy.allow,
          ...airlock.tool_policy.deny,
        ]),
      ).sort((a, b) => a.localeCompare(b)),
    [airlock.tool_levels, airlock.tool_policy.allow, airlock.tool_policy.deny],
  );

  const getToolLevel = useCallback(
    (toolName: string): AirlockLevel =>
      airlock.tool_levels[toolName] ?? getToolAirlockLevel(toolName),
    [airlock.tool_levels],
  );

  const setToolLevel = useCallback(
    (toolName: string, level: AirlockLevel) => {
      onChange({
        ...airlock,
        tool_levels: {
          ...airlock.tool_levels,
          [toolName]: level,
        },
      });
    },
    [airlock, onChange],
  );

  const setAllowed = useCallback(
    (toolName: string, enabled: boolean) => {
      const allow = enabled
        ? Array.from(new Set([...airlock.tool_policy.allow, toolName]))
        : airlock.tool_policy.allow.filter((item) => item !== toolName);

      const deny = airlock.tool_policy.deny.filter((item) => item !== toolName);

      onChange({
        ...airlock,
        tool_policy: {
          ...airlock.tool_policy,
          allow,
          deny,
        },
      });
    },
    [airlock, onChange],
  );

  const setDenied = useCallback(
    (toolName: string, enabled: boolean) => {
      const deny = enabled
        ? Array.from(new Set([...airlock.tool_policy.deny, toolName]))
        : airlock.tool_policy.deny.filter((item) => item !== toolName);

      const allow = enabled
        ? airlock.tool_policy.allow.filter((item) => item !== toolName)
        : airlock.tool_policy.allow;

      onChange({
        ...airlock,
        tool_policy: {
          ...airlock.tool_policy,
          deny,
          allow,
        },
      });
    },
    [airlock, onChange],
  );

  const addCustomTool = useCallback(() => {
    const toolName = customToolInput.trim();
    if (!toolName) return;

    onChange({
      ...airlock,
      tool_levels: {
        ...airlock.tool_levels,
        [toolName]: getToolLevel(toolName),
      },
      tool_policy: {
        ...airlock.tool_policy,
        allow: Array.from(new Set([...airlock.tool_policy.allow, toolName])),
      },
    });
    setCustomToolInput("");
  }, [airlock, customToolInput, getToolLevel, onChange]);

  const applyAllowPreset = useCallback(
    (predicate: (level: AirlockLevel) => boolean) => {
      const selected = allTools.filter((toolName) => predicate(getToolLevel(toolName)));

      onChange({
        ...airlock,
        tool_policy: {
          ...airlock.tool_policy,
          allow: selected,
          deny: airlock.tool_policy.deny.filter((tool) => !selected.includes(tool)),
        },
      });
    },
    [airlock, allTools, getToolLevel, onChange],
  );

  const activeTools = useMemo(
    () =>
      airlock.tool_policy.mode === "allowlist"
        ? airlock.tool_policy.allow
        : allTools.filter((toolName) => !airlock.tool_policy.deny.includes(toolName)),
    [airlock.tool_policy.allow, airlock.tool_policy.deny, airlock.tool_policy.mode, allTools],
  );

  return (
    <div className="space-y-8 animate-appear">
      <div className="relative overflow-hidden rounded-2xl border border-border/20 bg-card/40 backdrop-blur-xl p-5">
        <div className="absolute -top-20 right-[-60px] w-[280px] h-[280px] rounded-full bg-primary/10 blur-[85px] pointer-events-none" />
        <div className="absolute -bottom-24 left-[-80px] w-[260px] h-[260px] rounded-full bg-foreground/[0.04] blur-[90px] pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-1">
          <h3 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Shield className="size-5 text-primary" />
            Airlock
          </h3>
          <p className="text-muted-foreground text-sm">
            Define exactly which tools run, at which risk level, and how approval modals are
            triggered.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border/20 bg-card/35 backdrop-blur-md p-5">
        <PolicySection
          airlock={airlock}
          allTools={allTools}
          activeTools={activeTools}
          customToolInput={customToolInput}
          getToolLevel={getToolLevel}
          onModeChange={(mode) =>
            onChange({
              ...airlock,
              tool_policy: {
                ...airlock.tool_policy,
                mode,
              },
            })
          }
          onAllowAllTools={() => applyAllowPreset(() => true)}
          onAllowSafeOnly={() => applyAllowPreset((level) => level === 0)}
          onAllowSafeSensitive={() => applyAllowPreset((level) => level <= 1)}
          onClearAllowlist={() => applyAllowPreset(() => false)}
          onSetToolLevel={setToolLevel}
          onSetAllowed={setAllowed}
          onSetDenied={setDenied}
          onCustomToolInputChange={setCustomToolInput}
          onAddCustomTool={addCustomTool}
        />
      </div>

      <div className="rounded-2xl border border-border/20 bg-card/35 backdrop-blur-md p-5">
        <ScopesSection
          airlock={airlock}
          onScopesChange={(scopes) =>
            onChange({
              ...airlock,
              scopes,
            })
          }
        />
      </div>

      <div className="rounded-2xl border border-border/20 bg-card/35 backdrop-blur-md p-5">
        <RateLimitsSection
          airlock={airlock}
          onRateLimitsChange={(rate_limits) =>
            onChange({
              ...airlock,
              rate_limits,
            })
          }
        />
      </div>
    </div>
  );
}
