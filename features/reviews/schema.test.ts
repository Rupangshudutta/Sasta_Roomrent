import { describe, expect, it } from "vitest";

import { reviewSchema } from "./schema";

const bookingId = "3f1c2d4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f";

describe("reviewSchema", () => {
  it("coerces the rating and trims text", () => {
    const r = reviewSchema.safeParse({
      bookingId,
      rating: "4",
      title: "  Clean  ",
      comment: "Quiet building, owner was responsive and fair.",
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.rating).toBe(4);
      expect(r.data.title).toBe("Clean");
    }
  });
  it("rejects out-of-range ratings and short comments", () => {
    expect(reviewSchema.safeParse({ bookingId, rating: 0, comment: "x".repeat(30) }).success).toBe(
      false,
    );
    expect(reviewSchema.safeParse({ bookingId, rating: 6, comment: "x".repeat(30) }).success).toBe(
      false,
    );
    expect(reviewSchema.safeParse({ bookingId, rating: 3, comment: "too short" }).success).toBe(
      false,
    );
  });
});
