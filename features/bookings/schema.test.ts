import { describe, expect, it } from "vitest";

import { decideBookingSchema, estimateTotal, requestBookingSchema, todayIst } from "./schema";

const propertyId = "3f1c2d4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f";

function plusDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

describe("requestBookingSchema", () => {
  it("accepts a near-future date and coerces months", () => {
    const r = requestBookingSchema.safeParse({
      propertyId,
      moveInDate: plusDays(7),
      leaseMonths: "6",
      message: "",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.leaseMonths).toBe(6);
  });
  it("rejects past dates, far-future dates and absurd lease lengths", () => {
    expect(
      requestBookingSchema.safeParse({ propertyId, moveInDate: "2020-01-01", leaseMonths: 3 })
        .success,
    ).toBe(false);
    expect(
      requestBookingSchema.safeParse({ propertyId, moveInDate: plusDays(400), leaseMonths: 3 })
        .success,
    ).toBe(false);
    expect(
      requestBookingSchema.safeParse({ propertyId, moveInDate: plusDays(7), leaseMonths: 48 })
        .success,
    ).toBe(false);
  });
  it("todayIst is a calendar date string", () => {
    expect(todayIst()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("decideBookingSchema / estimateTotal", () => {
  it("only accepts known decisions", () => {
    expect(
      decideBookingSchema.safeParse({ bookingId: propertyId, decision: "approve" }).success,
    ).toBe(false);
    expect(
      decideBookingSchema.safeParse({ bookingId: propertyId, decision: "accept", note: "" })
        .success,
    ).toBe(true);
  });
  it("computes rent × months + deposit", () => {
    expect(estimateTotal(15000, 30000, 6)).toBe(120000);
  });
});
