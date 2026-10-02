"use client";

import Link from "next/link";
import { useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button, ButtonLink } from "@/components/ui/button";
import { InputField, SelectField } from "@/components/ui/field";
import { PasswordField } from "@/components/ui/password-field";
import { useFormAction } from "@/lib/forms/use-form-action";

import { registerAction } from "../actions";
import {
  businessTypeOptions,
  experienceOptions,
  passwordRules,
  registerSchema,
  type SignupRole,
} from "../schema";
import { RoleTabs } from "./role-tabs";

// Shared by every email input: phone keyboards must not capitalise or autocorrect it.
const emailInputProps = {
  type: "email",
  inputMode: "email",
  autoComplete: "email",
  autoCapitalize: "none",
  autoCorrect: "off",
  spellCheck: false,
} as const;

export function RegisterForm({ initialRole }: { initialRole: SignupRole }) {
  const [role, setRole] = useState<SignupRole>(initialRole);
  const { state, pending, errors, formError, formProps } = useFormAction(registerAction, {
    schema: registerSchema,
  });

  if (state?.ok && state.data.needsEmailConfirmation) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Check your inbox</h1>
        <Alert tone="success" title="Almost there">
          We sent a confirmation link to <strong>{state.data.email}</strong>. Click it to activate
          your account, then sign in.
        </Alert>
        <ButtonLink href="/login" variant="outline" fullWidth>
          Go to sign in
        </ButtonLink>
      </div>
    );
  }

  return (
    <form {...formProps} className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Create Account</h1>
        <p className="text-muted mt-1 text-sm">
          Join thousands finding broker-free homes across India.
        </p>
      </div>

      <RoleTabs value={role} onChange={setRole} />

      {formError ? <Alert tone="error">{formError}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          id="firstName"
          label="First name"
          required
          autoComplete="given-name"
          autoCapitalize="words"
          errors={errors?.firstName}
        />
        <InputField
          id="lastName"
          label="Last name"
          required
          autoComplete="family-name"
          autoCapitalize="words"
          errors={errors?.lastName}
        />
      </div>
      <InputField
        id="email"
        label="Email address"
        required
        {...emailInputProps}
        errors={errors?.email}
      />
      <InputField
        id="phone"
        label="Mobile number"
        type="tel"
        required
        inputMode="tel"
        autoComplete="tel-national"
        placeholder="98765 43210"
        hint="10-digit Indian mobile number. +91 or a leading 0 is fine."
        errors={errors?.phone}
      />

      {role === "owner" ? (
        <div className="rounded-card-sm border-border bg-surface/60 space-y-4 border p-4">
          <p className="text-sm font-semibold">Owner details</p>
          <InputField
            id="businessName"
            label="Business / owner name"
            required
            autoCapitalize="words"
            placeholder="e.g. Sharma PG Services"
            errors={errors?.businessName}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              id="businessType"
              label="You operate as"
              required
              options={businessTypeOptions}
              placeholder="Select"
              errors={errors?.businessType}
            />
            <SelectField
              id="experience"
              label="Experience"
              options={experienceOptions}
              placeholder="Select"
              errors={errors?.experience}
            />
          </div>
          <p className="text-muted text-xs">
            Tax and bank details are collected later from your dashboard, never at sign-up.
          </p>
        </div>
      ) : null}

      <PasswordField
        id="password"
        label="Password"
        required
        autoComplete="new-password"
        requirements={passwordRules}
        errors={errors?.password}
      />
      <PasswordField
        id="confirmPassword"
        label="Confirm password"
        required
        autoComplete="new-password"
        errors={errors?.confirmPassword}
      />

      <div>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            name="agreeTerms"
            aria-invalid={errors?.agreeTerms ? true : undefined}
            aria-describedby={errors?.agreeTerms ? "agreeTerms-error" : undefined}
            className="accent-primary mt-0.5 h-5 w-5 shrink-0"
          />
          <span>
            I agree to the{" "}
            <Link href="/terms" className="text-primary underline-offset-2 hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-primary underline-offset-2 hover:underline">
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        {errors?.agreeTerms ? (
          <p id="agreeTerms-error" role="alert" className="text-danger mt-1 ml-7 text-xs">
            {errors.agreeTerms[0]}
          </p>
        ) : null}
      </div>

      <Button type="submit" fullWidth loading={pending}>
        Create account
      </Button>

      <p className="text-muted text-center text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
