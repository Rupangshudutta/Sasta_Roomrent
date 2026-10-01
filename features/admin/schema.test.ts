import { describe, expect, it } from "vitest";

import {
  listingQueueFilterSchema,
  rejectListingSchema,
  userFilterSchema,
  userRoleSchema,
} from "./schema";

const id = "3f1c2d4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f";

describe("admin schemas", () => {
  it("requires a meaningful rejection reason", () => {
    expect(rejectListingSchema.safeParse({ listingId: id, reason: "no" }).success).toBe(false);
    expect(
      rejectListingSchema.safeParse({
        listingId: id,
        reason: "Photos are blurry and the address is incomplete.",
      }).success,
    ).toBe(true);
  });

  it("never allows assigning admin through the role action", () => {
    expect(userRoleSchema.safeParse({ userId: id, role: "admin" }).success).toBe(false);
    expect(userRoleSchema.safeParse({ userId: id, role: "owner" }).success).toBe(true);
  });

  it("falls back to safe defaults for bad query strings", () => {
    expect(listingQueueFilterSchema.parse({ status: "nonsense", page: "-3" })).toEqual({
      status: "pending",
      q: "",
      page: 1,
    });
    expect(userFilterSchema.parse({ role: "x", status: "y", q: "a".repeat(200) })).toMatchObject({
      role: "all",
      status: "all",
      q: "",
    });
  });
});
