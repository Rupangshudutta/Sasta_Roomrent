import { expect, test } from "@playwright/test";

test.describe("smoke", () => {
  test("home page renders the brand headline", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Find Your Perfect Long-term Stay",
    );
  });

  test("unknown routes show the branded 404", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.getByText("Oops! Page Not Found")).toBeVisible();
  });

  test("health endpoint reports configuration without leaking values", async ({ request }) => {
    const response = await request.get("/api/health");
    expect([200, 503]).toContain(response.status());
    const body = (await response.json()) as {
      status: string;
      capabilities: Record<string, { ok: boolean; missing: string[] }>;
    };
    expect(["ok", "degraded"]).toContain(body.status);
    expect(body.capabilities.database).toBeDefined();
    expect(JSON.stringify(body)).not.toMatch(/sb_secret|rzp_live|re_[A-Za-z0-9]{10,}/);
  });
});
