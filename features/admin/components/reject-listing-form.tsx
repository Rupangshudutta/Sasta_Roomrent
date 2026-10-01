"use client";

import { XCircle } from "lucide-react";
import { useActionState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TextareaField } from "@/components/ui/field";
import type { ActionResult } from "@/lib/actions/result";

import { rejectListingAction } from "../actions";

export function RejectListingForm({ listingId }: { listingId: string }) {
  const [state, formAction, pending] = useActionState<
    ActionResult<undefined> | undefined,
    FormData
  >(rejectListingAction, undefined);
  const errors = state && !state.ok ? state.fieldErrors : undefined;

  if (state?.ok) {
    return <Alert tone="success">{state.message}</Alert>;
  }

  return (
    <form action={formAction} className="space-y-3" noValidate>
      <input type="hidden" name="listingId" value={listingId} />
      {state && !state.ok && !state.fieldErrors ? (
        <Alert tone="error">{state.message}</Alert>
      ) : null}
      <TextareaField
        id="reason"
        label="Reason sent to the owner"
        required
        rows={3}
        placeholder="e.g. Photos do not show the actual room, and the address is incomplete."
        hint="Be specific: the owner sees this text verbatim and must fix it before resubmitting."
        errors={errors?.reason}
      />
      <Button type="submit" variant="danger" loading={pending}>
        <XCircle className="h-4 w-4" aria-hidden /> Reject with reason
      </Button>
    </form>
  );
}
