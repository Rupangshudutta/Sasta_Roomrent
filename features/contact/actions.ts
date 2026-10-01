"use server";

import { fail, formDataToObject, fromZodError, ok, type ActionResult } from "@/lib/actions/result";
import { getPlatformSettings } from "@/features/catalog/queries";
import { serverEnv } from "@/lib/config/server-env";
import { escapeHtml, sendEmail } from "@/lib/email/send";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, rateLimitedMessage, rateLimitRules } from "@/lib/security/rate-limit";

import { contactInterestOptions, contactMessageSchema } from "./schema";

export type ContactResult = ActionResult<{ reference: number }>;

/**
 * Stores a contact-form submission (RLS allows anonymous inserts) and emails the
 * support inbox best-effort. The email never decides the outcome: the row in
 * contact_messages is the source of truth and shows up in the admin inbox.
 */
export async function sendContactMessageAction(
  _prev: ContactResult | undefined,
  formData: FormData,
): Promise<ContactResult> {
  const parsed = contactMessageSchema.safeParse(formDataToObject(formData));
  if (!parsed.success) return fromZodError(parsed.error);
  const input = parsed.data;

  if (input.website) {
    // Honeypot tripped: pretend success so bots learn nothing.
    return ok({ reference: 0 });
  }
  if (!(await checkRateLimit(rateLimitRules.contact)))
    return fail("rate_limited", rateLimitedMessage);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contact_messages")
    .insert({
      name: input.name,
      email: input.email,
      phone: input.phone,
      interest: input.interest,
      message: input.message,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("contact.send failed", { code: error?.code });
    return fail(
      "upstream",
      "We could not send your message right now. Please try again or call us.",
    );
  }

  const settings = await getPlatformSettings();
  const interestLabel =
    contactInterestOptions.find((o) => o.value === input.interest)?.label ?? input.interest;
  const to = serverEnv.NOTIFY_EMAIL ?? settings.support_email;

  await sendEmail({
    to,
    replyTo: input.email,
    subject: `[Sasta Room] New enquiry #${data.id}: ${interestLabel}`,
    html: `
      <h2>New contact message</h2>
      <p><strong>Name:</strong> ${escapeHtml(input.name)}<br/>
         <strong>Phone:</strong> ${escapeHtml(input.phone)}<br/>
         <strong>Email:</strong> ${escapeHtml(input.email)}<br/>
         <strong>Looking for:</strong> ${escapeHtml(interestLabel)}</p>
      <p style="white-space:pre-wrap">${escapeHtml(input.message)}</p>
      <p><a href="${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/admin/messages">Open the admin inbox</a></p>
    `,
    text: `New enquiry #${data.id}\nName: ${input.name}\nPhone: ${input.phone}\nEmail: ${input.email}\nLooking for: ${interestLabel}\n\n${input.message}`,
  });

  return ok({ reference: data.id }, "Message sent successfully! We'll contact you soon.");
}
