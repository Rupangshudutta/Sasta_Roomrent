import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils/cn";

/** Dashboard KPI tile (the prototype's `.stat-card`). */
export function StatTile({
  label,
  value,
  Icon,
  tone = "primary",
  hint,
}: {
  label: string;
  value: string | number;
  Icon: LucideIcon;
  tone?: "primary" | "secondary" | "success" | "warning";
  hint?: string;
}) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-tint text-secondary",
    success: "bg-success/10 text-success",
    warning: "bg-warning/20 text-[#7a5a00]",
  } as const;
  return (
    <div className="rounded-card border-border/60 flex items-center gap-4 border bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
      <span
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
          tones[tone],
        )}
      >
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-muted truncate text-sm">{label}</p>
        {hint ? <p className="text-muted text-xs">{hint}</p> : null}
      </div>
    </div>
  );
}
