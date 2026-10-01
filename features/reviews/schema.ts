import { z } from "zod";

export const reviewSchema = z.object({
  bookingId: z.uuid(),
  rating: z.coerce
    .number({ message: "Pick a star rating" })
    .int()
    .min(1, "Pick a star rating")
    .max(5, "Pick a star rating"),
  title: z
    .string()
    .trim()
    .max(120, "Keep the title under 120 characters")
    .optional()
    .or(z.literal("")),
  comment: z
    .string()
    .trim()
    .min(20, "Tell other tenants a little more (at least 20 characters)")
    .max(2000, "Keep it under 2000 characters"),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
