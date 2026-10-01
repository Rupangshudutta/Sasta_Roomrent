import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  Icon,
  title,
  body,
  action,
}: {
  Icon: LucideIcon;
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-card border-border bg-surface flex flex-col items-center border border-dashed px-6 py-12 text-center">
      <span className="bg-primary/10 text-primary flex h-14 w-14 items-center justify-center rounded-full">
        <Icon className="h-7 w-7" aria-hidden />
      </span>
      <p className="mt-4 text-lg font-semibold">{title}</p>
      {body ? <p className="text-muted mt-1 max-w-md text-sm">{body}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
