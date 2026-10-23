import type { AuthError } from "@supabase/supabase-js";

import type { ActionErrorCode, FieldErrors } from "@/lib/actions/result";
import { logger } from "@/lib/logging/logger";

/**
 * Translates Supabase Auth errors into messages a user can act on.
 *
 * The rule: a caller mistake (wrong password, email already registered) and a
 * dependency failure (Auth unreachable, project paused, email provider refusing
 * to send) never share a message. They used to, so an outage read as
 * "Incorrect email or password" and left no log line.
 *
 * auth-js reports a network failure as status 0 and every 5xx as an
 * AuthRetryableFetchError *without* a code, so for those `status` (and the
 * message) is all we get. Only codes listed here get specific copy; anything
 * else is logged so it shows up in the function logs.
 */
export type MappedAuthError = {
  code: ActionErrorCode;
  message: string;
  fieldErrors?: FieldErrors;
};

const tooManyAttempts: MappedAuthError = {
  code: "rate_limited",
  message: "Too many attempts. Please wait a minute and try again.",
};

/** No response, a network failure (status 0) or a 5xx: the service, not the user, failed. */
function isServiceFailure(error: AuthError): boolean {
  return error.status === undefined || error.status === 0 || error.status >= 500;
}

/** Log fields for an auth error. GoTrue echoes the address in some messages, so emails are masked. */
function logFields(error: AuthError) {
  return {
    code: error.code,
    status: error.status,
    name: error.name,
    message: error.message.replace(/[^\s@"']+@[^\s@"']+/g, "<email>").slice(0, 200),
  };
}

export function mapSignInError(error: AuthError): MappedAuthError {
  if (error.code === "invalid_credentials") {
    // Same message for an unknown email and a wrong password: do not reveal which accounts exist.
    return { code: "unauthenticated", message: "Incorrect email or password." };
  }
  if (error.code === "email_not_confirmed") {
    return {
      code: "forbidden",
      message: "Please confirm your email first. Check your inbox for the confirmation link.",
    };
  }
  if (error.status === 429) return tooManyAttempts;

  logger.error("auth.login failed", logFields(error));
  return isServiceFailure(error)
    ? {
        code: "upstream",
        message: "Sign-in is temporarily unavailable. Please try again in a few minutes.",
      }
    : {
        code: "unknown",
        message:
          "We could not sign you in. Please try again, or contact support if it keeps happening.",
      };
}

export function mapSignUpError(error: AuthError): MappedAuthError {
  if (
    error.code === "user_already_exists" ||
    error.code === "email_exists" ||
    /already registered/i.test(error.message)
  ) {
    return {
      code: "conflict",
      message: "An account with this email already exists. Try signing in instead.",
      fieldErrors: { email: ["Already registered"] },
    };
  }
  if (error.code === "weak_password") {
    return {
      code: "validation",
      message: error.message,
      fieldErrors: { password: [error.message] },
    };
  }
  if (error.code === "email_address_invalid") {
    return {
      code: "validation",
      message: "Please fix the highlighted fields.",
      fieldErrors: { email: ["This email address cannot be used. Check it or try another one."] },
    };
  }
  if (error.code === "over_email_send_rate_limit") {
    logger.error("auth.register email_rate_limited", logFields(error));
    return {
      code: "rate_limited",
      message: "We are sending too many emails right now. Please try again in a little while.",
    };
  }
  if (error.status === 429) return tooManyAttempts;

  // Supabase Auth creates the user and sends the confirmation email in one
  // transaction, so a failed email means no account. Its built-in sender only
  // delivers to members of the project's team (email_address_not_authorized);
  // other send failures arrive as a code-less 500 "Error sending confirmation email".
  if (error.code === "email_address_not_authorized" || /confirmation email/i.test(error.message)) {
    logger.error("auth.register confirmation_email_failed", logFields(error));
    return {
      code: "upstream",
      message:
        "We could not send the confirmation email, so your account was not created. Please try again later.",
    };
  }
  if (error.code === "signup_disabled" || error.code === "email_provider_disabled") {
    logger.error("auth.register signups_disabled", logFields(error));
    return {
      code: "forbidden",
      message: "New sign-ups are paused right now. Please try again later.",
    };
  }

  logger.error("auth.register failed", logFields(error));
  return {
    code: "upstream",
    message: isServiceFailure(error)
      ? "Sign-up is temporarily unavailable. Please try again in a few minutes."
      : "We could not create your account right now. Please try again.",
  };
}
