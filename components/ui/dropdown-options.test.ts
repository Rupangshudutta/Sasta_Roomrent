import { describe, expect, it } from "vitest";

import { filterOptions, findTypeaheadIndex } from "./dropdown-options";

const options = [
  { value: "Koramangala", label: "Koramangala", description: "Bangalore, Karnataka" },
  { value: "Mumbai", label: "Mumbai", description: "Maharashtra" },
  { value: "Navi Bangalore", label: "Navi Bangalore", description: "Karnataka" },
  { value: "Bangalore", label: "Bangalore", description: "Karnataka" },
];

describe("filterOptions", () => {
  it("returns the first options up to the limit for an empty or blank query", () => {
    expect(filterOptions(options, "")).toEqual(options);
    expect(filterOptions(options, "   ", 2)).toEqual(options.slice(0, 2));
  });

  it("ranks prefix matches, then label matches, then description matches", () => {
    expect(filterOptions(options, "bang").map((o) => o.label)).toEqual([
      "Bangalore",
      "Navi Bangalore",
      "Koramangala",
    ]);
  });

  it("ignores case and surrounding spaces", () => {
    expect(filterOptions(options, "  MUMBAI ").map((o) => o.label)).toEqual(["Mumbai"]);
  });

  it("returns nothing when no option matches, so free text stays allowed", () => {
    expect(filterOptions(options, "zzz")).toEqual([]);
  });

  it("applies the limit after ranking", () => {
    expect(filterOptions(options, "bang", 1).map((o) => o.label)).toEqual(["Bangalore"]);
  });
});

describe("findTypeaheadIndex", () => {
  it("finds the first label starting with the typed text", () => {
    expect(findTypeaheadIndex(options, "mu")).toBe(1);
    expect(findTypeaheadIndex(options, "K")).toBe(0);
  });

  it("returns -1 when nothing matches", () => {
    expect(findTypeaheadIndex(options, "x")).toBe(-1);
  });
});
