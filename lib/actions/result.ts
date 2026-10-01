import type { ZodError } from "zod";

/**
 * The one shape every Server Action returns. Components render it with
 * `useActionState`; nothing is thrown across the server/client boundary, so the
 * user always gets an actionable message and field-level errors land next to
 * the field they belong to.
 */
export type FieldErrors = Record<string, string[] | undefined>;

export type ActionResult<T = undefined> =
  | { ok: true; data: T; message?: string }
  | { ok: false; code: ActionErrorCode; message: string; fieldErrors?: FieldErrors };

export type ActionErrorCode =
  | "validation"
  | "unauthenticated"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "rate_limited"
  | "upstream"
  | "unknown";

export function ok<T>(data: T, message?: string): ActionResult<T> {
  return { ok: true, data, message };
}

export function fail<T = undefined>(
  code: ActionErrorCode,
  message: string,
  fieldErrors?: FieldErrors,
): ActionResult<T> {
  return { ok: false, code, message, fieldErrors };
}

export function fromZodError<T = undefined>(error: ZodError): ActionResult<T> {
  const fieldErrors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "_form";
    (fieldErrors[key] ??= []).push(issue.message);
  }
  return fail("validation", "Please fix the highlighted fields.", fieldErrors);
}

/** Pulls plain string values out of a FormData so zod can validate them. */
export function formDataToObject(formData: FormData): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value !== "string") continue;
    const existing = out[key];
    if (existing === undefined) out[key] = value;
    else if (Array.isArray(existing)) existing.push(value);
    else out[key] = [existing, value];
  }
  return out;
}
