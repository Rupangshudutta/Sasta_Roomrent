"use server";

import { redirect } from "next/navigation";

import { fail, formDataToObject, fromZodError, ok, type ActionResult } from "@/lib/actions/result";
import { getCurrentUser, homePathForRole } from "@/lib/auth/session";
import { publicEnv } from "@/lib/config/public-env";
import { createClient } from "@/lib/supabase/server";

import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  safeNextPath,
} from "./schema";

/**
 * Auth Server Actions. Each one: parse → call Supabase Auth → map errors to a
 * user-facing message → redirect or return an ActionResult.
 *
 * Note on `redirect()`: it works by throwing a special error, so it must be
 * called outside try/catch blocks that would swallow it.
 */

export type RegisterResult = ActionResult<{ needsEmailConfirmation: boolean; email: string }>;

export async function registerAction(
  _prev: RegisterResult | undefined,
  formData: FormData,
): Promise<RegisterResult> {
  const parsed = registerSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return fromZodError(parsed.error);
  const input = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      emailRedirectTo: `${publicEnv.NEXT_PUBLIC_SITE_URL}/auth/confirm`,
      // Read by the handle_new_user() trigger to create the profile row.
      data: {
        role: input.role,
        first_name: input.firstName,
        last_name: input.lastName,
        phone: input.phone,
        business_name: input.role === "owner" ? input.businessName : undefined,
        business_type: input.role === "owner" ? input.businessType : undefined,
        experience: input.role === "owner" ? input.experience : undefined,
      },
    },
  });

  if (error) {
    if (error.code === "user_already_exists" || /already registered/i.test(error.message)) {
      return fail(
        "conflict",
        "An account with this email already exists. Try signing in instead.",
        {
          email: ["Already registered"],
        },
      );
    }
    if (error.code === "weak_password") {
      return fail("validation", error.message, { password: [error.message] });
    }
    if (error.status === 429) {
      return fail("rate_limited", "Too many attempts. Please wait a minute and try again.");
    }
    console.error("auth.register failed", { code: error.code, status: error.status });
    return fail("upstream", "We could not create your account right now. Please try again.");
  }

  // Supabase returns an empty identities array when the email is already taken
  // and confirmations are on (it does not leak that via an error).
  if (data.user && data.user.identities?.length === 0) {
    return fail("conflict", "An account with this email already exists. Try signing in instead.", {
      email: ["Already registered"],
    });
  }

  if (data.session) {
    redirect(homePathForRole(input.role));
  }
  return ok({ needsEmailConfirmation: true, email: input.email });
}

export type LoginResult = ActionResult<undefined>;

export async function loginAction(
  _prev: LoginResult | undefined,
  formData: FormData,
): Promise<LoginResult> {
  const parsed = loginSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return fromZodError(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    if (error.code === "email_not_confirmed") {
      return fail(
        "forbidden",
        "Please confirm your email first. Check your inbox for the confirmation link.",
      );
    }
    if (error.status === 429) {
      return fail("rate_limited", "Too many attempts. Please wait a minute and try again.");
    }
    // Same message for wrong email and wrong password: do not reveal which accounts exist.
    return fail("unauthenticated", "Incorrect email or password.");
  }

  const user = await getCurrentUser();
  if (!user) {
    await supabase.auth.signOut();
    return fail("unknown", "Your account is not fully set up. Please contact support.");
  }
  if (!user.isActive) {
    await supabase.auth.signOut();
    return fail("forbidden", "This account has been suspended. Please contact support.");
  }

  redirect(safeNextPath(parsed.data.next, homePathForRole(user.role)));
}

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export type ForgotPasswordResult = ActionResult<{ email: string }>;

export async function forgotPasswordAction(
  _prev: ForgotPasswordResult | undefined,
  formData: FormData,
): Promise<ForgotPasswordResult> {
  const parsed = forgotPasswordSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return fromZodError(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${publicEnv.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/reset-password`,
  });
  if (error && error.status === 429) {
    return fail("rate_limited", "Too many attempts. Please wait a minute and try again.");
  }
  if (error) {
    console.error("auth.forgotPassword failed", { code: error.code, status: error.status });
  }
  // Always succeed from the user's point of view so the form cannot be used to
  // enumerate registered emails.
  return ok({ email: parsed.data.email });
}

export type ResetPasswordResult = ActionResult<undefined>;

export async function resetPasswordAction(
  _prev: ResetPasswordResult | undefined,
  formData: FormData,
): Promise<ResetPasswordResult> {
  const parsed = resetPasswordSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return fromZodError(parsed.error);

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims.sub) {
    return fail("unauthenticated", "This reset link has expired. Please request a new one.");
  }
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "same_password") {
      return fail("validation", "Choose a password you have not used before.", {
        password: [error.message],
      });
    }
    return fail("upstream", "We could not update your password. Please request a new link.");
  }

  const user = await getCurrentUser();
  redirect(user ? homePathForRole(user.role) : "/login");
}
