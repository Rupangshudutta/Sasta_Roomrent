import { z } from "zod";

export const rejectListingSchema = z.object({
  listingId: z.uuid(),
  reason: z
    .string()
    .trim()
    .min(10, "Give the owner a clear reason (at least 10 characters)")
    .max(1000, "Keep the reason under 1000 characters"),
});

export const userActiveSchema = z.object({
  userId: z.uuid(),
  active: z.boolean(),
  reason: z
    .string()
    .trim()
    .max(500, "Keep the note under 500 characters")
    .optional()
    .or(z.literal("")),
});

export const userRoleSchema = z.object({
  userId: z.uuid(),
  role: z.enum(["tenant", "owner"], { message: "Only tenant or owner can be assigned here" }),
});

export const listingQueueFilterSchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "inactive", "draft", "all"]).catch("pending"),
  q: z.string().trim().max(100).catch(""),
  page: z.coerce.number().int().min(1).catch(1),
});

export const userFilterSchema = z.object({
  role: z.enum(["tenant", "owner", "admin", "all"]).catch("all"),
  status: z.enum(["active", "blocked", "all"]).catch("all"),
  q: z.string().trim().max(100).catch(""),
  page: z.coerce.number().int().min(1).catch(1),
});

export const PAGE_SIZE = 20;
