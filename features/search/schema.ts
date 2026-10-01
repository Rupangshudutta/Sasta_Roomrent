import { z } from "zod";

import {
  furnishingValues,
  genderPreferenceValues,
  propertyTypeValues,
} from "@/features/listings/schema";

/**
 * URL search params → typed filter. Every field falls back to a safe default
 * (`.catch`) so a hand-edited or stale URL never crashes the page; the URL is
 * the single source of truth (shareable, back-button friendly, SSR-rendered).
 */
export const sortValues = ["relevance", "price_low", "price_high", "rating", "newest"] as const;
export type SortValue = (typeof sortValues)[number];

export const sortLabels: Record<SortValue, string> = {
  relevance: "Relevance",
  price_low: "Price: Low to High",
  price_high: "Price: High to Low",
  rating: "Highest Rated",
  newest: "Newest First",
};

const list = <T extends string>(allowed: readonly T[]) =>
  z
    .preprocess(
      (v) => {
        if (v === undefined || v === null || v === "") return [];
        const arr = Array.isArray(v) ? v : String(v).split(",");
        return arr.map((s) => String(s).trim()).filter(Boolean);
      },
      z.array(z.enum(allowed as unknown as [T, ...T[]])),
    )
    .catch([] as T[]);

const optionalNumber = z
  .preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
    z.number().min(0).max(10_000_000).optional(),
  )
  .catch(undefined);

export const searchFilterSchema = z.object({
  q: z.string().trim().max(100).catch(""),
  city: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/)
    .catch(""),
  type: list(propertyTypeValues),
  minRent: optionalNumber,
  maxRent: optionalNumber,
  furnishing: list(furnishingValues),
  gender: z.enum(genderPreferenceValues).catch("any"),
  amenities: z
    .preprocess((v) => {
      if (v === undefined || v === null || v === "") return [];
      const arr = Array.isArray(v) ? v : String(v).split(",");
      return arr.map((s) => String(s).trim()).filter((s) => /^[a-z0-9_]+$/.test(s));
    }, z.array(z.string()))
    .catch([]),
  minRating: z
    .preprocess(
      (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
      z.union([z.literal(3), z.literal(4)]).optional(),
    )
    .catch(undefined),
  sort: z.enum(sortValues).catch("relevance"),
  view: z.enum(["grid", "list"]).catch("grid"),
  page: z.coerce.number().int().min(1).max(500).catch(1),
});

export type SearchFilter = z.infer<typeof searchFilterSchema>;

export const SEARCH_PAGE_SIZE = 9;

/** Serialises a filter back to a query string, omitting defaults for clean URLs. */
export function filterToSearchParams(filter: Partial<SearchFilter>): URLSearchParams {
  const params = new URLSearchParams();
  if (filter.q) params.set("q", filter.q);
  if (filter.city) params.set("city", filter.city);
  filter.type?.forEach((t) => params.append("type", t));
  if (filter.minRent !== undefined) params.set("minRent", String(filter.minRent));
  if (filter.maxRent !== undefined) params.set("maxRent", String(filter.maxRent));
  filter.furnishing?.forEach((f) => params.append("furnishing", f));
  if (filter.gender && filter.gender !== "any") params.set("gender", filter.gender);
  filter.amenities?.forEach((a) => params.append("amenities", a));
  if (filter.minRating) params.set("minRating", String(filter.minRating));
  if (filter.sort && filter.sort !== "relevance") params.set("sort", filter.sort);
  if (filter.view && filter.view !== "grid") params.set("view", filter.view);
  if (filter.page && filter.page > 1) params.set("page", String(filter.page));
  return params;
}

export function countActiveFilters(filter: SearchFilter): number {
  return (
    (filter.q ? 1 : 0) +
    (filter.city ? 1 : 0) +
    filter.type.length +
    (filter.minRent !== undefined || filter.maxRent !== undefined ? 1 : 0) +
    filter.furnishing.length +
    (filter.gender !== "any" ? 1 : 0) +
    filter.amenities.length +
    (filter.minRating ? 1 : 0)
  );
}
