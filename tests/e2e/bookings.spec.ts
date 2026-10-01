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
