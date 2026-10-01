import { describe, expect, it } from "vitest";

import { countActiveFilters, filterToSearchParams, searchFilterSchema } from "./schema";

describe("searchFilterSchema", () => {
  it("parses repeated and comma-separated list params", () => {
    const parsed = searchFilterSchema.parse({
      type: ["pg", "flat"],
      amenities: "wifi,ac",
      furnishing: "furnished",
    });
    expect(parsed.type).toEqual(["pg", "flat"]);
    expect(parsed.amenities).toEqual(["wifi", "ac"]);
    expect(parsed.furnishing).toEqual(["furnished"]);
  });

  it("drops unknown values instead of failing", () => {
    const parsed = searchFilterSchema.parse({
      type: "castle",
      sort: "cheapest",
      page: "zero",
      minRating: "9",
      city: "Bad City!",
    });
    expect(parsed.type).toEqual([]);
    expect(parsed.sort).toBe("relevance");
    expect(parsed.page).toBe(1);
    expect(parsed.minRating).toBeUndefined();
    expect(parsed.city).toBe("");
  });

  it("coerces rent bounds and ignores blanks", () => {
    const parsed = searchFilterSchema.parse({ minRent: "10000", maxRent: "" });
    expect(parsed.minRent).toBe(10000);
    expect(parsed.maxRent).toBeUndefined();
  });

  it("round-trips through the URL and counts active filters", () => {
    const filter = searchFilterSchema.parse({
      q: "Koramangala",
      type: "pg",
      maxRent: "12000",
      gender: "female",
      page: "2",
    });
    const qs = filterToSearchParams(filter).toString();
    expect(qs).toBe("q=Koramangala&type=pg&maxRent=12000&gender=female&page=2");
    expect(countActiveFilters(filter)).toBe(4);
  });
});
