import { Check, Home } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * The split card from the prototype's login/register pages: a red gradient
 * panel with a welcome message and four benefit bullets, next to the form.
 */
type AuthShellProps = {
  heading: string;
  bullets: readonly string[];
  children: ReactNode;
};

export function AuthShell({ heading, bullets, children }: AuthShellProps) {
  return (
    <main className="from-surface to-tint flex flex-1 items-center justify-center bg-gradient-to-br px-4 py-10">
      <div className="rounded-card grid w-full max-w-5xl overflow-hidden bg-white shadow-xl md:grid-cols-[2fr_3fr]">
        <aside className="from-brand to-primary hidden flex-col justify-between bg-gradient-to-br p-10 text-white md:flex">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold">
            <Home className="h-6 w-6" aria-hidden />
            Sasta Room
          </Link>
          <div>
            <h2 className="text-3xl font-bold">{heading}</h2>
            <ul className="mt-6 space-y-3 text-sm/6 opacity-95">
              {bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-2">
                  <Check className="mt-1 h-4 w-4 shrink-0" aria-hidden />
                  {bullet}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-xs opacity-80">
            Making room hunting simple, transparent, and broker-free.
          </p>
        </aside>
        <section className="p-6 sm:p-10">
          <Link
            href="/"
            className="text-primary mb-6 flex items-center gap-2 text-lg font-bold md:hidden"
          >
            <Home className="h-5 w-5" aria-hidden />
            Sasta Room
          </Link>
          {children}
        </section>
      </div>
    </main>
  );
}
