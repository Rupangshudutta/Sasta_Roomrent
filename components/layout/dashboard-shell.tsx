import { Home, LogOut, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { signOutAction } from "@/features/auth/actions";
import type { CurrentUser } from "@/lib/auth/session";

/**
 * Shared frame for the tenant, owner and admin areas: brand bar, sidebar
 * navigation and a sign-out form. Each area passes its own nav items.
 */
export type NavItem = { href: string; label: string; Icon: LucideIcon };

type DashboardShellProps = {
  user: CurrentUser;
  areaLabel: string;
  nav: readonly NavItem[];
  children: ReactNode;
};

const roleLabel: Record<CurrentUser["role"], string> = {
  tenant: "Tenant",
  owner: "Property owner",
  admin: "Administrator",
};

export function DashboardShell({ user, areaLabel, nav, children }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="from-primary to-primary-dark bg-gradient-to-r text-white">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold">
            <Home className="h-5 w-5" aria-hidden />
            Sasta Room
            <span className="rounded-pill ml-2 bg-white/15 px-2.5 py-0.5 text-xs font-medium">
              {areaLabel}
            </span>
          </Link>
          <div className="flex items-center gap-3">
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
                Sign out
              </Button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 py-6">
        <nav aria-label={`${areaLabel} navigation`} className="hidden w-56 shrink-0 md:block">
          <ul className="space-y-1">
            {nav.map(({ href, label, Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="rounded-card-sm text-ink hover:bg-surface flex items-center gap-3 px-3 py-2.5 text-sm font-medium"
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
