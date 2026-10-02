import { cn } from "@/lib/utils/cn";

/** A pulsing placeholder block. Decorative only; the wrapping region carries the label. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("bg-border/50 rounded-card-sm animate-pulse", className)} />
  );
}

/**
 * Route-level loading states. Next shows these the instant a link is clicked (and
 * prefetches them for links in view), so navigation responds immediately while the
 * server renders the real page.
 */
export function ListingGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-card overflow-hidden bg-white shadow-sm">
          <Skeleton className="h-[220px] rounded-none" />
          <div className="space-y-3 p-5">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-8 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PageLoading({ variant = "public" }: { variant?: "public" | "dashboard" }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(variant === "public" ? "mx-auto w-full max-w-7xl px-4 py-10" : "space-y-6")}
    >
      <span className="sr-only">Loading…</span>
      <Skeleton className="mb-3 h-8 w-64" />
      <Skeleton className="mb-8 h-4 w-96 max-w-full" />
      {variant === "dashboard" ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      ) : (
        <ListingGridSkeleton />
      )}
    </div>
  );
}
