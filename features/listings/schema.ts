import { z } from "zod";

import { indianPhoneSchema } from "@/features/auth/schema";

/**
 * Listing form validation. Mirrors the database constraints in
 * supabase/migrations/0005 so the user sees a field error before the
 * database would reject the row, and the database stays the final authority.
 *
 * Numbers arrive as strings from FormData, hence z.coerce.
 */

export const propertyTypeValues = ["pg", "shared_room", "single_room", "flat", "hostel"] as const;
export const furnishingValues = ["furnished", "semi_furnished", "unfurnished"] as const;
export const genderPreferenceValues = ["any", "male", "female"] as const;
export const listingIntentValues = ["draft", "submit"] as const;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Use at most ${max} characters`)
    .transform((v) => (v.length === 0 ? null : v))
    .nullable()
    .optional();

const money = (label: string, min: number) =>
  z.coerce
    .number({ message: `${label} must be a number` })
    .min(
      min,
      min > 0
        ? `${label} must be at least ₹${min.toLocaleString("en-IN")}`
        : `${label} cannot be negative`,
    )
    .max(10_000_000, `${label} looks too large`);

const optionalMoney = (label: string) =>
  z.preprocess((v) => (v === "" || v === undefined || v === null ? 0 : v), money(label, 0));

export const listingFormSchema = z
  .object({
    intent: z.enum(listingIntentValues).default("draft"),
    title: z
      .string()
      .trim()
      .min(10, "Give the listing a descriptive title (10+ characters)")
      .max(150, "Use at most 150 characters"),
    description: optionalText(5000),
    propertyType: z.enum(propertyTypeValues, { message: "Select a property type" }),
    genderPreference: z.enum(genderPreferenceValues).default("any"),
    furnishing: z.enum(furnishingValues).default("unfurnished"),
    rentAmount: money("Monthly rent", 500),
    securityDeposit: optionalMoney("Security deposit"),
    maintenanceAmount: optionalMoney("Maintenance"),
    addressLine1: z
      .string()
      .trim()
      .min(5, "Enter the full address")
      .max(255, "Use at most 255 characters"),
    addressLine2: optionalText(255),
    locality: z
      .string()
      .trim()
      .min(2, "Enter the area or locality")
      .max(100, "Use at most 100 characters"),
    cityId: z.coerce.number({ message: "Select a city" }).int().positive("Select a city"),
    state: z.string().trim().min(2, "Enter the state").max(100, "Use at most 100 characters"),
    pincode: z
      .string()
      .trim()
      .regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit pincode"),
    totalRooms: z.coerce
      .number({ message: "Enter the number of rooms" })
      .int()
      .min(1, "At least 1 room")
      .max(500, "At most 500 rooms"),
    availableRooms: z.coerce
      .number({ message: "Enter available rooms" })
      .int()
      .min(0, "Cannot be negative")
      .max(500),
    availableFrom: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a date")
      .nullable()
      .optional()
      .or(z.literal("").transform(() => null)),
    minLeaseMonths: z.coerce
      .number()
      .int()
      .min(1, "At least 1 month")
      .max(24, "At most 24 months")
      .default(1),
    houseRules: optionalText(2000),
    contactPhone: indianPhoneSchema,
    altContactPhone: z
      .string()
      .trim()
      .transform((v) => (v.length === 0 ? null : v))
      .nullable()
      .optional()
      .pipe(indianPhoneSchema.nullable().optional()),
    amenities: z
      .preprocess(
        (v) => (v === undefined ? [] : Array.isArray(v) ? v : [v]),
        z.array(z.string().regex(/^[a-z0-9_]+$/)),
      )
      .transform((v) => Array.from(new Set(v))),
  })
  .refine((v) => v.availableRooms <= v.totalRooms, {
    path: ["availableRooms"],
    message: "Available rooms cannot exceed total rooms",
  });

export type ListingFormInput = z.input<typeof listingFormSchema>;
export type ListingFormValues = z.output<typeof listingFormSchema>;

/** Maps validated form values to the properties table shape (snake_case). */
export function toPropertyRow(values: ListingFormValues) {
  return {
    title: values.title,
    description: values.description ?? null,
    property_type: values.propertyType,
    gender_preference: values.genderPreference,
    furnishing: values.furnishing,
    rent_amount: values.rentAmount,
    security_deposit: values.securityDeposit,
    maintenance_amount: values.maintenanceAmount,
    address_line1: values.addressLine1,
    address_line2: values.addressLine2 ?? null,
    locality: values.locality,
    city_id: values.cityId,
    state: values.state,
    pincode: values.pincode,
    total_rooms: values.totalRooms,
    available_rooms: values.availableRooms,
    available_from: values.availableFrom ?? null,
    min_lease_months: values.minLeaseMonths,
    house_rules: values.houseRules ?? null,
    contact_phone: values.contactPhone,
    alt_contact_phone: values.altContactPhone ?? null,
  };
}

/** Photo rules shared by the client uploader and the server registration action. */
export const photoRules = {
  maxFiles: 10,
  maxSourceBytes: 5 * 1024 * 1024,
  targetBytes: 1.2 * 1024 * 1024,
  maxEdge: 1600,
  acceptedTypes: ["image/jpeg", "image/png", "image/webp"],
} as const;

export const registerPhotoSchema = z.object({
  propertyId: z.uuid(),
  storagePath: z
    .string()
    .regex(
      /^[0-9a-f-]{36}\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|jpeg|png|webp)$/,
      "Unexpected photo path",
    ),
  width: z.number().int().positive().max(10000),
  height: z.number().int().positive().max(10000),
  bytes: z.number().int().positive().max(photoRules.maxSourceBytes),
});

export type RegisterPhotoInput = z.infer<typeof registerPhotoSchema>;
