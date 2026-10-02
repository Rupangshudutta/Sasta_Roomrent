"use client";

import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import type { z } from "zod";

import {
  formDataToObject,
  fromZodError,
  type ActionResult,
  type FieldErrors,
} from "@/lib/actions/result";

type ServerAction<T> = (
  prev: ActionResult<T> | undefined,
  formData: FormData,
) => Promise<ActionResult<T>>;

type Options = {
  /**
   * The same zod schema the Server Action validates with. When given, the form is
   * checked in the browser first: errors appear instantly, without a round trip,
   * and the server stays the authority because it validates again.
   */
  schema?: z.ZodType;
  /** Clear the inputs after a successful submit (e.g. a change-password form). */
  resetOnSuccess?: boolean;
};

/**
 * Wires a form to a Server Action without React 19's automatic form reset.
 *
 * Why: `<form action={fn}>` resets every uncontrolled input once the action
 * finishes, success or failure. On a validation error that wipes the fields the
 * user got right, so they retype everything. Here `onSubmit` prevents the native
 * submit and dispatches the action inside our own transition, which React does
 * not follow with a reset. `action` stays on the form so it still submits
 * before hydration or with JavaScript disabled.
 *
 * Usage: `const f = useFormAction(action, { schema }); <form {...f.formProps}>`
 */
export function useFormAction<T>(action: ServerAction<T>, options: Options = {}) {
  const { schema, resetOnSuccess = false } = options;
  const [state, formAction, pending] = useActionState<ActionResult<T> | undefined, FormData>(
    action,
    undefined,
  );
  // null = no client-side opinion; {} = validated and clean.
  const [clientErrors, setClientErrors] = useState<FieldErrors | null>(null);
  // A server result the user has since edited past; its errors are stale.
  const [dismissed, setDismissed] = useState<ActionResult<T> | undefined>(undefined);
  const attempted = useRef(false);
  const formRef = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    if (resetOnSuccess && state?.ok) formRef.current?.reset();
  }, [state, resetOnSuccess]);

  function validate(data: FormData): FieldErrors | null {
    if (!schema) return null;
    const result = schema.safeParse(formDataToObject(data));
    if (result.success) return null;
    const failed = fromZodError(result.error);
    return failed.ok ? null : (failed.fieldErrors ?? null);
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    formRef.current = form;
    attempted.current = true;

    // FormData(form) leaves out the clicked button, so add it back: forms with
    // several submit buttons (e.g. "Save draft" / "Submit") tell them apart by it.
    const data = new FormData(form);
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    if (
      (submitter instanceof HTMLButtonElement || submitter instanceof HTMLInputElement) &&
      submitter.name
    ) {
      data.append(submitter.name, submitter.value);
    }

    setDismissed(state);
    const errors = validate(data);
    setClientErrors(errors);
    if (errors) {
      focusFirstInvalid(form, errors);
      return;
    }
    startTransition(() => formAction(data));
  }

  // After the first attempt, re-validate as the user types so each message
  // disappears the moment its field is fixed.
  function onChange(event: FormEvent<HTMLFormElement>) {
    if (!attempted.current) return;
    setDismissed(state);
    if (schema) setClientErrors(validate(new FormData(event.currentTarget)) ?? {});
  }

  const serverResult = state && !state.ok && state !== dismissed ? state : undefined;
  const errors: FieldErrors | undefined = clientErrors ?? serverResult?.fieldErrors;
  const clientErrorCount = clientErrors ? Object.keys(clientErrors).length : 0;
  const formError =
    clientErrorCount > 0
      ? `Please fix ${clientErrorCount === 1 ? "the field" : `${clientErrorCount} fields`} highlighted below.`
      : (serverResult?.message ?? null);

  return {
    state,
    pending,
    errors,
    formError,
    formProps: { action: formAction, onSubmit, onChange, noValidate: true },
  };
}

/** Moves focus (and the viewport, which matters on phones) to the first invalid control. */
function focusFirstInvalid(form: HTMLFormElement, errors: FieldErrors) {
  for (const element of Array.from(form.elements)) {
    if (!(element instanceof HTMLElement)) continue;
    const name = element.getAttribute("name");
    if (name && errors[name]?.length) {
      element.focus({ preventScroll: true });
      element.scrollIntoView({ block: "center", behavior: "smooth" });
      return;
    }
  }
}
