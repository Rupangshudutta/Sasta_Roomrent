"use client";

import { Check, Circle, Eye, EyeOff, X } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent, type InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

import { controlClass, FieldShell } from "./field";

export type PasswordRequirement = {
  id: string;
  label: string;
  message: string;
  test: (value: string) => boolean;
};

type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "type"> & {
  id: string;
  label: string;
  hint?: string;
  errors?: string[];
  required?: boolean;
  className?: string;
  /** When given, a live checklist shows which rules the typed password meets. */
  requirements?: readonly PasswordRequirement[];
};

/**
 * Password input with a show/hide toggle and an optional live requirements
 * checklist.
 *
 * - The toggle only flips `type` between password and text; the value never
 *   leaves the input. Autocapitalise/autocorrect are off so a phone keyboard
 *   cannot silently change what the user typed while it is visible.
 * - Rule failures are rendered in the checklist (green when met, red when the
 *   form was submitted and the rule still fails) instead of as a wall of error
 *   text; any other error (e.g. "Passwords do not match") still shows normally.
 */
export function PasswordField({
  id,
  label,
  hint,
  errors,
  required,
  className,
  requirements,
  onChange,
  ...props
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // form.reset() does not fire change events, so mirror it into the checklist state.
  useEffect(() => {
    const form = inputRef.current?.form;
    if (!form) return;
    const onReset = () => {
      setValue("");
      setVisible(false);
    };
    form.addEventListener("reset", onReset);
    return () => form.removeEventListener("reset", onReset);
  }, []);

  const ruleMessages = new Set(requirements?.map((r) => r.message));
  const failedRuleCount = errors?.filter((e) => ruleMessages.has(e)).length ?? 0;
  const otherErrors = errors?.filter((e) => !ruleMessages.has(e)) ?? [];
  const shellErrors =
    failedRuleCount > 0
      ? [`Your password is missing ${failedRuleCount} of the requirements below`, ...otherErrors]
      : otherErrors;
  const showFailures = failedRuleCount > 0;

  const describedByIds = [
    shellErrors.length ? `${id}-error` : hint ? `${id}-hint` : null,
    requirements ? `${id}-requirements` : null,
  ]
    .filter(Boolean)
    .join(" ");

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setValue(event.target.value);
    onChange?.(event);
  }

  return (
    <FieldShell
      id={id}
      label={label}
      hint={requirements ? undefined : hint}
      errors={shellErrors}
      required={required}
      className={className}
    >
      <div className="relative">
        <input
          ref={inputRef}
          id={id}
          name={props.name ?? id}
          required={required}
          type={visible ? "text" : "password"}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          aria-invalid={errors?.length ? true : undefined}
          aria-describedby={describedByIds || undefined}
          className={cn(controlClass, "pr-12")}
          onChange={handleChange}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-controls={id}
          className="text-muted hover:text-ink focus-visible:ring-primary/30 absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-[10px] focus-visible:ring-2 focus-visible:outline-none"
        >
          {visible ? (
            <EyeOff className="h-5 w-5" aria-hidden />
          ) : (
            <Eye className="h-5 w-5" aria-hidden />
          )}
        </button>
      </div>
      {requirements ? (
        <ul
          id={`${id}-requirements`}
          aria-label="Password requirements"
          className="grid gap-x-4 gap-y-1 text-xs sm:grid-cols-2"
        >
          {requirements.map((rule) => {
            const met = rule.test(value);
            return (
              <li
                key={rule.id}
                className={cn(
                  "flex items-center gap-1.5",
                  met ? "text-success" : showFailures ? "text-danger" : "text-muted",
                )}
              >
                {met ? (
                  <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
                ) : showFailures ? (
                  <X className="h-3.5 w-3.5 shrink-0" aria-hidden />
                ) : (
                  <Circle className="h-3 w-3 shrink-0" aria-hidden />
                )}
                <span>
                  {rule.label}
                  <span className="sr-only">{met ? " (met)" : " (not met)"}</span>
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </FieldShell>
  );
}
