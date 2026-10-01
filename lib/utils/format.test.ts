import { describe, expect, it } from "vitest";

import { formatCountPlus, formatInr, formatInrShort } from "./format";

describe("formatInr", () => {
  it("uses Indian grouping and no paise", () => {
    expect(formatInr(12500)).toBe("₹12,500");
    expect(formatInr("125000.00")).toBe("₹1,25,000");
  });
  it("renders a dash for missing or invalid values", () => {
    expect(formatInr(null)).toBe("—");
    expect(formatInr("abc")).toBe("—");
  });
});

describe("formatInrShort", () => {
  it("abbreviates thousands and lakhs", () => {
    expect(formatInrShort(8000)).toBe("₹8K");
    expect(formatInrShort(7500)).toBe("₹7.5K");
    expect(formatInrShort(150000)).toBe("₹1.5L");
    expect(formatInrShort(500)).toBe("₹500");
  });
});

describe("formatCountPlus", () => {
  it("keeps small counts exact and rounds larger ones down with a plus", () => {
    expect(formatCountPlus(3)).toBe("3");
    expect(formatCountPlus(27)).toBe("20+");
    expect(formatCountPlus(2534)).toBe("2,530+");
  });
});
