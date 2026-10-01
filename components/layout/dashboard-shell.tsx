import { Bell, Home, LogOut } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { signOutAction } from "@/features/auth/actions";
import { getUnreadNotificationCount } from "@/features/notifications/queries";
import type { CurrentUser } from "@/lib/auth/session";
import { dashboardNav } from "@/lib/config/dashboard-nav";

/**
 * Shared frame for the tenant, owner and admin areas: brand bar with the
 * notification bell, role navigation, and sign-out. Navigation comes from
 * lib/config/dashboard-nav so the three areas cannot drift apart.
 */
type DashboardShellProps = {
  user: CurrentUser;
  /** Which navigation to show; defaults to the user's own role (admins can open any area). */
  area?: CurrentUser["role"];
  children: ReactNode;
};

const roleLabel: Record<CurrentUser["role"], string> = {
  tenant: "Tenant",
  owner: "Property owner",
  admin: "Administrator",
};

export async function DashboardShell({ user, area, children }: DashboardShellProps) {
  const nav = dashboardNav[area ?? user.role];
  const unread = await getUnreadNotificationCount();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="from-brand to-primary bg-gradient-to-r text-white">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold">
            <Home className="h-5 w-5" aria-hidden />
            Sasta Room
            <span className="rounded-pill ml-2 bg-white/15 px-2.5 py-0.5 text-xs font-medium">
              {nav.areaLabel}
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/notifications"
              aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/15"
            >
              <Bell className="h-5 w-5" aria-hidden />
              {unread > 0 ? (
                <span className="text-primary absolute -top-0.5 -right-0.5 min-w-5 rounded-full bg-white px-1 text-center text-[11px] font-bold">
                  {unread > 99 ? "99+" : unread}
                </span>
              ) : null}
            </Link>
            <div className="hidden text-right text-sm sm:block">
              <p className="font-medium">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs opacity-80">{roleLabel[user.role]}</p>
            </div>
            <form action={signOutAction}>
              <Button
                type="submit"
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/15"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">Sign out</span>
              </Button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 md:flex-row">
        <nav aria-label={`${nav.areaLabel} navigation`} className="w-full shrink-0 md:w-56">
          <ul className="flex gap-1 overflow-x-auto pb-1 md:flex-col md:overflow-visible">
            {nav.items.map(({ href, label, Icon }) => (
              <li key={href} className="shrink-0">
                <Link
                  href={href}
                  className="rounded-card-sm text-ink hover:bg-surface flex items-center gap-3 px-3 py-2.5 text-sm font-medium whitespace-nowrap"
                >
                  <Icon className="text-muted h-4 w-4" aria-hidden />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
