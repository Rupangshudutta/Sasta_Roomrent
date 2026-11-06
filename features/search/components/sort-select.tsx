"use client";

import type { Route } from "next";

import { useRouter } from "next/navigation";

import { Select } from "@/components/ui/dropdown";

import { sortLabels, sortValues, type SortValue } from "../schema";

const sortOptions = sortValues.map((value) => ({ value, label: sortLabels[value] }));

/** Changes the sort by navigating to the same URL with a new `sort` param. */
export function SortSelect({ current, baseParams }: { current: SortValue; baseParams: string }) {
  const router = useRouter();
  return (
    <div className="inline-flex items-center gap-2 text-sm">
      <label htmlFor="sort-by" className="text-muted shrink-0">
        Sort by
      </label>
      <div className="w-48">
        <Select
          id="sort-by"
          label="Sort by"
          options={sortOptions}
          defaultValue={current}
          onValueChange={(value) => {
            const params = new URLSearchParams(baseParams);
            params.delete("page");
            if (value === "relevance") params.delete("sort");
            else params.set("sort", value);
            router.push(`/properties${params.toString() ? `?${params}` : ""}` as Route);
          }}
          className="px-3 py-1.5 sm:text-sm"
        />
      </div>
    </div>
  );
}
