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
    await expect(page.getByText(/Please fix \d+ fields highlighted below\./)).toBeVisible();
    await expect(page.getByText("You must accept the terms to continue")).toBeVisible();
    // Focus moves to the first problem so phone users are not left at the top of the page.
    await expect(page.getByLabel("First name")).toBeFocused();
  });

  test("register keeps correct values after a validation error", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel("First name").fill("Asha");
    await page.getByLabel("Last name").fill("Rao");
    await page.getByLabel("Email address").fill("asha@example.com");
    await page.getByLabel("Mobile number").fill("12345");
    await page.locator("#password").fill("weakpass");
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByText("Enter a valid 10-digit Indian mobile number")).toBeVisible();
    await expect(page.getByLabel("First name")).toHaveValue("Asha");
    await expect(page.getByLabel("Last name")).toHaveValue("Rao");
    await expect(page.getByLabel("Email address")).toHaveValue("asha@example.com");
    await expect(page.locator("#password")).toHaveValue("weakpass");

    // Fixing a field clears its message without resubmitting.
    await page.getByLabel("Mobile number").fill("098765 43210");
    await expect(page.getByText("Enter a valid 10-digit Indian mobile number")).toHaveCount(0);
  });

  test("password checklist lists every unmet rule and updates live", async ({ page }) => {
    await page.goto("/register");
    const rules = page.getByRole("list", { name: "Password requirements" });
    await page.locator("#password").fill("abc");
    await expect(rules.getByText("At least 8 characters (not met)")).toBeAttached();
    await expect(rules.getByText("One uppercase letter (A-Z) (not met)")).toBeAttached();
    await expect(rules.getByText("One number (0-9) (not met)")).toBeAttached();
    await expect(rules.getByText("One lowercase letter (a-z) (met)")).toBeAttached();

    await page.getByRole("button", { name: "Create account" }).click();
    await expect(
      page.getByText("Your password is missing 4 of the requirements below"),
    ).toBeVisible();

    await page.locator("#password").fill("Abcdefg1!");
    await expect(rules.getByText("(not met)")).toHaveCount(0);
    await expect(page.getByText(/Your password is missing/)).toHaveCount(0);
  });

  test("password visibility toggles without losing the value", async ({ page }) => {
    await page.goto("/login");
    const password = page.locator("#password");
    await password.fill("S3cret!pass");
    await expect(password).toHaveAttribute("type", "password");
    await page.getByRole("button", { name: "Show password" }).click();
    await expect(password).toHaveAttribute("type", "text");
    await expect(password).toHaveValue("S3cret!pass");
    await page.getByRole("button", { name: "Hide password" }).click();
    await expect(password).toHaveAttribute("type", "password");
  });

  test("login keeps the email after the server rejects the sign-in", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email address").fill("someone@example.com");
    await page.locator("#password").fill("Wrong!pass1");
    await page.getByRole("button", { name: "Sign in" }).click();
    // Whatever the auth server answers, the round trip must not wipe the form.
    await expect(page.getByRole("alert").first()).toBeVisible();
    await expect(page.getByLabel("Email address")).toHaveValue("someone@example.com");
  });

  test("login rejects an invalid email before contacting the auth server", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email address").fill("not-an-email");
    await page.locator("#password").fill("whatever");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByText("Enter a valid email address")).toBeVisible();
  });
});

test.describe("auth forms on a phone", () => {
  test.use({ viewport: { width: 375, height: 740 }, isMobile: true, hasTouch: true });

  test("inputs use 16px text so iOS does not zoom on focus", async ({ page }) => {
    await page.goto("/register");
    for (const label of ["First name", "Email address", "Mobile number"]) {
      const size = await page
        .getByLabel(label)
        .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
      expect(size, label).toBeGreaterThanOrEqual(16);
    }
    const password = page.locator("#password");
    expect(
      await password.evaluate((el) => parseFloat(getComputedStyle(el).fontSize)),
    ).toBeGreaterThanOrEqual(16);
    await expect(page.getByLabel("Email address")).toHaveAttribute("autocapitalize", "none");
    await expect(page.getByLabel("Mobile number")).toHaveAttribute("inputmode", "tel");
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
