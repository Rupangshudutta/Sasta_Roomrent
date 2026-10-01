"use client";

import { useActionState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { InputField, SelectField, TextareaField } from "@/components/ui/field";
import { businessTypeOptions, experienceOptions } from "@/features/auth/schema";

import {
  changePasswordAction,
  updateOwnerProfileAction,
  updateProfileAction,
  type ProfileResult,
} from "../actions";

type Base = { firstName: string; lastName: string; phone: string | null; email: string | null };

export function ProfileForm({ profile }: { profile: Base }) {
  const [state, formAction, pending] = useActionState<ProfileResult | undefined, FormData>(
    updateProfileAction,
    undefined,
  );
  const errors = state && !state.ok ? state.fieldErrors : undefined;
  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state ? (
        <Alert tone={state.ok ? "success" : "error"}>
          {state.ok ? state.message : state.message}
        </Alert>
      ) : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <InputField
          id="firstName"
          label="First name"
          required
          defaultValue={profile.firstName}
          autoComplete="given-name"
          errors={errors?.firstName}
        />
        <InputField
          id="lastName"
          label="Last name"
          required
          defaultValue={profile.lastName}
          autoComplete="family-name"
          errors={errors?.lastName}
        />
        <InputField
          id="email"
          label="Email"
          type="email"
          defaultValue={profile.email ?? ""}
          disabled
          hint="Email is managed by sign-in; contact support to change it."
        />
        <InputField
          id="phone"
          label="Mobile number"
          type="tel"
          required
          inputMode="numeric"
          defaultValue={profile.phone ?? ""}
          autoComplete="tel-national"
          errors={errors?.phone}
        />
      </div>
      <Button type="submit" loading={pending}>
        Update Profile
      </Button>
    </form>
  );
}

type OwnerExtra = {
  businessName: string | null;
  businessType: string | null;
  experience: string | null;
  primaryLocation: string | null;
  about: string | null;
};

export function OwnerProfileForm({ profile, owner }: { profile: Base; owner: OwnerExtra }) {
  const [state, formAction, pending] = useActionState<ProfileResult | undefined, FormData>(
    updateOwnerProfileAction,
    undefined,
  );
  const errors = state && !state.ok ? state.fieldErrors : undefined;
  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state ? <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert> : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <InputField
          id="firstName"
          label="First name"
          required
          defaultValue={profile.firstName}
          errors={errors?.firstName}
        />
        <InputField
          id="lastName"
          label="Last name"
          required
          defaultValue={profile.lastName}
          errors={errors?.lastName}
        />
        <InputField
          id="email"
          label="Email"
          type="email"
          defaultValue={profile.email ?? ""}
          disabled
          hint="Managed by sign-in"
        />
        <InputField
          id="phone"
          label="Mobile number"
          type="tel"
          required
          inputMode="numeric"
          defaultValue={profile.phone ?? ""}
          errors={errors?.phone}
        />
        <InputField
          id="businessName"
          label="Business / owner name"
          required
          defaultValue={owner.businessName ?? ""}
          errors={errors?.businessName}
        />
        <SelectField
          id="businessType"
          label="You operate as"
          required
          options={businessTypeOptions}
          placeholder="Select"
          defaultValue={owner.businessType ?? ""}
          errors={errors?.businessType}
        />
        <SelectField
          id="experience"
          label="Experience"
          options={experienceOptions}
          placeholder="Select"
          defaultValue={owner.experience ?? ""}
          errors={errors?.experience}
        />
        <InputField
          id="primaryLocation"
          label="Primary location"
          placeholder="e.g. Koramangala, Bangalore"
          defaultValue={owner.primaryLocation ?? ""}
          errors={errors?.primaryLocation}
        />
        <TextareaField
          id="about"
          label="About you / your properties"
          rows={4}
          defaultValue={owner.about ?? ""}
          className="sm:col-span-2"
          hint="Shown to tenants in future; keep it factual."
          errors={errors?.about}
        />
      </div>
      <Button type="submit" loading={pending}>
        Update Profile
      </Button>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState<ProfileResult | undefined, FormData>(
    changePasswordAction,
    undefined,
  );
  const errors = state && !state.ok ? state.fieldErrors : undefined;
  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state ? <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert> : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <InputField
          id="password"
          label="New password"
          type="password"
          required
          autoComplete="new-password"
          hint="8+ characters with upper, lower, number and symbol"
          errors={errors?.password}
        />
        <InputField
          id="confirmPassword"
          label="Confirm new password"
          type="password"
          required
          autoComplete="new-password"
          errors={errors?.confirmPassword}
        />
      </div>
      <Button type="submit" variant="outline" loading={pending}>
        Change password
      </Button>
    </form>
  );
}
