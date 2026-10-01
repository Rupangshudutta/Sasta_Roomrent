import { describe, expect, it } from "vitest";

import { rateLimitRules } from "./rate-limit.rules";

describe("rate limit rules", () => {
  it("every rule has a positive limit and window and a unique scope", () => {
    const scopes = new Set<string>();
    for (const rule of Object.values(rateLimitRules)) {
      expect(rule.limit).toBeGreaterThan(0);
      expect(rule.windowSeconds).toBeGreaterThan(0);
      expect(scopes.has(rule.scope)).toBe(false);
      scopes.add(rule.scope);
    }
  });

  it("keeps credential endpoints tighter than content endpoints", () => {
    expect(rateLimitRules.forgotPassword.limit).toBeLessThanOrEqual(rateLimitRules.login.limit);
    expect(rateLimitRules.register.limit).toBeLessThanOrEqual(rateLimitRules.bookingRequest.limit);
  });
});
