"use client";

import { useRouter } from "next/navigation";

import { sortLabels, sortValues, type SortValue } from "../schema";

/** Changes the sort by navigating to the same URL with a new `sort` param. */
export function SortSelect({ current, baseParams }: { current: SortValue; baseParams: string }) {
  const router = useRouter();
  return (
    <label className="inline-flex items-center gap-2 text-sm">
      <span className="text-muted">Sort by</span>
      <select
        value={current}
        onChange={(e) => {
          const params = new URLSearchParams(baseParams);
          params.delete("page");
          if (e.target.value === "relevance") params.delete("sort");
          else params.set("sort", e.target.value);
          router.push(`/properties${params.toString() ? `?${params}` : ""}`);
        }}
        className="rounded-card-sm border-border focus:border-primary border bg-white px-3 py-1.5 text-sm focus:outline-none"
      >
        {sortValues.map((v) => (
          <option key={v} value={v}>
            {sortLabels[v]}
          </option>
        ))}
      </select>
    </label>
  );
}
