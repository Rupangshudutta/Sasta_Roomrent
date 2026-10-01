"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button, ButtonLink } from "@/components/ui/button";
import { InputField, SelectField } from "@/components/ui/field";

import { registerAction, type RegisterResult } from "../actions";
import { businessTypeOptions, experienceOptions, type SignupRole } from "../schema";
import { RoleTabs } from "./role-tabs";

export function RegisterForm({ initialRole }: { initialRole: SignupRole }) {
  const [role, setRole] = useState<SignupRole>(initialRole);
  const [state, formAction, pending] = useActionState<RegisterResult | undefined, FormData>(
    registerAction,
    undefined,
  );
  const errors = state && !state.ok ? state.fieldErrors : undefined;

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
    <form action={formAction} className="space-y-5" noValidate>
      <div>
        <h1 className="text-2xl font-bold">Create Account</h1>
        <p className="text-muted mt-1 text-sm">
          Join thousands finding broker-free homes across India.
        </p>
      </div>

      <RoleTabs value={role} onChange={setRole} />

      {state && !state.ok && !state.fieldErrors ? (
        <Alert tone="error">{state.message}</Alert>
      ) : null}
      {state && !state.ok && state.fieldErrors ? <Alert tone="error">{state.message}</Alert> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          id="firstName"
          label="First name"
          required
          autoComplete="given-name"
          errors={errors?.firstName}
        />
        <InputField
          id="lastName"
          label="Last name"
          required
          autoComplete="family-name"
          errors={errors?.lastName}
        />
      </div>
      <InputField
        id="email"
        label="Email address"
        type="email"
        required
        autoComplete="email"
        errors={errors?.email}
      />
      <InputField
        id="phone"
        label="Mobile number"
        type="tel"
        required
        inputMode="numeric"
        autoComplete="tel-national"
        placeholder="98765 43210"
        hint="10-digit Indian mobile number"
        errors={errors?.phone}
      />

      {role === "owner" ? (
        <div className="rounded-card-sm border-border bg-surface/60 space-y-4 border p-4">
          <p className="text-sm font-semibold">Owner details</p>
          <InputField
            id="businessName"
            label="Business / owner name"
            required
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

      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          id="password"
          label="Password"
          type="password"
          required
          autoComplete="new-password"
          hint="8+ characters with upper, lower, number and symbol"
          errors={errors?.password}
        />
        <InputField
          id="confirmPassword"
          label="Confirm password"
          type="password"
          required
          autoComplete="new-password"
          errors={errors?.confirmPassword}
        />
      </div>

      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="agreeTerms" className="accent-primary mt-1 h-4 w-4" />
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
          {errors?.agreeTerms ? (
            <span className="text-danger block text-xs">{errors.agreeTerms[0]}</span>
          ) : null}
        </span>
      </label>

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
