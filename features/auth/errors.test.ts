import {
  AuthApiError,
  AuthRetryableFetchError,
  AuthUnknownError,
  AuthWeakPasswordError,
} from "@supabase/supabase-js";
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";

import { mapSignInError, mapSignUpError } from "./errors";

// Shapes below mirror what auth-js throws: network failures are status 0 and
// 5xx responses lose their error code (AuthRetryableFetchError).
const networkDown = () => new AuthRetryableFetchError("fetch failed", 0);
const serverError = (message: string) => new AuthRetryableFetchError(message, 500);

let consoleError: MockInstance<typeof console.error>;
beforeEach(() => {
  consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  consoleError.mockRestore();
});

/** The JSON log lines written through lib/logging/logger. */
function loggedEvents(): Array<Record<string, unknown>> {
  return consoleError.mock.calls.map(
    ([line]) => JSON.parse(String(line)) as Record<string, unknown>,
  );
}

describe("mapSignInError", () => {
  it("reports wrong credentials without logging them", () => {
    const mapped = mapSignInError(
      new AuthApiError("Invalid login credentials", 400, "invalid_credentials"),
    );
    expect(mapped).toEqual({ code: "unauthenticated", message: "Incorrect email or password." });
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("asks unconfirmed users to confirm their email", () => {
    const mapped = mapSignInError(
      new AuthApiError("Email not confirmed", 400, "email_not_confirmed"),
    );
    expect(mapped.code).toBe("forbidden");
    expect(mapped.message).toMatch(/confirm your email/i);
  });

  it("maps 429 to rate_limited", () => {
    const mapped = mapSignInError(
      new AuthApiError("Request rate limit reached", 429, "over_request_rate_limit"),
    );
    expect(mapped.code).toBe("rate_limited");
  });

  it.each([
    ["network failure (status 0)", networkDown()],
    ["5xx without a code", new AuthRetryableFetchError("Service Unavailable", 503)],
    ["no HTTP response at all", new AuthUnknownError("Unexpected token <", null)],
  ])("never blames the password for a %s, and logs it", (_label, error) => {
    const mapped = mapSignInError(error);
    expect(mapped.code).toBe("upstream");
    expect(mapped.message).not.toMatch(/incorrect/i);
    expect(loggedEvents()).toEqual([
      expect.objectContaining({ level: "error", event: "auth.login failed" }),
    ]);
  });

  it("logs unexpected 4xx codes instead of hiding them", () => {
    const mapped = mapSignInError(new AuthApiError("Captcha failed", 400, "captcha_failed"));
    expect(mapped.code).toBe("unknown");
    expect(loggedEvents()[0]).toMatchObject({ code: "captcha_failed", status: 400 });
  });
});

describe("mapSignUpError", () => {
  it.each(["user_already_exists", "email_exists"])("maps %s to a conflict on email", (code) => {
    const mapped = mapSignUpError(new AuthApiError("User already registered", 422, code));
    expect(mapped.code).toBe("conflict");
    expect(mapped.fieldErrors?.email).toEqual(["Already registered"]);
  });

  it("puts weak-password reasons on the password field", () => {
    const mapped = mapSignUpError(
      new AuthWeakPasswordError("Password is known to be weak", 422, ["pwned"]),
    );
    expect(mapped).toMatchObject({
      code: "validation",
      fieldErrors: { password: [expect.any(String)] },
    });
  });

  it("puts an unusable address on the email field", () => {
    const mapped = mapSignUpError(
      new AuthApiError("Email address is invalid", 400, "email_address_invalid"),
    );
    expect(mapped.code).toBe("validation");
    expect(mapped.fieldErrors?.email).toHaveLength(1);
  });

  it("explains a refused confirmation email and logs it with the address masked", () => {
    const mapped = mapSignUpError(
      new AuthApiError(
        'Email address "asha@example.com" cannot be used as it is not authorized',
        400,
        "email_address_not_authorized",
      ),
    );
    expect(mapped.code).toBe("upstream");
    expect(mapped.message).toMatch(/confirmation email/i);
    const [event] = loggedEvents();
    expect(event).toMatchObject({
      event: "auth.register confirmation_email_failed",
      code: "email_address_not_authorized",
    });
    expect(JSON.stringify(event)).not.toContain("asha@example.com");
  });

  it("recognises a code-less 500 from a failed confirmation email", () => {
    const mapped = mapSignUpError(serverError("Error sending confirmation email"));
    expect(mapped.message).toMatch(/confirmation email/i);
    expect(loggedEvents()[0]).toMatchObject({
      event: "auth.register confirmation_email_failed",
      status: 500,
    });
  });

  it("distinguishes the email sending limit from the per-user rate limit", () => {
    const emailLimit = mapSignUpError(
      new AuthApiError("Email rate limit exceeded", 429, "over_email_send_rate_limit"),
    );
    const requestLimit = mapSignUpError(
      new AuthApiError("Request rate limit reached", 429, "over_request_rate_limit"),
    );
    expect(emailLimit.code).toBe("rate_limited");
    expect(emailLimit.message).toMatch(/emails/i);
    expect(requestLimit.message).not.toMatch(/emails/i);
    expect(loggedEvents()).toHaveLength(1);
  });

  it("reports disabled sign-ups as forbidden", () => {
    const mapped = mapSignUpError(new AuthApiError("Signups not allowed", 422, "signup_disabled"));
    expect(mapped.code).toBe("forbidden");
    expect(loggedEvents()[0]).toMatchObject({ event: "auth.register signups_disabled" });
  });

  it("reports an outage as temporary and logs it", () => {
    const mapped = mapSignUpError(networkDown());
    expect(mapped).toMatchObject({
      code: "upstream",
      message: expect.stringMatching(/temporarily/i),
    });
    expect(loggedEvents()[0]).toMatchObject({ event: "auth.register failed", status: 0 });
  });
});
