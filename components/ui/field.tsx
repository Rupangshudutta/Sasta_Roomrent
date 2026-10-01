import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

import { cn } from "@/lib/utils/cn";

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
        <p id={`${id}-error`} role="alert" className="text-danger text-xs">
          {errors?.[0]}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-muted text-xs">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

const controlClass =
  "w-full rounded-card-sm border border-border bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-muted/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 aria-[invalid=true]:border-danger disabled:bg-surface";

function describedBy(id: string, errors?: string[], hint?: string) {
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

type SelectFieldProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> &
  Omit<FieldShellProps, "children"> & {
    options: ReadonlyArray<{ value: string; label: string }>;
    placeholder?: string;
  };

export function SelectField({
  id,
  label,
  hint,
  errors,
  required,
  className,
  options,
  placeholder,
  ...props
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
      <select
        id={id}
        name={props.name ?? id}
        required={required}
        aria-invalid={errors?.length ? true : undefined}
        aria-describedby={describedBy(id, errors, hint)}
        className={controlClass}
        {...props}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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
