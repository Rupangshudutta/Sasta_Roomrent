"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

import { Button, ButtonLink } from "@/components/ui/button";

/**
 * Route-segment error boundary. Next renders this instead of the page when a
 * Server Component or render throws. `reset()` re-renders the segment, which is
 * the right recovery for transient upstream failures (Supabase hiccup).
 */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The digest is what Next logs server-side; surfacing it lets support correlate.
    console.error("ui.error_boundary", { digest: error.digest });
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
      <AlertTriangle className="text-warning h-12 w-12" aria-hidden />
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-muted">
        We could not load this page. It is usually temporary.
        {error.digest ? (
          <span className="mt-1 block font-mono text-xs">Reference: {error.digest}</span>
        ) : null}
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <ButtonLink href="/" variant="outline">
          Go home
        </ButtonLink>
      </div>
    </main>
  );
}
