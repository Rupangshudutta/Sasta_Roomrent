"use client";

/**
 * Last-resort boundary for errors thrown by the root layout itself. It must
 * render its own <html>/<body> because the layout that normally provides them
 * is the thing that failed. Kept dependency-free on purpose.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{ fontFamily: "system-ui, sans-serif", padding: "4rem 1rem", textAlign: "center" }}
      >
        <h1>Something went wrong</h1>
        <p>Please try again in a moment.{error.digest ? ` Reference: ${error.digest}` : ""}</p>
        <button onClick={reset} style={{ padding: "0.6rem 1.2rem", cursor: "pointer" }}>
          Try again
        </button>
      </body>
    </html>
  );
}
