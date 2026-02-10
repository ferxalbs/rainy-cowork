import { Input, TextArea } from "@heroui/react";
import { AgentSoul } from "../../../types/agent-spec";

interface SoulEditorProps {
  soul: AgentSoul;
  onChange: (soul: AgentSoul) => void;
}

export function SoulEditor({ soul, onChange }: SoulEditorProps) {
  const handleChange = (field: keyof AgentSoul, value: string) => {
    onChange({
      ...soul,
      [field]: value,
    });
  };

  // Minimalist Input Wrapper for the "Clean" look
  const Field = ({
    label,
    children,
  }: {
    label: string;
    children: React.ReactNode;
  }) => (
    <div className="group">
      <label className="block text-zinc-500 group-hover:text-[#bef264] text-[10px] font-bold uppercase tracking-widest mb-2 transition-colors duration-300">
        {label}
      </label>
      {children}
    </div>
  );

  return (
    <div className="space-y-8 animate-appear">
      {/* Header Section */}
      <div className="flex flex-col gap-1 border-b border-white/5 pb-6">
        <h3 className="text-2xl font-bold text-white tracking-tight">
          Identity
        </h3>
        <p className="text-zinc-500 text-sm">
          Define the core persona and purpose.
        </p>
      </div>

      <div className="space-y-6">
        {/* Core Info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-3">
            <Field label="Name">
              <Input
                placeholder="e.g. Neo"
                value={soul.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="w-full"
                classNames={{
                  input:
                    "text-lg font-bold text-white placeholder:text-zinc-700",
                  inputWrapper:
                    "bg-transparent shadow-none border-b border-white/10 hover:border-[#bef264]/50 focus-within:border-[#bef264] transition-colors rounded-none px-0 h-10 after:hidden",
                }}
              />
            </Field>
          </div>
          <div>
            <Field label="Version">
              <Input
                placeholder="1.0.0"
                value={soul.version}
                onChange={(e) => handleChange("version", e.target.value)}
                className="w-full"
                classNames={{
                  input:
                    "text-sm font-mono text-[#bef264] placeholder:text-zinc-800",
                  inputWrapper:
                    "bg-transparent shadow-none border-b border-white/10 hover:border-white/30 transition-colors rounded-none px-0 h-10 after:hidden",
                }}
              />
            </Field>
          </div>
        </div>

        <Field label="Description">
          <TextArea
            placeholder="What is this agent's primary directive?"
            value={soul.description}
            onChange={(e) => handleChange("description", e.target.value)}
            classNames={{
              input:
                "text-sm text-zinc-300 placeholder:text-zinc-700 leading-relaxed",
              inputWrapper:
                "bg-[#121212] hover:bg-[#151515] rounded-xl px-3 py-2 shadow-none border border-white/5 transition-colors group-hover:border-white/10",
            }}
            minRows={2}
          />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Field label="Personality">
            <TextArea
              placeholder="e.g. Stoic, precise, efficient"
              value={soul.personality}
              onChange={(e) => handleChange("personality", e.target.value)}
              classNames={{
                input:
                  "text-sm text-zinc-300 placeholder:text-zinc-700 leading-relaxed",
                inputWrapper:
                  "bg-[#121212] hover:bg-[#151515] rounded-xl px-3 py-2 shadow-none border border-white/5 transition-colors group-hover:border-white/10",
              }}
              minRows={2}
            />
          </Field>
          <Field label="Tone">
            <TextArea
              placeholder="e.g. Formal, academic, witty"
              value={soul.tone}
              onChange={(e) => handleChange("tone", e.target.value)}
              classNames={{
                input:
                  "text-sm text-zinc-300 placeholder:text-zinc-700 leading-relaxed",
                inputWrapper:
                  "bg-[#121212] hover:bg-[#151515] rounded-xl px-3 py-2 shadow-none border border-white/5 transition-colors group-hover:border-white/10",
              }}
              minRows={2}
            />
          </Field>
        </div>

        <div className="pt-6 border-t border-white/5">
          <Field label="Soul Content (System Prompt)">
            <div className="bg-[#121212] rounded-xl border border-white/5 p-1 group-hover:border-white/10 transition-colors">
              <TextArea
                aria-label="Soul Content"
                placeholder="# Directives..."
                value={soul.soul_content}
                onChange={(e) => handleChange("soul_content", e.target.value)}
                classNames={{
                  input:
                    "font-mono text-xs leading-relaxed text-[#bef264]/90 placeholder:text-zinc-800",
                  inputWrapper: "bg-transparent shadow-none",
                }}
                minRows={12}
              />
            </div>
          </Field>
        </div>
      </div>
    </div>
  );
}
