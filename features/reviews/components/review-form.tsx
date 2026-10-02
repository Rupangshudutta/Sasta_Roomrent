"use client";

import { Star } from "lucide-react";
import { useState } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { InputField, TextareaField } from "@/components/ui/field";
import { cn } from "@/lib/utils/cn";
import { useFormAction } from "@/lib/forms/use-form-action";

import { saveReviewAction } from "../actions";
import { reviewSchema } from "../schema";

type Props = {
  bookingId: string;
  existing?: { rating: number; title: string | null; comment: string | null } | null;
};

export function ReviewForm({ bookingId, existing }: Props) {
  const { pending, errors, formError, formProps } = useFormAction(saveReviewAction, {
    schema: reviewSchema,
  });
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [hover, setHover] = useState(0);

  return (
    <form {...formProps} className="space-y-5">
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="rating" value={rating || ""} />
      {formError ? <Alert tone="error">{formError}</Alert> : null}

      <fieldset>
        <legend className="text-sm font-medium">
          Your rating <span className="text-primary">*</span>
        </legend>
        <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Rating out of 5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} star${n === 1 ? "" : "s"}`}
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              className="focus-visible:ring-primary rounded p-1 focus-visible:ring-2 focus-visible:outline-none"
            >
              <Star
                className={cn(
                  "h-8 w-8 transition",
                  (hover || rating) >= n ? "fill-warning text-warning" : "text-border",
                )}
                aria-hidden
              />
            </button>
          ))}
        </div>
        {errors?.rating ? <p className="text-danger mt-1 text-xs">{errors.rating[0]}</p> : null}
      </fieldset>

      <InputField
        id="title"
        label="Title"
        placeholder="e.g. Clean, quiet and close to the metro"
        defaultValue={existing?.title ?? ""}
        errors={errors?.title}
      />
      <TextareaField
        id="comment"
        label="Your review"
        required
        rows={5}
        placeholder="What was the room, building, food and owner like? What should the next tenant know?"
        defaultValue={existing?.comment ?? ""}
        hint="Be honest and specific. Reviews are public and show your first name."
        errors={errors?.comment}
      />
      <Button type="submit" loading={pending}>
        {existing ? "Update review" : "Publish review"}
      </Button>
    </form>
  );
}
