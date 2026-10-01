import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

/** White 15px-radius panel used across dashboards (the prototype's `.card`). */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-card border-border/60 border bg-white shadow-[0_4px_16px_rgba(0,0,0,0.04)]",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-border/60 flex flex-wrap items-start justify-between gap-3 border-b px-6 py-4",
        className,
      )}
    >
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        {description ? <p className="text-muted mt-0.5 text-sm">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 py-5", className)} {...props} />;
}
