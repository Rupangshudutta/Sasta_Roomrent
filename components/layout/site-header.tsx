import { Home, LogIn, UserPlus } from "lucide-react";
import Link from "next/link";

import { Button, ButtonLink } from "@/components/ui/button";
import { signOutAction } from "@/features/auth/actions";
import { getCurrentUser, homePathForRole } from "@/lib/auth/session";
import { mainNav } from "@/lib/config/site";

import { MobileNav } from "./mobile-nav";

/**
 * Sticky red gradient navbar from the prototype. Server Component: it knows
 * whether a user is signed in and swaps Login/Sign Up for a dashboard link.
 */
export async function SiteHeader() {
  const user = await getCurrentUser();
  const dashboardHref = user ? homePathForRole(user.role) : null;

  return (
    <header className="from-brand to-primary sticky top-0 z-40 bg-gradient-to-r text-white shadow-[0_2px_10px_rgba(0,0,0,0.1)]">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold">
          <Home className="h-6 w-6" aria-hidden />
          Sasta Room
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-pill px-3.5 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {user && dashboardHref ? (
            <>
              <ButtonLink
                href={dashboardHref}
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/15"
              >
                Hi, {user.firstName}
              </ButtonLink>
              <form action={signOutAction}>
                <Button
                  type="submit"
                  variant="outline"
                  size="sm"
                  className="border-white/70 bg-transparent text-white hover:bg-white/15"
                >
                  Logout
                </Button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-pill inline-flex h-9 items-center gap-1.5 border border-white/70 px-4 text-sm font-medium transition hover:bg-white/15"
              >
                <LogIn className="h-4 w-4" aria-hidden />
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-pill text-primary hover:bg-surface inline-flex h-9 items-center gap-1.5 bg-white px-4 text-sm font-semibold transition"
              >
                <UserPlus className="h-4 w-4" aria-hidden />
                Sign Up
              </Link>
            </>
          )}
        </div>

        <MobileNav
          items={mainNav}
          user={user ? { firstName: user.firstName, dashboardHref: dashboardHref ?? "/" } : null}
        />
      </div>
    </header>
  );
}
