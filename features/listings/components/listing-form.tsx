"use client";

import { Save, Send } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { InputField, SelectField, TextareaField } from "@/components/ui/field";
import type { Amenity, City } from "@/features/catalog/queries";
import type { OwnerListing } from "@/features/listings/owner-queries";
import { furnishingLabels, genderPreferenceLabels, propertyTypeLabels } from "@/lib/config/site";
import { useFormAction } from "@/lib/forms/use-form-action";

import { createListingAction, updateListingAction } from "../owner-actions";
import { listingFormSchema } from "../schema";

type ListingFormProps = {
  cities: City[];
  amenities: Amenity[];
  listing?: OwnerListing;
};

const toOptions = (record: Record<string, string>) =>
  Object.entries(record).map(([value, label]) => ({ value, label }));

/**
 * Create/edit form for a listing, organised in the sections of the prototype's
 * "Add New Property" screen plus the fields it lacked (furnishing, state,
 * pincode, maintenance, available-from, minimum lease). Two submit buttons set
 * `intent` so the same form can save a draft or submit for review.
 */
export function ListingForm({ cities, amenities, listing }: ListingFormProps) {
  const action = listing ? updateListingAction.bind(null, listing.id) : createListingAction;
  const { pending, errors, formError, formProps } = useFormAction(action, {
    schema: listingFormSchema,
  });
  const selectedAmenities = new Set(
    listing?.amenities.map((a) => a.amenity?.slug).filter(Boolean) ?? [],
  );
  const canSubmitForReview = !listing || ["draft", "rejected", "inactive"].includes(listing.status);

  return (
    <form {...formProps} className="space-y-6">
      {formError ? <Alert tone="error">{formError}</Alert> : null}

      <Card>
        <CardHeader title="Basics" description="What are you listing?" />
        <CardBody className="grid gap-5 md:grid-cols-2">
          <InputField
            id="title"
            label="Listing title"
            required
            defaultValue={listing?.title}
            placeholder="e.g. Sunny single room in Koramangala, 5 min from Forum Mall"
            hint="10-150 characters. Mention the area and what makes it special."
            errors={errors?.title}
            className="md:col-span-2"
          />
          <SelectField
            id="propertyType"
            label="Property type"
            required
            defaultValue={listing?.property_type ?? ""}
            options={toOptions(propertyTypeLabels)}
            placeholder="Select type"
            errors={errors?.propertyType}
          />
          <SelectField
            id="furnishing"
            label="Furnishing"
            defaultValue={listing?.furnishing ?? "unfurnished"}
            options={toOptions(furnishingLabels)}
            errors={errors?.furnishing}
          />
          <TextareaField
            id="description"
            label="Description"
            rows={5}
            defaultValue={listing?.description ?? ""}
            placeholder="Describe the room, the building, nearby transport, food, and who it suits."
            errors={errors?.description}
            className="md:col-span-2"
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Pricing" description="All amounts in ₹ per month unless noted." />
        <CardBody className="grid gap-5 md:grid-cols-3">
          <InputField
            id="rentAmount"
            label="Monthly rent"
            type="number"
            inputMode="numeric"
            min={500}
            step={100}
            required
            defaultValue={listing?.rent_amount ?? ""}
            errors={errors?.rentAmount}
          />
          <InputField
            id="securityDeposit"
            label="Security deposit (one-time)"
            type="number"
            inputMode="numeric"
            min={0}
            step={500}
            defaultValue={listing?.security_deposit ?? ""}
            errors={errors?.securityDeposit}
          />
          <InputField
            id="maintenanceAmount"
            label="Maintenance / extras"
            type="number"
            inputMode="numeric"
            min={0}
            step={100}
            defaultValue={listing?.maintenance_amount ?? ""}
            hint="Leave blank if included in rent"
            errors={errors?.maintenanceAmount}
          />
          <InputField
            id="minLeaseMonths"
            label="Minimum stay (months)"
            type="number"
            inputMode="numeric"
            min={1}
            max={24}
            defaultValue={listing?.min_lease_months ?? 1}
            errors={errors?.minLeaseMonths}
          />
          <InputField
            id="availableFrom"
            label="Available from"
            type="date"
            defaultValue={listing?.available_from ?? ""}
            errors={errors?.availableFrom}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Location"
          description="The exact address is shown only after a request is accepted."
        />
        <CardBody className="grid gap-5 md:grid-cols-2">
          <InputField
            id="addressLine1"
            label="Address line 1"
            required
            defaultValue={listing?.address_line1}
            placeholder="House/flat number, building, street"
            errors={errors?.addressLine1}
            className="md:col-span-2"
          />
          <InputField
            id="addressLine2"
            label="Address line 2"
            defaultValue={listing?.address_line2 ?? ""}
            placeholder="Landmark (optional)"
            errors={errors?.addressLine2}
            className="md:col-span-2"
          />
          <SelectField
            id="cityId"
            label="City"
            required
            defaultValue={listing?.city_id ?? ""}
            options={cities.map((c) => ({ value: String(c.id), label: c.name }))}
            placeholder="Select city"
            errors={errors?.cityId}
          />
          <InputField
            id="locality"
            label="Area / locality"
            required
            defaultValue={listing?.locality}
            placeholder="e.g. Koramangala 5th Block"
            errors={errors?.locality}
          />
          <InputField
            id="state"
            label="State"
            required
            defaultValue={listing?.state}
            placeholder="e.g. Karnataka"
            errors={errors?.state}
          />
          <InputField
            id="pincode"
            label="Pincode"
            required
            inputMode="numeric"
            maxLength={6}
            defaultValue={listing?.pincode}
            placeholder="560034"
            errors={errors?.pincode}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Rooms & preferences" />
        <CardBody className="grid gap-5 md:grid-cols-3">
          <InputField
            id="totalRooms"
            label="Total rooms / beds"
            type="number"
            inputMode="numeric"
            min={1}
            max={500}
            required
            defaultValue={listing?.total_rooms ?? 1}
            errors={errors?.totalRooms}
          />
          <InputField
            id="availableRooms"
            label="Available now"
            type="number"
            inputMode="numeric"
            min={0}
            max={500}
            required
            defaultValue={listing?.available_rooms ?? 1}
            hint="Decreases automatically when you accept a request"
            errors={errors?.availableRooms}
          />
          <SelectField
            id="genderPreference"
            label="Gender preference"
            defaultValue={listing?.gender_preference ?? "any"}
            options={toOptions(genderPreferenceLabels)}
            errors={errors?.genderPreference}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Amenities" description="Tick everything included in the rent." />
        <CardBody>
          <fieldset>
            <legend className="sr-only">Amenities</legend>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {amenities.map((amenity) => (
                <li key={amenity.id}>
                  <label className="rounded-card-sm border-border has-[:checked]:border-primary has-[:checked]:bg-primary/5 flex cursor-pointer items-center gap-3 border px-3 py-2.5 text-sm transition">
                    <input
                      type="checkbox"
                      name="amenities"
                      value={amenity.slug}
                      defaultChecked={selectedAmenities.has(amenity.slug)}
                      className="accent-primary h-4 w-4"
                    />
                    {amenity.label}
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
          {errors?.amenities ? (
            <p className="text-danger mt-2 text-xs">{errors.amenities[0]}</p>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="House rules & contact"
          description="Your number is shared only with tenants whose request you accept."
        />
        <CardBody className="grid gap-5 md:grid-cols-2">
          <TextareaField
            id="houseRules"
            label="House rules"
            rows={4}
            defaultValue={listing?.house_rules ?? ""}
            placeholder="e.g. No smoking indoors. Gate closes at 11 PM. Guests allowed till 9 PM."
            errors={errors?.houseRules}
            className="md:col-span-2"
          />
          <InputField
            id="contactPhone"
            label="Contact number"
            type="tel"
            inputMode="tel"
            required
            defaultValue={listing?.contact_phone}
            placeholder="98765 43210"
            errors={errors?.contactPhone}
          />
          <InputField
            id="altContactPhone"
            label="Alternative contact"
            type="tel"
            inputMode="tel"
            defaultValue={listing?.alt_contact_phone ?? ""}
            placeholder="Optional"
            errors={errors?.altContactPhone}
          />
        </CardBody>
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <Button type="submit" name="intent" value="draft" variant="outline" loading={pending}>
          <Save className="h-4 w-4" aria-hidden />
          {listing ? "Save changes" : "Save as draft"}
        </Button>
        {canSubmitForReview ? (
          <Button type="submit" name="intent" value="submit" loading={pending}>
            <Send className="h-4 w-4" aria-hidden />
            {listing ? "Save & submit for review" : "Submit for review"}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
