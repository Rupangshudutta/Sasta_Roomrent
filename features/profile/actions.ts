"use server";

import { revalidatePath } from "next/cache";

import { fail, formDataToObject, fromZodError, ok, type ActionResult } from "@/lib/actions/result";
import { getCurrentUser } from "@/lib/auth/session";
import { mapDatabaseError } from "@/lib/supabase/errors";
import { createClient } from "@/lib/supabase/server";

import { changePasswordSchema, ownerProfileSchema, profileSchema } from "./schema";

export type ProfileResult = ActionResult<undefined>;

/** Name and phone for any role. Role, email and is_active are not editable here (column grants). */
export async function updateProfileAction(
  _prev: ProfileResult | undefined,
  formData: FormData,
): Promise<ProfileResult> {
  const user = await getCurrentUser();
  if (!user) return fail("unauthenticated", "Please sign in again.");

  const parsed = profileSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return fromZodError(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      first_name: parsed.data.firstName,
      last_name: parsed.data.lastName,
      phone: parsed.data.phone,
    })
    .eq("id", user.id);
  if (error) {
    const mapped = mapDatabaseError(error, "profile.update");
    return fail(mapped.code, mapped.message);
  }
  revalidatePath("/", "layout");
  return ok(undefined, "Profile updated.");
}

export async function updateOwnerProfileAction(
  _prev: ProfileResult | undefined,
  formData: FormData,
): Promise<ProfileResult> {
  const user = await getCurrentUser();
  if (!user) return fail("unauthenticated", "Please sign in again.");
  if (user.role !== "owner" && user.role !== "admin")
    return fail("forbidden", "Owner accounts only.");

  const parsed = ownerProfileSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return fromZodError(parsed.error);
  const v = parsed.data;

  const supabase = await createClient();
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ first_name: v.firstName, last_name: v.lastName, phone: v.phone })
    .eq("id", user.id);
  if (profileError) {
    const mapped = mapDatabaseError(profileError, "profile.update");
    return fail(mapped.code, mapped.message);
  }
  // Update first, insert only if the row is missing (e.g. an account promoted to owner
  // later). Not an upsert: PostgREST's merge upsert also SETs user_id, and end users
  // deliberately have no UPDATE privilege on that column.
  const details = {
    business_name: v.businessName,
    business_type: v.businessType,
    experience: v.experience || null,
    primary_location: v.primaryLocation || null,
    about: v.about || null,
  };
  const { data: updated, error: updateError } = await supabase
    .from("owner_profiles")
    .update(details)
    .eq("user_id", user.id)
    .select("user_id");
  let ownerError = updateError;
  if (!ownerError && (updated?.length ?? 0) === 0) {
    ({ error: ownerError } = await supabase
      .from("owner_profiles")
      .insert({ user_id: user.id, ...details }));
  }
  if (ownerError) {
    const mapped = mapDatabaseError(ownerError, "ownerProfile.update");
    return fail(mapped.code, mapped.message);
  }
  revalidatePath("/", "layout");
  return ok(undefined, "Profile updated.");
}

export async function changePasswordAction(
  _prev: ProfileResult | undefined,
  formData: FormData,
): Promise<ProfileResult> {
  const user = await getCurrentUser();
  if (!user) return fail("unauthenticated", "Please sign in again.");
  const parsed = changePasswordSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return fromZodError(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "same_password")
      return fail("validation", "Choose a password you have not used before.", {
        password: [error.message],
      });
    if (error.code === "reauthentication_needed") {
      return fail(
        "forbidden",
        "For security, please sign out and back in, then change your password.",
      );
    }
    return fail("upstream", "We could not change your password right now.");
  }
  return ok(undefined, "Password changed. Other devices will need to sign in again.");
}
