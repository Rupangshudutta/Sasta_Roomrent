"use client";

import { Send } from "lucide-react";
import { useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { InputField, TextareaField } from "@/components/ui/field";
import { formatInr } from "@/lib/utils/format";
import { useFormAction } from "@/lib/forms/use-form-action";

import { requestBookingAction } from "../actions";
import { estimateTotal, todayIst, requestBookingSchema } from "../schema";

type Props = {
  propertyId: string;
  rent: number;
  deposit: number;
  minLeaseMonths: number;
  availableFrom: string | null;
};

/**
 * Tenant request form. The estimate updates live (rent × months + deposit) so
 * the tenant knows the commitment before sending; the authoritative snapshot is
 * taken by the database trigger when the row is inserted.
 */
export function RequestForm({ propertyId, rent, deposit, minLeaseMonths, availableFrom }: Props) {
  const { pending, errors, formError, formProps } = useFormAction(requestBookingAction, {
    schema: requestBookingSchema,
  });
  const [months, setMonths] = useState(minLeaseMonths);

  const today = todayIst();
  const defaultDate = availableFrom && availableFrom > today ? availableFrom : today;

  return (
    <form {...formProps} className="space-y-5">
      <input type="hidden" name="propertyId" value={propertyId} />
      {formError ? <Alert tone="error">{formError}</Alert> : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <InputField
          id="moveInDate"
          label="Preferred move-in date"
          type="date"
          required
          min={today}
          defaultValue={defaultDate}
          errors={errors?.moveInDate}
        />
        <InputField
          id="leaseMonths"
          label="How many months?"
          type="number"
          inputMode="numeric"
          required
          min={minLeaseMonths}
          max={36}
          defaultValue={minLeaseMonths}
          hint={`Minimum stay for this listing: ${minLeaseMonths} month${minLeaseMonths === 1 ? "" : "s"}`}
          onChange={(e) => setMonths(Math.max(1, Number(e.target.value) || minLeaseMonths))}
          errors={errors?.leaseMonths}
        />
      </div>

      <TextareaField
        id="message"
        label="Message to the owner"
        rows={4}
        placeholder="Introduce yourself: where you work or study, when you can visit, anything the owner should know."
        hint="Optional, but requests with a short introduction are accepted far more often."
        errors={errors?.message}
      />

      <dl className="rounded-card-sm bg-surface p-4 text-sm">
        <div className="flex justify-between">
          <dt>Monthly rent</dt>
          <dd className="font-medium">{formatInr(rent)}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Security deposit (one-time)</dt>
          <dd className="font-medium">{formatInr(deposit)}</dd>
        </div>
        <div className="border-border mt-2 flex justify-between border-t pt-2 text-base">
          <dt className="font-semibold">
            Estimated for {months} month{months === 1 ? "" : "s"}
          </dt>
          <dd className="text-primary font-bold">
            {formatInr(estimateTotal(rent, deposit, months))}
          </dd>
        </div>
        <p className="text-muted mt-2 text-xs">
          Paid directly to the owner after you visit and agree. Sasta Room charges tenants nothing.
        </p>
      </dl>

      <Button type="submit" size="lg" fullWidth loading={pending}>
        <Send className="h-4 w-4" aria-hidden /> Send request
      </Button>
    </form>
  );
}
