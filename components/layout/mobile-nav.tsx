"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";

import { signOutAction } from "@/features/auth/actions";

type MobileNavProps = {
  items: ReadonlyArray<{ href: string; label: string }>;
  user: { firstName: string; dashboardHref: string } | null;
};

/** Collapsible menu for small screens (the Bootstrap "navbar-toggler" in the prototype). */
export function MobileNav({ items, user }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const pathname = usePathname();

  // Close on navigation. "Adjust state while rendering" is React's recommended
  // pattern for deriving state from a prop/path change without an effect.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
        className="rounded-card-sm inline-flex h-10 w-10 items-center justify-center hover:bg-white/15"
      >
        {open ? <X className="h-6 w-6" aria-hidden /> : <Menu className="h-6 w-6" aria-hidden />}
      </button>
      {open ? (
        <div
          id={panelId}
          className="bg-primary-dark absolute inset-x-0 top-16 border-t border-white/10 px-4 pb-4 shadow-lg"
        >
          <nav aria-label="Main mobile" className="flex flex-col py-2">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-card-sm px-3 py-2.5 text-sm font-medium hover:bg-white/10"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex gap-2 border-t border-white/10 pt-3">
            {user ? (
              <>
                <Link
                  href={user.dashboardHref}
                  className="rounded-pill text-primary flex-1 bg-white px-4 py-2 text-center text-sm font-semibold"
                >
                  My dashboard
                </Link>
                <form action={signOutAction} className="flex-1">
                  <button
                    type="submit"
                    className="rounded-pill w-full border border-white/70 px-4 py-2 text-sm font-medium"
                  >
                    Logout
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-pill flex-1 border border-white/70 px-4 py-2 text-center text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="rounded-pill text-primary flex-1 bg-white px-4 py-2 text-center text-sm font-semibold"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
