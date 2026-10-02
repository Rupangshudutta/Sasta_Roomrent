"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { InputField, SelectField, TextareaField } from "@/components/ui/field";
import { PasswordField } from "@/components/ui/password-field";
import { businessTypeOptions, experienceOptions, passwordRules } from "@/features/auth/schema";
import { useFormAction } from "@/lib/forms/use-form-action";

import { changePasswordAction, updateOwnerProfileAction, updateProfileAction } from "../actions";
import { changePasswordSchema, ownerProfileSchema, profileSchema } from "../schema";

type Base = { firstName: string; lastName: string; phone: string | null; email: string | null };

export function ProfileForm({ profile }: { profile: Base }) {
  const { state, pending, errors, formError, formProps } = useFormAction(updateProfileAction, {
    schema: profileSchema,
  });
  return (
    <form {...formProps} className="space-y-5">
      {state?.ok ? <Alert tone="success">{state.message}</Alert> : null}
      {formError ? <Alert tone="error">{formError}</Alert> : null}
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
          inputMode="tel"
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
  const { state, pending, errors, formError, formProps } = useFormAction(updateOwnerProfileAction, {
    schema: ownerProfileSchema,
  });
  return (
    <form {...formProps} className="space-y-5">
      {state?.ok ? <Alert tone="success">{state.message}</Alert> : null}
      {formError ? <Alert tone="error">{formError}</Alert> : null}
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
          inputMode="tel"
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
  const { state, pending, errors, formError, formProps } = useFormAction(changePasswordAction, {
    schema: changePasswordSchema,
    resetOnSuccess: true,
  });
  return (
    <form {...formProps} className="space-y-5">
      {state?.ok ? <Alert tone="success">{state.message}</Alert> : null}
      {formError ? <Alert tone="error">{formError}</Alert> : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <PasswordField
          id="password"
          label="New password"
          required
          autoComplete="new-password"
          requirements={passwordRules}
          errors={errors?.password}
        />
        <PasswordField
          id="confirmPassword"
          label="Confirm new password"
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
