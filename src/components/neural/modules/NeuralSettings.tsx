import { Button } from "@heroui/react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AtmAdminPermissions,
  AtmAdminPolicyAuditEvent,
  AtmToolAccessPolicy,
  AtmToolAccessPolicyState,
  InstalledSkillRecord,
  getAtmAdminPermissions,
  getAtmToolAccessPolicy,
  installLocalSkill,
  installSkillFromAtm,
  listInstalledSkills,
  listAtmAdminPolicyAudit,
  removeInstalledSkill,
  setInstalledSkillEnabled,
  updateAtmAdminPermissions,
  updateAtmToolAccessPolicy,
} from "../../../services/tauri";
import { NeuralChip, NeuralSwitch } from "../shared/UiElements";

const DEFAULT_ADMIN_PERMISSIONS: AtmAdminPermissions = {
  canEditSlo: true,
  canAckAlerts: true,
  canEditAlertRetention: true,
  canRunAlertCleanup: true,
};
const DEFAULT_TOOL_ACCESS_POLICY: AtmToolAccessPolicy = {
  enabled: true,
  mode: "all",
  allow: [],
  deny: [],
};

// Styles for native inputs
const inputClass =
  "w-full bg-card/40 hover:bg-card/60 backdrop-blur-md rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/50 leading-relaxed border border-border/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all shadow-sm";
const labelClass =
  "block text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-1.5 ml-1";

const parseToolList = (value: string): string[] =>
  Array.from(
    new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
const toolListToInput = (items: string[]): string => items.join(", ");
const formatPolicyValue = (value: unknown) =>
  typeof value === "boolean" ? (value ? "enabled" : "disabled") : String(value);

interface NeuralSettingsProps {
  platformKey: string;
  userApiKey: string;
}

export function NeuralSettings({
  platformKey,
  userApiKey,
}: NeuralSettingsProps) {
  const [, setAdminPermissions] = useState<AtmAdminPermissions>(
    DEFAULT_ADMIN_PERMISSIONS,
  );
  const [permissionDraft, setPermissionDraft] = useState<AtmAdminPermissions>(
    DEFAULT_ADMIN_PERMISSIONS,
  );
  const [toolPolicyDraft, setToolPolicyDraft] = useState<AtmToolAccessPolicy>(
    DEFAULT_TOOL_ACCESS_POLICY,
  );
  const [toolPolicyVersion, setToolPolicyVersion] = useState<number>(0);
  const [toolPolicyHash, setToolPolicyHash] = useState<string>("");
  const [allowInput, setAllowInput] = useState("");
  const [denyInput, setDenyInput] = useState("");
  const [policyAuditEvents, setPolicyAuditEvents] = useState<
    AtmAdminPolicyAuditEvent[]
  >([]);
  const [isLoadingPolicyAudit, setIsLoadingPolicyAudit] = useState(false);
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);
  const [isSavingToolPolicy, setIsSavingToolPolicy] = useState(false);
  const [installedSkills, setInstalledSkills] = useState<InstalledSkillRecord[]>(
    [],
  );
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);
  const [localSkillDir, setLocalSkillDir] = useState("");
  const [allowUnsignedDevInstall, setAllowUnsignedDevInstall] = useState(false);
  const [remoteSkillId, setRemoteSkillId] = useState("");
  const [remoteBaseUrl, setRemoteBaseUrl] = useState(
    "https://rainy-atm-cfe3gvcwua-uc.a.run.app",
  );

  const loadAdminPermissions = useCallback(async () => {
    try {
      const permissions = await getAtmAdminPermissions();
      setAdminPermissions(permissions);
      setPermissionDraft(permissions);
    } catch (err) {
      console.error("Failed to load admin permissions:", err);
    }
  }, []);

  const loadToolAccessPolicy = useCallback(async () => {
    try {
      const state = await getAtmToolAccessPolicy();
      setToolPolicyDraft(state.toolAccessPolicy);
      setToolPolicyVersion(state.toolAccessPolicyVersion);
      setToolPolicyHash(state.toolAccessPolicyHash);
      setAllowInput(toolListToInput(state.toolAccessPolicy.allow));
      setDenyInput(toolListToInput(state.toolAccessPolicy.deny));
    } catch (err) {
      console.error("Failed to load tool access policy:", err);
    }
  }, []);

  const loadPolicyAudit = useCallback(async () => {
    setIsLoadingPolicyAudit(true);
    try {
      const events = await listAtmAdminPolicyAudit(20);
      setPolicyAuditEvents(events);
    } catch (err) {
      console.error("Failed to load policy audit:", err);
    } finally {
      setIsLoadingPolicyAudit(false);
    }
  }, []);

  const loadInstalledSkills = useCallback(async () => {
    setIsLoadingSkills(true);
    try {
      const skills = await listInstalledSkills();
      setInstalledSkills(skills);
    } catch (err) {
      console.error("Failed to load installed skills:", err);
    } finally {
      setIsLoadingSkills(false);
    }
  }, []);

  useEffect(() => {
    loadAdminPermissions();
    loadToolAccessPolicy();
    loadPolicyAudit();
    loadInstalledSkills();
  }, [loadAdminPermissions, loadToolAccessPolicy, loadPolicyAudit, loadInstalledSkills]);

  const handleSavePermissions = async () => {
    if (!platformKey.trim() || !userApiKey.trim()) {
      toast.error("Owner credentials are required to update permissions");
      return;
    }

    setIsSavingPermissions(true);
    try {
      const updated = await updateAtmAdminPermissions(
        permissionDraft,
        platformKey.trim(),
        userApiKey.trim(),
      );
      setAdminPermissions(updated);
      setPermissionDraft(updated);
      toast.success("Admin permissions updated");
      await loadPolicyAudit();
    } catch (err) {
      console.error("Failed to update admin permissions:", err);
      toast.error("Failed to update admin permissions");
    } finally {
      setIsSavingPermissions(false);
    }
  };

  const handleSaveToolPolicy = async () => {
    if (!platformKey.trim() || !userApiKey.trim()) {
      toast.error("Owner credentials are required to update tool policy");
      return;
    }

    const nextPolicy: AtmToolAccessPolicy = {
      ...toolPolicyDraft,
      allow: parseToolList(allowInput),
      deny: parseToolList(denyInput),
    };

    setIsSavingToolPolicy(true);
    try {
      const updated: AtmToolAccessPolicyState = await updateAtmToolAccessPolicy(
        nextPolicy,
        platformKey.trim(),
        userApiKey.trim(),
      );
      setToolPolicyDraft(updated.toolAccessPolicy);
      setToolPolicyVersion(updated.toolAccessPolicyVersion);
      setToolPolicyHash(updated.toolAccessPolicyHash);
      setAllowInput(toolListToInput(updated.toolAccessPolicy.allow));
      setDenyInput(toolListToInput(updated.toolAccessPolicy.deny));
      toast.success("Tool access policy updated");
      await loadPolicyAudit();
    } catch (err) {
      console.error("Failed to update tool access policy:", err);
      toast.error("Failed to update tool access policy");
    } finally {
      setIsSavingToolPolicy(false);
    }
  };

  const handleInstallLocalSkill = async () => {
    if (!localSkillDir.trim()) {
      toast.error("Enter a local skill folder path");
      return;
    }
    try {
      await installLocalSkill({
        sourceDir: localSkillDir.trim(),
        allowUnsignedDev: allowUnsignedDevInstall,
        platformKey: platformKey.trim() || undefined,
      });
      toast.success("Local skill installed");
      setLocalSkillDir("");
      await loadInstalledSkills();
    } catch (err) {
      console.error("Failed to install local skill:", err);
      toast.error("Failed to install local skill");
    }
  };

  const handleInstallFromAtm = async () => {
    if (!remoteSkillId.trim()) {
      toast.error("Enter a skill id");
      return;
    }
    if (!platformKey.trim()) {
      toast.error("Platform key required for ATM skill install");
      return;
    }
    try {
      await installSkillFromAtm({
        baseUrl: remoteBaseUrl.trim(),
        skillId: remoteSkillId.trim(),
        platformKey: platformKey.trim(),
      });
      toast.success("Skill installed from ATM");
      setRemoteSkillId("");
      await loadInstalledSkills();
    } catch (err) {
      console.error("Failed to install ATM skill:", err);
      toast.error("Failed to install ATM skill");
    }
  };

  const handleToggleSkill = async (skill: InstalledSkillRecord, enabled: boolean) => {
    try {
      await setInstalledSkillEnabled({
        skillId: skill.id,
        version: skill.version,
        enabled,
      });
      setInstalledSkills((prev) =>
        prev.map((entry) =>
          entry.id === skill.id && entry.version === skill.version
            ? { ...entry, enabled }
            : entry,
        ),
      );
    } catch (err) {
      console.error("Failed to update skill enabled state:", err);
      toast.error("Failed to update skill state");
    }
  };

  const handleRemoveSkill = async (skill: InstalledSkillRecord) => {
    try {
      await removeInstalledSkill({ skillId: skill.id, version: skill.version });
      toast.success("Skill removed");
      await loadInstalledSkills();
    } catch (err) {
      console.error("Failed to remove skill:", err);
      toast.error("Failed to remove skill");
    }
  };

  return (
    <div className="space-y-8 animate-appear">
      <div className="flex flex-col gap-1 border-b border-border/10 pb-6">
        <h3 className="text-2xl font-bold text-foreground tracking-tight">
          Admin Policy
        </h3>
        <p className="text-muted-foreground text-sm">
          Node security and access controls. Requires owner authentication.
        </p>
      </div>

      <div className="space-y-8">
        {/* Admin Permissions */}
        <div className="rounded-xl border border-border/20 bg-card/10 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Desktop Admin Capabilities
            </h4>
            <Button
              size="sm"
              onPress={handleSavePermissions}
              isDisabled={isSavingPermissions}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSavingPermissions ? "Saving..." : "Save Config"}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between rounded-lg border border-white/5 bg-background/20 px-4 py-3">
              <span className="text-sm text-foreground">
                Edit SLO Thresholds
              </span>
              <NeuralSwitch
                checked={permissionDraft.canEditSlo}
                onChange={(enabled) =>
                  setPermissionDraft((prev) => ({
                    ...prev,
                    canEditSlo: enabled,
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/5 bg-background/20 px-4 py-3">
              <span className="text-sm text-foreground">
                Acknowledge Alerts
              </span>
              <NeuralSwitch
                checked={permissionDraft.canAckAlerts}
                onChange={(enabled) =>
                  setPermissionDraft((prev) => ({
                    ...prev,
                    canAckAlerts: enabled,
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/5 bg-background/20 px-4 py-3">
              <span className="text-sm text-foreground">
                Edit Retention Policy
              </span>
              <NeuralSwitch
                checked={permissionDraft.canEditAlertRetention}
                onChange={(enabled) =>
                  setPermissionDraft((prev) => ({
                    ...prev,
                    canEditAlertRetention: enabled,
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/5 bg-background/20 px-4 py-3">
              <span className="text-sm text-foreground">
                Run Alert Database Cleanup
              </span>
              <NeuralSwitch
                checked={permissionDraft.canRunAlertCleanup}
                onChange={(enabled) =>
                  setPermissionDraft((prev) => ({
                    ...prev,
                    canRunAlertCleanup: enabled,
                  }))
                }
              />
            </div>
          </div>
        </div>

        {/* Tool Access Policy */}
        <div className="rounded-xl border border-border/20 bg-card/10 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                Tool Access Policy
              </h4>
              <NeuralChip variant="flat" className="bg-white/10">
                v{toolPolicyVersion}
              </NeuralChip>
            </div>
            <Button
              size="sm"
              onPress={handleSaveToolPolicy}
              isDisabled={isSavingToolPolicy}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSavingToolPolicy ? "Saving..." : "Save Policy"}
            </Button>
          </div>

          <div className="text-xs font-mono text-muted-foreground break-all bg-black/20 p-2 rounded-lg border border-white/5">
            hash: {toolPolicyHash || "n/a"}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between rounded-lg border border-white/5 bg-background/20 px-4 py-3">
              <span className="text-sm text-foreground">
                Policy Enforcement
              </span>
              <NeuralSwitch
                checked={toolPolicyDraft.enabled}
                onChange={(enabled) =>
                  setToolPolicyDraft((prev) => ({
                    ...prev,
                    enabled,
                  }))
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-white/5 bg-background/20 px-4 py-3">
              <span className="text-sm text-foreground">Mode</span>
              <div className="flex bg-black/20 rounded-lg p-1">
                <button
                  onClick={() =>
                    setToolPolicyDraft((prev) => ({ ...prev, mode: "all" }))
                  }
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    toolPolicyDraft.mode === "all"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() =>
                    setToolPolicyDraft((prev) => ({
                      ...prev,
                      mode: "allowlist",
                    }))
                  }
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    toolPolicyDraft.mode === "allowlist"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Allowlist
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Allow List</label>
              <input
                className={inputClass}
                placeholder="tool_name_a, tool_name_b"
                value={allowInput}
                onChange={(e) => setAllowInput(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground mt-1 ml-1">
                Comma-separated list of allowed tools
              </p>
            </div>
            <div>
              <label className={labelClass}>Deny List</label>
              <input
                className={inputClass}
                placeholder="tool_name_x, tool_name_y"
                value={denyInput}
                onChange={(e) => setDenyInput(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground mt-1 ml-1">
                Comma-separated list of blocked tools
              </p>
            </div>
          </div>
        </div>

        {/* Wasm Skills Registry */}
        <div className="rounded-xl border border-border/20 bg-card/10 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                Wasm Skill Sandbox
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                Install and manage third-party skills (hash/signature verified,
                fail-closed runtime).
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onPress={loadInstalledSkills}
              isDisabled={isLoadingSkills}
            >
              {isLoadingSkills ? "Refreshing..." : "Refresh"}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-white/5 bg-background/20 p-4 space-y-3">
              <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Install Local Skill
              </div>
              <input
                className={inputClass}
                value={localSkillDir}
                onChange={(e) => setLocalSkillDir(e.target.value)}
                placeholder="/path/to/skill-folder"
              />
              <div className="flex items-center justify-between rounded-lg border border-white/5 bg-black/20 px-3 py-2">
                <span className="text-xs text-foreground">
                  Allow unsigned dev install
                </span>
                <NeuralSwitch
                  checked={allowUnsignedDevInstall}
                  onChange={setAllowUnsignedDevInstall}
                />
              </div>
              <Button
                size="sm"
                onPress={handleInstallLocalSkill}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Install Local
              </Button>
            </div>

            <div className="rounded-lg border border-white/5 bg-background/20 p-4 space-y-3">
              <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Install From ATM
              </div>
              <input
                className={inputClass}
                value={remoteBaseUrl}
                onChange={(e) => setRemoteBaseUrl(e.target.value)}
                placeholder="https://rainy-atm..."
              />
              <input
                className={inputClass}
                value={remoteSkillId}
                onChange={(e) => setRemoteSkillId(e.target.value)}
                placeholder="skill-id"
              />
              <Button
                size="sm"
                onPress={handleInstallFromAtm}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Install From ATM
              </Button>
            </div>
          </div>

          {installedSkills.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-6 border border-dashed border-border/20 rounded-lg">
              {isLoadingSkills
                ? "Loading installed skills..."
                : "No third-party skills installed."}
            </div>
          ) : (
            <div className="space-y-3">
              {installedSkills.map((skill) => (
                <div
                  key={`${skill.id}@${skill.version}`}
                  className="rounded-lg border border-white/5 bg-background/20 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground">
                          {skill.name}
                        </span>
                        <NeuralChip variant="flat" className="bg-white/10">
                          {skill.id}@{skill.version}
                        </NeuralChip>
                        <NeuralChip
                          variant="flat"
                          className={
                            skill.trustState === "verified"
                              ? "bg-emerald-500/15 text-emerald-300"
                              : "bg-amber-500/15 text-amber-300"
                          }
                        >
                          {skill.trustState}
                        </NeuralChip>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {skill.author} • {skill.runtime} • {skill.installSource}
                      </div>
                      {skill.description && (
                        <div className="text-xs text-muted-foreground">
                          {skill.description}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <NeuralSwitch
                        checked={skill.enabled}
                        onChange={(enabled) => handleToggleSkill(skill, enabled)}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onPress={() => handleRemoveSkill(skill)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-lg border border-white/5 bg-black/20 p-3">
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                        Permissions
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>
                          FS:{" "}
                          {skill.permissions.filesystem.length > 0
                            ? skill.permissions.filesystem
                                .map(
                                  (p) =>
                                    `${p.guestPath}→${p.hostPath} (${p.mode})`,
                                )
                                .join(", ")
                            : "none"}
                        </div>
                        <div>
                          Net:{" "}
                          {skill.permissions.networkDomains.length > 0
                            ? skill.permissions.networkDomains.join(", ")
                            : "none"}
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg border border-white/5 bg-black/20 p-3">
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                        Methods
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        {skill.methods.map((method) => (
                          <div key={`${skill.id}-${method.name}`}>
                            {method.name} (L{method.airlockLevel})
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audit Log */}
        <div className="rounded-xl border border-border/20 bg-card/10 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              Policy Audit Log
            </h4>
            <span className="text-xs text-muted-foreground font-mono">
              {isLoadingPolicyAudit
                ? "loading..."
                : `${policyAuditEvents.length} events`}
            </span>
          </div>

          {policyAuditEvents.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-6 border border-dashed border-border/20 rounded-lg">
              No audit events recorded.
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
              {policyAuditEvents.map((event) => (
                <div
                  key={event.id}
                  className="rounded-lg border border-white/5 bg-background/20 p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-foreground">
                      {event.eventType}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {new Date(event.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono mb-2">
                    Actor: {event.actor}
                  </div>
                  {event.metadata?.changedKeys &&
                    Array.isArray(event.metadata.changedKeys) &&
                    event.metadata.changedKeys.length > 0 && (
                      <div className="space-y-1 bg-black/20 rounded p-2">
                        {(event.metadata.changedKeys as string[]).map((key) => (
                          <div
                            key={`${event.id}-${key}`}
                            className="text-[10px] text-muted-foreground font-mono flex items-center gap-2"
                          >
                            <span className="opacity-70">{key}:</span>
                            <span className="text-red-400">
                              {formatPolicyValue(
                                (
                                  event.previous as Record<
                                    string,
                                    unknown
                                  > | null
                                )?.[key],
                              )}
                            </span>
                            <span className="opacity-50">→</span>
                            <span className="text-green-400">
                              {formatPolicyValue(
                                (
                                  event.next as Record<string, unknown> | null
                                )?.[key],
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
