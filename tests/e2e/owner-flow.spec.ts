import { expect, test } from "@playwright/test";

/**
 * Live owner flow against a deployed environment with a real Supabase project.
 * Runs only when credentials for a confirmed OWNER account are provided:
 *   PLAYWRIGHT_BASE_URL=https://<deploy> E2E_OWNER_EMAIL=... E2E_OWNER_PASSWORD=... npm run test:e2e
 * Skipped otherwise (local sandbox cannot reach Supabase).
 */
const email = process.env.E2E_OWNER_EMAIL;
const password = process.env.E2E_OWNER_PASSWORD;

test.describe("owner listing flow (live)", () => {
  test.skip(!email || !password, "E2E_OWNER_EMAIL / E2E_OWNER_PASSWORD not set");

  test("create a draft, upload a photo, submit for review, withdraw, delete", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email address").fill(email!);
    await page.locator("#password").fill(password!);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/owner/);

    await page.goto("/owner/properties/new");
    const title = `E2E room ${Date.now()}`;
    await page.getByLabel("Listing title").fill(title);
    await page.getByLabel("Property type").selectOption("single_room");
    await page.getByLabel("Monthly rent").fill("8500");
    await page.getByLabel("Address line 1").fill("12 Test Street, 2nd floor");
    await page.getByLabel("City").selectOption({ index: 1 });
    await page.getByLabel("Area / locality").fill("Koramangala");
    await page.getByLabel("State").fill("Karnataka");
    await page.getByLabel("Pincode").fill("560034");
    await page.getByLabel("Contact number").fill("9876543210");
    await page.getByLabel("Free WiFi").check();
    await page.getByRole("button", { name: "Save as draft" }).click();

    await expect(page).toHaveURL(/\/owner\/properties\/[0-9a-f-]{36}\?created=1/);
    await expect(page.getByRole("heading", { name: title })).toBeVisible();
    await expect(page.getByText("Draft")).toBeVisible();

    // Upload a generated 1600x1200 image through the real browser path.
    const png = await page.evaluate(async () => {
      const canvas = document.createElement("canvas");
      canvas.width = 2400;
      canvas.height = 1800;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#EE2E24";
      ctx.fillRect(0, 0, 2400, 1800);
      ctx.fillStyle = "#fff";
      ctx.font = "120px sans-serif";
      ctx.fillText("E2E", 100, 200);
      const blob: Blob = await new Promise((r) => canvas.toBlob((b) => r(b!), "image/png"));
      return Array.from(new Uint8Array(await blob.arrayBuffer()));
    });
    await page
      .locator('input[type="file"]')
      .setInputFiles({ name: "room.png", mimeType: "image/png", buffer: Buffer.from(png) });
    await expect(page.getByText("1 of")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Cover")).toBeVisible();

    await page.getByRole("button", { name: "Submit for review" }).first().click();
    await expect(page.getByText("In review")).toBeVisible();

    await page.getByRole("button", { name: "Withdraw" }).first().click();
    await expect(page.getByText("Draft")).toBeVisible();

    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Delete" }).first().click();
    await expect(page).toHaveURL(/\/owner\/properties\?deleted=1/);
  });
});
