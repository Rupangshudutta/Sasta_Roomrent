import { expect, test } from "@playwright/test";

test.describe("search", () => {
  test("properties page renders all filters, honours the URL and can clear them", async ({
    page,
  }) => {
    await page.goto("/properties?q=Koramangala&type=pg&maxRent=12000&gender=female&sort=price_low");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Find your long-term stay");
    const sidebar = page.locator("aside").first();
    await expect(sidebar.getByLabel("Area or landmark")).toHaveValue("Koramangala");
    await expect(sidebar.getByLabel("Maximum rent")).toHaveValue("12000");
    await expect(sidebar.getByRole("checkbox", { name: "PG" })).toBeChecked();
    await expect(sidebar.getByRole("radio", { name: "Female" })).toBeChecked();
    await expect(page.getByRole("combobox", { name: /sort by/i })).toHaveValue("price_low");
    await expect(sidebar.getByRole("heading", { name: /Filters/ })).toBeVisible();
    await sidebar.getByRole("link", { name: "Clear all" }).click();
    await expect(page).toHaveURL(/\/properties$/);
  });

  test("applying filters round-trips through the URL", async ({ page }) => {
    await page.goto("/properties");
    const sidebar = page.locator("aside").first();
    await sidebar.getByLabel("Minimum rent").fill("8000");
    await sidebar.getByRole("checkbox", { name: "Flat" }).check();
    await sidebar.getByRole("button", { name: "Apply Filters" }).click();
    await expect(page).toHaveURL(/minRent=8000/);
    await expect(page).toHaveURL(/type=flat/);
  });

  test("mobile filter panel contains the full filter set", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/properties");
    const details = page.locator("details").first();
    await details.locator("summary").click();
    await expect(details.getByLabel("Maximum rent")).toBeVisible();
    await expect(details.getByRole("radio", { name: "Anyone" })).toBeVisible();
  });

  test("unknown listing id shows the 404 page", async ({ page }) => {
    const response = await page.goto("/properties/00000000-0000-4000-8000-000000000000");
    expect(response?.status()).toBe(404);
    await expect(page.getByText("Oops! Page Not Found")).toBeVisible();
  });

  test("saved rooms requires sign in", async ({ page }) => {
    await page.goto("/dashboard/favorites");
    await expect(page).toHaveURL(/\/login\?next=%2Fdashboard%2Ffavorites/);
  });
});
