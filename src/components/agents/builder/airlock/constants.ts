import type { AirlockLevel } from "../../../../types/airlock";

export const sectionTitleClass =
  "text-[10px] font-bold uppercase tracking-widest text-muted-foreground";

export const inputClass =
  "w-full bg-card/40 hover:bg-card/60 backdrop-blur-md rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 leading-relaxed border border-border/20 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all shadow-sm";

export const LEVELS: Array<{
  level: AirlockLevel;
  title: string;
  tone: string;
  modalBehavior: string;
}> = [
  {
    level: 0,
    title: "Safe",
    tone: "text-emerald-500",
    modalBehavior: "Auto-approved (no modal)",
  },
  {
    level: 1,
    title: "Sensitive",
    tone: "text-amber-500",
    modalBehavior: "Approval modal (notification gate)",
  },
  {
    level: 2,
    title: "Dangerous",
    tone: "text-red-500",
    modalBehavior: "Explicit approval modal required",
  },
];
