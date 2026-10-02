"use client";

import { Send } from "lucide-react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { InputField, SelectField, TextareaField } from "@/components/ui/field";
import { useFormAction } from "@/lib/forms/use-form-action";

import { sendContactMessageAction } from "../actions";
import { contactInterestOptions, contactMessageSchema } from "../schema";

export function ContactForm() {
  const { state, pending, errors, formError, formProps } = useFormAction(sendContactMessageAction, {
    schema: contactMessageSchema,
  });

  if (state?.ok) {
    return (
      <Alert tone="success" title="Message sent successfully!">
        We&apos;ll contact you soon.
        {state.data.reference > 0 ? ` Your reference number is #${state.data.reference}.` : ""}
      </Alert>
    );
  }

  return (
    <form id="contactForm" {...formProps} className="space-y-5">
      {formError ? <Alert tone="error">{formError}</Alert> : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <InputField
          id="name"
          label="Your Name"
          required
          placeholder="John Doe"
          autoComplete="name"
          errors={errors?.name}
        />
        <InputField
          id="phone"
          label="Phone Number"
          type="tel"
          required
          placeholder="+91 98765 43210"
          autoComplete="tel"
          errors={errors?.phone}
        />
      </div>
      <InputField
        id="email"
        label="Email Address"
        type="email"
        required
        placeholder="john@example.com"
        autoComplete="email"
        errors={errors?.email}
      />
      <SelectField
        id="interest"
        label="I'm looking for"
        required
        options={contactInterestOptions}
        placeholder="Select an option"
        errors={errors?.interest}
      />
      <TextareaField
        id="message"
        label="Your Message"
        required
        rows={5}
        placeholder="Tell us how we can help you..."
        errors={errors?.message}
      />
      {/* Honeypot: hidden from people, tempting for bots. */}
      <div className="hidden" aria-hidden>
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <Button
        type="submit"
        size="lg"
        fullWidth
        loading={pending}
        className="rounded-card-sm from-brand to-primary bg-gradient-to-br"
      >
        <Send className="h-4 w-4" aria-hidden />
        Send Message
      </Button>
    </form>
  );
}
