import { describe, expect, it } from "vitest";

import { buildCapabilityReport } from "./health";

describe("buildCapabilityReport", () => {
  it("marks database ok only when both public Supabase vars exist", () => {
    const report = buildCapabilityReport({
      NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "k",
    });
    expect(report.database).toEqual({ ok: true, missing: [] });
    expect(report.payments.ok).toBe(false);
    expect(report.payments.missing).toHaveLength(4);
  });

  it("never includes env values, only names", () => {
    const secret = "sb_secret_abc";
    const report = buildCapabilityReport({ SUPABASE_SECRET_KEY: secret });
    expect(JSON.stringify(report)).not.toContain(secret);
  });
});
