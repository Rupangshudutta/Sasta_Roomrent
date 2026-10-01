import type { ReactNode } from "react";

/** Simple, readable frame for policy pages. */
export function LegalPage({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-bold">{title}</h1>
      <p className="text-muted mt-2 text-sm">Last updated: {updated}</p>
      <p className="text-ink/90 mt-6 text-lg">{intro}</p>
      <div className="prose-headings:font-semibold [&_p]:text-ink/90 mt-8 space-y-8 [&_h2]:text-xl [&_h2]:font-semibold [&_li]:mt-1 [&_p]:mt-2 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-6">
        {children}
      </div>
    </article>
  );
}
