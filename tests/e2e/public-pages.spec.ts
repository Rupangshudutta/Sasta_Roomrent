import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const pages = [
  { path: "/", heading: "Find Your Perfect Long-term Stay" },
  { path: "/locations", heading: "Explore Popular Locations" },
  { path: "/about", heading: "Shouldn't Be This Hard" },
  { path: "/contact", heading: "Get In Touch" },
  { path: "/terms", heading: "Terms of Service" },
  { path: "/privacy", heading: "Privacy Policy" },
  { path: "/safety", heading: "Safety Guidelines" },
] as const;

test.describe("public pages", () => {
  for (const { path, heading } of pages) {
    test(`${path} renders with header, footer and h1`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(heading);
      await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
      await expect(page.getByRole("contentinfo")).toContainText("All rights reserved");
    });
  }

  test("home search box submits to /properties with the chosen filters", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Location").fill("Koramangala");
    await page.getByLabel("Property type").selectOption("pg");
    await page.getByRole("button", { name: "Search" }).click();
    await expect(page).toHaveURL(/\/properties\?q=Koramangala&type=pg/);
  });

  test("contact form validates before sending and keeps the honeypot hidden", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.locator("#website")).toBeHidden();
    await page.getByRole("button", { name: "Send Message" }).click();
    await expect(page.getByText(/Please fix \d+ fields highlighted below\./)).toBeVisible();
    await expect(page.getByText("Enter your name")).toBeVisible();
  });

  test("mobile menu opens and lists the main navigation", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(page.getByRole("navigation", { name: "Main mobile" })).toBeVisible();
    await expect(
      page
        .getByRole("navigation", { name: "Main mobile" })
        .getByRole("link", { name: "Locations" }),
    ).toBeVisible();
  });
});

test.describe("accessibility", () => {
  for (const path of ["/", "/contact", "/login", "/register"] as const) {
    test(`${path} has no serious or critical axe violations`, async ({ page }) => {
      await page.goto(path);
      const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      const blocking = results.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical",
      );
      expect(
        blocking.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`),
      ).toEqual([]);
    });
  }
});
