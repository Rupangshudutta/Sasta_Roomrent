import { describe, expect, it } from "vitest";

import { listingFormSchema, registerPhotoSchema, toPropertyRow } from "./schema";

const valid = {
  intent: "submit",
  title: "Sunny PG near Forum Mall",
  description: "",
  propertyType: "pg",
  genderPreference: "female",
  furnishing: "semi_furnished",
  rentAmount: "9500",
  securityDeposit: "10000",
  maintenanceAmount: "",
  addressLine1: "12 MG Road, 2nd floor",
  addressLine2: "",
  locality: "Koramangala",
  cityId: "1",
  state: "Karnataka",
  pincode: "560034",
  totalRooms: "3",
  availableRooms: "2",
  availableFrom: "",
  minLeaseMonths: "3",
  houseRules: "No smoking",
  contactPhone: "+91 98765 43210",
  altContactPhone: "",
  amenities: ["wifi", "ac", "wifi"],
};

describe("listingFormSchema", () => {
  it("coerces numbers, normalises phone, dedupes amenities and blanks optional text", () => {
    const result = listingFormSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.rentAmount).toBe(9500);
    expect(result.data.maintenanceAmount).toBe(0);
    expect(result.data.contactPhone).toBe("9876543210");
    expect(result.data.altContactPhone).toBeNull();
    expect(result.data.amenities).toEqual(["wifi", "ac"]);
    expect(result.data.description).toBeNull();
    expect(result.data.availableFrom).toBeNull();
  });

  it("accepts a single amenity checkbox (string, not array)", () => {
    const result = listingFormSchema.safeParse({ ...valid, amenities: "parking" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.amenities).toEqual(["parking"]);
  });

  it("rejects available rooms above total rooms", () => {
    const result = listingFormSchema.safeParse({ ...valid, totalRooms: "1", availableRooms: "2" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0]?.path).toEqual(["availableRooms"]);
  });

  it.each([
    ["rentAmount", "100", /at least ₹500/],
    ["pincode", "012345", /pincode/],
    ["title", "Too short", /10\+/],
    ["cityId", "", /city/i],
  ])("rejects bad %s", (field, value, message) => {
    const result = listingFormSchema.safeParse({ ...valid, [field]: value });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === field && message.test(i.message))).toBe(
        true,
      );
    }
  });

  it("maps to the database row shape", () => {
    const parsed = listingFormSchema.parse(valid);
    const row = toPropertyRow(parsed);
    expect(row).toMatchObject({
      property_type: "pg",
      rent_amount: 9500,
      city_id: 1,
      contact_phone: "9876543210",
      alt_contact_phone: null,
      min_lease_months: 3,
    });
  });
});

describe("registerPhotoSchema", () => {
  const propertyId = "3f1c2d4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f";
  const userId = "9f8e7d6c-5b4a-4392-8170-6f5e4d3c2b1a";
  it("accepts the owner/property/uuid.ext path convention", () => {
    const result = registerPhotoSchema.safeParse({
      propertyId,
      storagePath: `${userId}/${propertyId}/1b2c3d4e-5f6a-4b7c-8d9e-0f1a2b3c4d5e.jpg`,
      width: 1600,
      height: 1200,
      bytes: 400000,
    });
    expect(result.success).toBe(true);
  });
  it("rejects paths outside the convention", () => {
    const result = registerPhotoSchema.safeParse({
      propertyId,
      storagePath: "../etc/passwd",
      width: 10,
      height: 10,
      bytes: 10,
    });
    expect(result.success).toBe(false);
  });
});
