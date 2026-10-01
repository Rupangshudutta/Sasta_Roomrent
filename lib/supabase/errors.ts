import type { PostgrestError } from "@supabase/supabase-js";

import type { ActionErrorCode } from "@/lib/actions/result";

/**
 * Translates a PostgREST/Postgres error into an ActionResult code and a message
 * that is safe to show. Our own triggers raise with SQLSTATE 42501 (forbidden)
 * and 23514 (check) using human-readable messages, so those are passed through;
 * anything else gets a generic message and is logged.
 */
export function mapDatabaseError(
  error: PostgrestError,
  context: string,
): { code: ActionErrorCode; message: string } {
  switch (error.code) {
    case "42501":
      return {
        code: "forbidden",
        message: humanise(error.message, "You are not allowed to do that."),
      };
    case "23514":
      return {
        code: "validation",
        message: humanise(error.message, "Some values are not allowed."),
      };
    case "23505":
      return { code: "conflict", message: "That already exists." };
    case "23503":
      return { code: "not_found", message: "A related record was not found." };
    case "PGRST116":
      return { code: "not_found", message: "Not found." };
    default:
      console.error(`${context} failed`, { code: error.code, details: error.details });
      return { code: "upstream", message: "Something went wrong on our side. Please try again." };
  }
}

/** Strip Postgres prefixes like `new row for relation "x" violates check constraint` noise. */
function humanise(message: string, fallback: string): string {
  if (!message) return fallback;
  if (/violates|constraint|relation|policy/i.test(message)) return fallback;
  const trimmed = message.trim();
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1) + (trimmed.endsWith(".") ? "" : ".");
}
