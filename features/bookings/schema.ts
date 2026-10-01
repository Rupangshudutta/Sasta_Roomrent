import { z } from "zod";

/** Today's date in Asia/Kolkata as YYYY-MM-DD, so "not in the past" matches what Indian users see. */
export function todayIst(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

export const requestBookingSchema = z.object({
  propertyId: z.uuid(),
  moveInDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a move-in date")
    .refine((d) => d >= todayIst(), "Move-in date cannot be in the past")
    .refine((d) => {
      const max = new Date();
      max.setDate(max.getDate() + 180);
      return d <= max.toISOString().slice(0, 10);
    }, "Pick a date within the next 6 months"),
  leaseMonths: z.coerce
    .number({ message: "Enter the number of months" })
    .int()
    .min(1, "At least 1 month")
    .max(36, "At most 36 months"),
  message: z
    .string()
    .trim()
    .max(1000, "Keep your message under 1000 characters")
    .optional()
    .or(z.literal("")),
});

export type RequestBookingInput = z.infer<typeof requestBookingSchema>;

export const bookingDecisionValues = [
  "accept",
  "reject",
  "activate",
  "complete",
  "cancel",
] as const;
export type BookingDecision = (typeof bookingDecisionValues)[number];

export const decideBookingSchema = z.object({
  bookingId: z.uuid(),
  decision: z.enum(bookingDecisionValues),
  note: z
    .string()
    .trim()
    .max(1000, "Keep the note under 1000 characters")
    .optional()
    .or(z.literal("")),
});

/** Which status each decision moves to; the database trigger decides who may do it. */
export const decisionTargets = {
  accept: "accepted",
  reject: "rejected",
  activate: "active",
  complete: "completed",
  cancel: "cancelled",
} as const;

export function estimateTotal(rent: number, deposit: number, months: number) {
  return rent * months + deposit;
}
