import "server-only";

import { redirect } from "next/navigation";

import { getCurrentUser, homePathForRole, type CurrentUser, type UserRole } from "./session";

/**
 * Guard for role-scoped layouts. Redirects unauthenticated visitors to /login
 * (preserving the intended destination) and users with the wrong role to their
 * own home. Admins may open any area, mirroring the old product's behaviour.
 *
 * This is a UX guard. The database enforces the real rules through RLS, so a
 * bypass here would only show an empty page, never someone else's data.
 */
export async function requireRole(
  allowed: readonly UserRole[],
  nextPath: string,
): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  if (!user.isActive) {
    redirect("/account-suspended");
  }
  if (!allowed.includes(user.role) && user.role !== "admin") {
    redirect(homePathForRole(user.role));
  }
  return user;
}
