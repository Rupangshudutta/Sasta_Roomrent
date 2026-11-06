import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

import { controlClass } from "./control-class";
import { Select } from "./dropdown";
import type { DropdownOption } from "./dropdown-options";

export { controlClass };

/**
 * Form field primitives. Each control is wired for accessibility by default:
 * label `htmlFor` ↔ control `id`, `aria-invalid` and `aria-describedby` point at
 * the error text so screen readers announce validation failures.
 */

type FieldShellProps = {
  id: string;
  label: string;
  hint?: string;
  errors?: string[];
  required?: boolean;
  children: ReactNode;
  className?: string;
};

export function FieldShell({
  id,
  label,
  hint,
  errors,
  required,
  children,
  className,
}: FieldShellProps) {
  const hasError = Boolean(errors?.length);
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-ink text-sm font-medium">
        {label}
        {required ? <span className="text-primary ml-0.5">*</span> : null}
      </label>
      {children}
      {hasError ? (
        // Every message, not just the first: a field can fail several rules at once
        // and the user should be able to fix them all in one pass.
        <ul id={`${id}-error`} role="alert" className="text-danger space-y-0.5 text-xs">
          {errors?.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-muted text-xs">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function describedBy(id: string, errors?: string[], hint?: string) {
  if (errors?.length) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

type InputFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id"> &
  Omit<FieldShellProps, "children">;

export function InputField({
  id,
  label,
  hint,
  errors,
  required,
  className,
  ...props
}: InputFieldProps) {
  return (
    <FieldShell
      id={id}
      label={label}
      hint={hint}
      errors={errors}
      required={required}
      className={className}
    >
      <input
        id={id}
        name={props.name ?? id}
        required={required}
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={describedBy(id, errors, hint)}
        className={controlClass}
        {...props}
      />
    </FieldShell>
  );
}

type SelectFieldProps = Omit<FieldShellProps, "children"> & {
  name?: string;
  options: readonly DropdownOption[];
  defaultValue?: string | number | null;
  placeholder?: string;
  disabled?: boolean;
};

export function SelectField({
  id,
  label,
  hint,
  errors,
  required,
  className,
  name,
  options,
  defaultValue,
  placeholder,
  disabled,
}: SelectFieldProps) {
  return (
    <FieldShell
      id={id}
      label={label}
      hint={hint}
      errors={errors}
      required={required}
      className={className}
    >
      <Select
        id={id}
        label={label}
        name={name ?? id}
        options={options}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={describedBy(id, errors, hint)}
      />
    </FieldShell>
  );
}

type TextareaFieldProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> &
  Omit<FieldShellProps, "children">;

export function TextareaField({
  id,
  label,
  hint,
  errors,
  required,
  className,
  ...props
}: TextareaFieldProps) {
  return (
    <FieldShell
      id={id}
      label={label}
      hint={hint}
      errors={errors}
      required={required}
      className={className}
    >
      <textarea
        id={id}
        name={props.name ?? id}
        required={required}
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={describedBy(id, errors, hint)}
        className={cn(controlClass, "min-h-28 resize-y")}
        {...props}
      />
    </FieldShell>
  );
}
