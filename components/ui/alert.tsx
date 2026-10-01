import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

type AlertProps = {
  tone: "error" | "success" | "info";
  title?: string;
  children: ReactNode;
  className?: string;
};

const styles = {
  error: { box: "border-danger/30 bg-danger/5 text-danger", Icon: AlertCircle },
  success: { box: "border-success/30 bg-success/5 text-success", Icon: CheckCircle2 },
  info: { box: "border-secondary/30 bg-tint text-secondary", Icon: Info },
} as const;

export function Alert({ tone, title, children, className }: AlertProps) {
  const { box, Icon } = styles[tone];
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("rounded-card-sm flex gap-3 border px-4 py-3 text-sm", box, className)}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <div className="text-ink">
        {title ? <p className="font-semibold">{title}</p> : null}
        <div>{children}</div>
      </div>
    </div>
  );
}
