"use server";

import { revalidatePath } from "next/cache";

import { fail, ok, type ActionResult } from "@/lib/actions/result";
import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function markNotificationReadAction(id: number): Promise<ActionResult<undefined>> {
  const user = await getCurrentUser();
  if (!user) return fail("unauthenticated", "Please sign in again.");
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .is("read_at", null);
  if (error) return fail("upstream", "Could not update the notification.");
  revalidatePath("/notifications");
  return ok(undefined);
}

export async function markAllNotificationsReadAction(): Promise<ActionResult<undefined>> {
  const user = await getCurrentUser();
  if (!user) return fail("unauthenticated", "Please sign in again.");
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .is("read_at", null);
  if (error) return fail("upstream", "Could not update notifications.");
  revalidatePath("/notifications");
  return ok(undefined, "All caught up.");
}
