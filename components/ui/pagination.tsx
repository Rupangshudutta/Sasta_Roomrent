import type { Route } from "next";
import Link from "next/link";

/** Minimal previous/next pagination driven by a `page` search param. */
export function Pagination({
  page,
  pageSize,
  total,
  makeHref,
}: {
  page: number;
  pageSize: number;
  total: number;
  makeHref: (page: number) => Route;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  const linkClass =
    "rounded-pill border border-border bg-white px-4 py-1.5 text-sm font-medium hover:border-primary/50";
  const disabledClass =
    "rounded-pill border border-border bg-surface px-4 py-1.5 text-sm text-muted";
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-3 pt-2">
      {page > 1 ? (
        <Link href={makeHref(page - 1)} className={linkClass}>
          ← Previous
        </Link>
      ) : (
        <span className={disabledClass}>← Previous</span>
      )}
      <span className="text-muted text-sm">
        Page {page} of {pages} · {total} total
      </span>
      {page < pages ? (
        <Link href={makeHref(page + 1)} className={linkClass}>
          Next →
        </Link>
      ) : (
        <span className={disabledClass}>Next →</span>
      )}
    </nav>
  );
}
