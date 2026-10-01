import { describe, expect, it } from "vitest";

import { EnvValidationError, missingForCapability, parsePublicEnv, parseServerEnv } from "./env";

const validPublic = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
};

describe("parsePublicEnv", () => {
  it("accepts a minimal valid configuration and applies defaults", () => {
    const env = parsePublicEnv(validPublic);
    expect(env.NEXT_PUBLIC_SITE_URL).toBe("http://localhost:3000");
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe(validPublic.NEXT_PUBLIC_SUPABASE_URL);
  });

  it("rejects a missing Supabase URL with a readable message", () => {
    expect(() => parsePublicEnv({ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "x" })).toThrow(
      EnvValidationError,
    );
    expect(() => parsePublicEnv({ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "x" })).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL/,
    );
  });

  it("rejects a publishable key accidentally placed in the URL slot", () => {
    expect(() =>
      parsePublicEnv({ ...validPublic, NEXT_PUBLIC_SUPABASE_URL: "sb_publishable_oops" }),
    ).toThrow(EnvValidationError);
  });
});

describe("parseServerEnv", () => {
  it("defaults PAYMENTS_ENABLED to false and parses the string 'true'", () => {
    expect(parseServerEnv({}).PAYMENTS_ENABLED).toBe(false);
    expect(parseServerEnv({ PAYMENTS_ENABLED: "true" }).PAYMENTS_ENABLED).toBe(true);
  });

  it("rejects non-boolean flag values instead of silently treating them as false", () => {
    expect(() => parseServerEnv({ PAYMENTS_ENABLED: "yes" })).toThrow(EnvValidationError);
  });
});

describe("missingForCapability", () => {
  it("lists exactly the unset names for a capability", () => {
    expect(missingForCapability("payments", { RAZORPAY_KEY_ID: "a" })).toEqual([
      "RAZORPAY_KEY_SECRET",
      "RAZORPAY_WEBHOOK_SECRET",
      "NEXT_PUBLIC_RAZORPAY_KEY_ID",
    ]);
  });

  it("returns an empty list when everything is present", () => {
    expect(missingForCapability("email", { RESEND_API_KEY: "a", EMAIL_FROM: "b" })).toEqual([]);
  });
});
