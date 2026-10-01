"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { InputField } from "@/components/ui/field";

import { loginAction, type LoginResult } from "../actions";

export function LoginForm({ next, notice }: { next?: string; notice?: string }) {
  const [state, formAction, pending] = useActionState<LoginResult | undefined, FormData>(
    loginAction,
    undefined,
  );
  const errors = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <form action={formAction} className="space-y-5" noValidate>
      <div>
        <h1 className="text-2xl font-bold">Sign In</h1>
        <p className="text-muted mt-1 text-sm">Welcome back. Enter your details to continue.</p>
      </div>

      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {state && !state.ok ? <Alert tone="error">{state.message}</Alert> : null}

      <input type="hidden" name="next" value={next ?? ""} />
      <InputField
        id="email"
        label="Email address"
        type="email"
        required
        autoComplete="email"
        errors={errors?.email}
      />
      <div className="space-y-1.5">
        <InputField
          id="password"
          label="Password"
          type="password"
          required
          autoComplete="current-password"
          errors={errors?.password}
        />
        <div className="text-right">
          <Link
            href="/forgot-password"
            className="text-primary text-xs font-medium hover:underline"
          >
            Forgot password?
          </Link>
        </div>
      </div>

      <Button type="submit" fullWidth loading={pending}>
        Sign in
      </Button>

      <p className="text-muted text-center text-sm">
        New to Sasta Room?{" "}
        <Link href="/register" className="text-primary font-medium hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
