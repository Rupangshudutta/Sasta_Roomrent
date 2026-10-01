import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

/** The prototype's `.section-title`: bold heading with a 70×4px red underline. */
export function SectionTitle({
  children,
  align = "left",
  as: Tag = "h2",
  className,
}: {
  children: ReactNode;
  align?: "left" | "center";
  as?: "h1" | "h2" | "h3";
  className?: string;
}) {
  return (
    <Tag
      className={cn(
        "text-ink relative mb-10 pb-4 text-2xl font-semibold sm:text-3xl",
        "after:bg-primary after:absolute after:bottom-0 after:h-1 after:w-[70px] after:rounded-sm after:content-['']",
        align === "center" ? "text-center after:left-1/2 after:-translate-x-1/2" : "after:left-0",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
