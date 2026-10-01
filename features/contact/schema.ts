import { z } from "zod";

import { emailSchema, indianPhoneSchema } from "@/features/auth/schema";

export const contactInterestOptions = [
  { value: "pg", label: "PG Accommodation" },
  { value: "shared", label: "Shared Room" },
  { value: "single", label: "Single Room" },
  { value: "flat", label: "Flat/Apartment" },
  { value: "owner", label: "I'm a Property Owner" },
  { value: "other", label: "Other Query" },
] as const;

export const contactMessageSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(100, "Too long"),
  phone: indianPhoneSchema,
  email: emailSchema,
  interest: z.enum(["pg", "shared", "single", "flat", "owner", "other"], {
    message: "Select what you are looking for",
  }),
  message: z
    .string()
    .trim()
    .min(5, "Tell us a little more (at least 5 characters)")
    .max(5000, "Please keep it under 5000 characters"),
  // Honeypot: real users never fill this hidden field.
  website: z.string().max(0).optional().or(z.literal("")),
});

export type ContactMessageInput = z.infer<typeof contactMessageSchema>;
