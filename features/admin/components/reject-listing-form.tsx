"use client";

import { XCircle } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { TextareaField } from "@/components/ui/field";
import { useFormAction } from "@/lib/forms/use-form-action";

import { rejectListingAction } from "../actions";

export function RejectListingForm({ listingId }: { listingId: string }) {
  const { state, pending, errors, formError, formProps } = useFormAction(rejectListingAction);

  if (state?.ok) {
    return <Alert tone="success">{state.message}</Alert>;
  }

  return (
    <form {...formProps} className="space-y-3">
      <input type="hidden" name="listingId" value={listingId} />
      {formError ? <Alert tone="error">{formError}</Alert> : null}
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
