import { expect, test } from "@playwright/test";

test.describe("booking request guards", () => {
  test("request page sends visitors to sign in and brings them back", async ({ page }) => {
    const id = "00000000-0000-4000-8000-000000000001";
    await page.goto(`/properties/${id}/request`);
    await expect(page).toHaveURL(
      new RegExp(`/login\\?next=${encodeURIComponent(`/properties/${id}/request`)}`),
    );
  });

  for (const path of ["/dashboard/bookings", "/owner/bookings"] as const) {
    test(`${path} requires sign in`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(new RegExp(`/login\\?next=${encodeURIComponent(path)}`));
    });
  }
});

test.describe("payments webhook", () => {
  test("rejects GET and unsigned POSTs", async ({ request }) => {
    const get = await request.get("/api/payments/webhook");
    expect(get.status()).toBe(405);
    const post = await request.post("/api/payments/webhook", {
      data: { event: "payment.captured" },
      headers: { "x-razorpay-signature": "deadbeef" },
    });
    // 503 when the webhook secret is not configured (local/CI), 400 for a bad signature when it is.
    expect([400, 503]).toContain(post.status());
  });
});
