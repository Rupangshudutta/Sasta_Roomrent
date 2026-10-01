import { expect, test } from "@playwright/test";

/**
 * Auth surface tests that do not need a live Supabase project: rendering,
 * client-side validation messages from the Server Action, and route guards.
 * The full sign-up → confirm → sign-in loop runs against a deploy preview
 * (PLAYWRIGHT_BASE_URL) once Supabase credentials are available in CI.
 */
test.describe("auth pages", () => {
  test("login page renders the split card and links", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Sign In" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Forgot password?" })).toHaveAttribute(
      "href",
      "/forgot-password",
    );
    await expect(page.getByRole("link", { name: "Create an account" })).toHaveAttribute(
      "href",
      "/register",
    );
  });

  test("register page switches owner fields on and validates server-side", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { name: "Create Account" })).toBeVisible();
    await expect(page.getByLabel("Business / owner name")).toHaveCount(0);

    await page.getByText("I'm a property owner").click();
    await expect(page.getByLabel("Business / owner name")).toBeVisible();

    await page.getByRole("button", { name: "Create account" }).click();
    await expect(page.getByText("Please fix the highlighted fields.")).toBeVisible();
    await expect(page.getByText("You must accept the terms to continue")).toBeVisible();
  });

  test("login rejects an invalid email before contacting the auth server", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email address").fill("not-an-email");
    await page.getByLabel("Password").fill("whatever");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Enter a valid email address")).toBeVisible();
  });
});

test.describe("route guards", () => {
  for (const area of [
    "/dashboard",
    "/owner",
    "/admin",
    "/admin/listings",
    "/notifications",
    "/dashboard/profile",
    "/owner/profile",
  ] as const) {
    test(`${area} redirects anonymous visitors to login with next=`, async ({ page }) => {
      await page.goto(area);
      await expect(page).toHaveURL(new RegExp(`/login\\?next=${encodeURIComponent(area)}`));
    });
  }
});
