import { escapeHtml } from "./send";

/**
 * Plain, dependable transactional templates. Inline styles only (email clients
 * strip stylesheets); brand red for the header; every template also returns a
 * text version for clients that prefer it.
 */
type Template = { subject: string; html: string; text: string };

function layout(title: string, bodyHtml: string, cta?: { label: string; href: string }) {
  return `<!doctype html><html><body style="margin:0;background:#f8f9fa;font-family:Inter,Arial,sans-serif;color:#202124">
  <div style="max-width:560px;margin:24px auto;background:#fff;border-radius:15px;overflow:hidden;border:1px solid #e8eaed">
    <div style="background:linear-gradient(90deg,#ee2e24,#d42a20);color:#fff;padding:18px 24px;font-size:18px;font-weight:700">Sasta Room</div>
    <div style="padding:24px;font-size:15px;line-height:1.55">
      <h1 style="font-size:20px;margin:0 0 12px">${escapeHtml(title)}</h1>
      ${bodyHtml}
      ${cta ? `<p style="margin:24px 0 8px"><a href="${cta.href}" style="display:inline-block;background:#d42a20;color:#fff;text-decoration:none;padding:12px 22px;border-radius:25px;font-weight:600">${escapeHtml(cta.label)}</a></p>` : ""}
    </div>
    <div style="padding:14px 24px;color:#5f6368;font-size:12px;border-top:1px solid #e8eaed">You are receiving this because you have an account on Sasta Room.</div>
  </div></body></html>`;
}

export function listingApprovedEmail(input: {
  ownerName: string;
  title: string;
  listingUrl: string;
}): Template {
  const subject = `Your listing is live: ${input.title}`;
  return {
    subject,
    html: layout(
      "Your listing is live",
      `<p>Hi ${escapeHtml(input.ownerName)},</p>
       <p>Good news: <strong>${escapeHtml(input.title)}</strong> passed review and is now visible to tenants.</p>
       <p>Tenants can send you booking requests from the listing page. You will be notified here and by email for each one.</p>`,
      { label: "View your listing", href: input.listingUrl },
    ),
    text: `Hi ${input.ownerName},\n\n"${input.title}" passed review and is now live.\n${input.listingUrl}\n`,
  };
}

export function listingRejectedEmail(input: {
  ownerName: string;
  title: string;
  reason: string;
  editUrl: string;
}): Template {
  const subject = `Changes needed before we can publish: ${input.title}`;
  return {
    subject,
    html: layout(
      "Your listing needs changes",
      `<p>Hi ${escapeHtml(input.ownerName)},</p>
       <p>We reviewed <strong>${escapeHtml(input.title)}</strong> and could not publish it yet.</p>
       <p style="background:#fdecea;border-radius:12px;padding:12px 14px"><strong>Reason:</strong> ${escapeHtml(input.reason)}</p>
       <p>Update the listing and submit it again; we will take another look within 24-48 hours.</p>`,
      { label: "Fix and resubmit", href: input.editUrl },
    ),
    text: `Hi ${input.ownerName},\n\nWe could not publish "${input.title}" yet.\nReason: ${input.reason}\n\nFix and resubmit: ${input.editUrl}\n`,
  };
}

export function accountStatusEmail(input: {
  name: string;
  active: boolean;
  reason?: string | null;
  contactUrl: string;
}): Template {
  const subject = input.active
    ? "Your Sasta Room account is active again"
    : "Your Sasta Room account has been suspended";
  return {
    subject,
    html: layout(
      subject,
      `<p>Hi ${escapeHtml(input.name)},</p>
       ${
         input.active
           ? `<p>Your account has been reactivated. You can sign in and continue where you left off.</p>`
           : `<p>An administrator has suspended your account${input.reason ? `: ${escapeHtml(input.reason)}` : "."}</p>
              <p>If you believe this is a mistake, please contact us.</p>`
       }`,
      { label: "Contact support", href: input.contactUrl },
    ),
    text: `${subject}\n${input.reason ?? ""}\n${input.contactUrl}\n`,
  };
}

export function bookingRequestedEmail(input: {
  ownerName: string;
  tenantName: string;
  title: string;
  moveIn: string;
  months: number;
  total: string;
  url: string;
}): Template {
  const subject = `New booking request for ${input.title}`;
  return {
    subject,
    html: layout(
      "New booking request",
      `<p>Hi ${escapeHtml(input.ownerName)},</p>
       <p><strong>${escapeHtml(input.tenantName)}</strong> wants to move into <strong>${escapeHtml(input.title)}</strong>
       from <strong>${escapeHtml(input.moveIn)}</strong> for <strong>${input.months} month${input.months === 1 ? "" : "s"}</strong>
       (estimated ${escapeHtml(input.total)} including deposit).</p>
       <p>Their phone and email are on the request. Accept to share your contact details with them, or decline with a note.</p>`,
      { label: "Review the request", href: input.url },
    ),
    text: `Hi ${input.ownerName},\n\n${input.tenantName} requested "${input.title}" from ${input.moveIn} for ${input.months} month(s).\nReview: ${input.url}\n`,
  };
}

export function bookingDecisionEmail(input: {
  tenantName: string;
  title: string;
  decision: "accept" | "reject" | "activate" | "complete";
  note: string | null;
  ownerPhone: string | null;
  url: string;
}): Template {
  const headlines = {
    accept: "Your request was accepted",
    reject: "Your request was declined",
    activate: "Your stay is now active",
    complete: "Your stay is complete",
  } as const;
  const subject = `${headlines[input.decision]}: ${input.title}`;
  const body =
    input.decision === "accept"
      ? `<p>The owner accepted your request for <strong>${escapeHtml(input.title)}</strong>.</p>
         ${input.ownerPhone ? `<p>You can call them on <strong>${escapeHtml(input.ownerPhone)}</strong>. Full contact details are on your request page.</p>` : ""}
         <p>Agree the move-in details directly, and remember: never pay a deposit before visiting the property.</p>`
      : input.decision === "reject"
        ? `<p>The owner could not accept your request for <strong>${escapeHtml(input.title)}</strong> this time.</p>
           <p>There are plenty of other verified rooms; your saved searches and favourites are waiting.</p>`
        : input.decision === "activate"
          ? `<p>Welcome home! The owner marked your stay at <strong>${escapeHtml(input.title)}</strong> as started.</p>`
          : `<p>Your stay at <strong>${escapeHtml(input.title)}</strong> is marked complete. A short review helps the next tenant.</p>`;
  return {
    subject,
    html: layout(
      headlines[input.decision],
      `<p>Hi ${escapeHtml(input.tenantName)},</p>${body}${input.note ? `<p style="background:#f8f9fa;border-radius:12px;padding:12px 14px"><strong>Note from the owner:</strong> ${escapeHtml(input.note)}</p>` : ""}`,
      {
        label: input.decision === "complete" ? "Leave a review" : "Open your request",
        href: input.url,
      },
    ),
    text: `${headlines[input.decision]}: ${input.title}\n${input.note ?? ""}\n${input.url}\n`,
  };
}

export function bookingCancelledEmail(input: {
  name: string;
  title: string;
  byOwner: boolean;
  reason: string | null;
  url: string;
}): Template {
  const subject = `Booking cancelled: ${input.title}`;
  return {
    subject,
    html: layout(
      "Booking cancelled",
      `<p>Hi ${escapeHtml(input.name)},</p>
       <p>The booking for <strong>${escapeHtml(input.title)}</strong> was cancelled by the ${input.byOwner ? "owner" : "tenant"}.</p>
       ${input.reason ? `<p style="background:#f8f9fa;border-radius:12px;padding:12px 14px"><strong>Reason:</strong> ${escapeHtml(input.reason)}</p>` : ""}`,
      { label: "View details", href: input.url },
    ),
    text: `${subject}\n${input.reason ?? ""}\n${input.url}\n`,
  };
}
