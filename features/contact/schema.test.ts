import { describe, expect, it } from "vitest";

import { contactMessageSchema } from "./schema";

const valid = {
  name: "Priya Patel",
  phone: "98765 43210",
  email: "priya@example.com",
  interest: "pg",
  message: "Looking for a PG near Hinjewadi from next month.",
  website: "",
};

describe("contactMessageSchema", () => {
  it("accepts a valid submission and normalises the phone", () => {
    const result = contactMessageSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.phone).toBe("9876543210");
  });
  it("rejects an unknown interest and a too-short message", () => {
    expect(contactMessageSchema.safeParse({ ...valid, interest: "villa" }).success).toBe(false);
    expect(contactMessageSchema.safeParse({ ...valid, message: "hi" }).success).toBe(false);
  });
  it("rejects a filled honeypot", () => {
    expect(contactMessageSchema.safeParse({ ...valid, website: "http://spam" }).success).toBe(
      false,
    );
  });
});
