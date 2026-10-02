import { describe, expect, it } from "vitest";

import {
  indianPhoneSchema,
  loginSchema,
  passwordRules,
  passwordSchema,
  registerSchema,
  safeNextPath,
} from "./schema";

const baseRegister = {
  role: "tenant",
  firstName: "Asha",
  lastName: "Rao",
  email: "Asha@Example.com ",
  phone: "+91 98765 43210",
  password: "Str0ng!pass",
  confirmPassword: "Str0ng!pass",
  agreeTerms: "on",
};

describe("indianPhoneSchema", () => {
  it("normalises spaces and a +91 prefix", () => {
    expect(indianPhoneSchema.parse("+91 98765 43210")).toBe("9876543210");
  });
  it("rejects numbers that do not start with 6-9", () => {
    expect(indianPhoneSchema.safeParse("1234567890").success).toBe(false);
  });
  it.each(["09876543210", "+91-98765-43210", "91 98765 43210", " 98765 43210 "])(
    "accepts the phone-keyboard / autofill format %s",
    (input) => {
      expect(indianPhoneSchema.parse(input)).toBe("9876543210");
    },
  );
  it("rejects too few or too many digits", () => {
    expect(indianPhoneSchema.safeParse("987654321").success).toBe(false);
    expect(indianPhoneSchema.safeParse("98765432101").success).toBe(false);
  });
});

describe("passwordSchema", () => {
  it("reports every failing rule at once, not just the first", () => {
    const result = passwordSchema.safeParse("abc");
    expect(result.success).toBe(false);
    const messages = result.error?.issues.map((i) => i.message) ?? [];
    expect(messages).toEqual([
      "Use at least 8 characters",
      "Include an uppercase letter",
      "Include a number",
      "Include a symbol such as @ # ! -",
    ]);
  });
  it("uses the same messages as the checklist rules", () => {
    const messages = passwordSchema.safeParse("").error?.issues.map((i) => i.message) ?? [];
    expect(messages).toEqual(passwordRules.map((r) => r.message));
  });
  it("accepts a phone-generated strong password", () => {
    expect(passwordSchema.safeParse("kudXyp-wobvo4-tazgof").success).toBe(true);
  });
  it.each(["short1!A", "alllowercase1!", "NOUPPER1!", "NoDigits!!", "NoSymbol123"])(
    "rejects %s",
    (pw) => {
      expect(passwordSchema.safeParse(pw).success).toBe(pw === "short1!A");
    },
  );
});

describe("registerSchema", () => {
  it("accepts a tenant and lowercases the email", () => {
    const result = registerSchema.safeParse(baseRegister);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("asha@example.com");
  });
  it("requires business fields for owners", () => {
    const result = registerSchema.safeParse({ ...baseRegister, role: "owner" });
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join("."));
      expect(paths).toContain("businessName");
      expect(paths).toContain("businessType");
    }
  });
  it("never accepts admin as a sign-up role", () => {
    expect(registerSchema.safeParse({ ...baseRegister, role: "admin" }).success).toBe(false);
  });
  it("rejects mismatched passwords and missing consent", () => {
    expect(registerSchema.safeParse({ ...baseRegister, confirmPassword: "x" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...baseRegister, agreeTerms: "" }).success).toBe(false);
  });
});

describe("safeNextPath", () => {
  it("blocks open redirects", () => {
    expect(safeNextPath("https://evil.com", "/dashboard")).toBe("/dashboard");
    expect(safeNextPath("//evil.com", "/dashboard")).toBe("/dashboard");
    expect(safeNextPath("/owner/properties", "/dashboard")).toBe("/owner/properties");
  });
  it("loginSchema rejects absolute next urls", () => {
    expect(
      loginSchema.safeParse({ email: "a@b.co", password: "x", next: "https://x" }).success,
    ).toBe(false);
  });
});
