import type { Metadata } from "next";

import { LegalPage } from "@/components/layout/legal-page";
import { getPlatformSettings } from "@/features/catalog/queries";

export const metadata: Metadata = { title: "Safety Guidelines" };

export default async function SafetyPage() {
  const settings = await getPlatformSettings();
  return (
    <LegalPage
      title="Safety Guidelines"
      updated="1 October 2026"
      intro="A few habits that keep tenants and owners safe when renting without a broker."
    >
      <section>
        <h2>For tenants</h2>
        <ul>
          <li>
            Visit the property before paying anything. Never pay a deposit to someone you have not
            met at the property.
          </li>
          <li>
            Keep conversations and payments traceable: pay by UPI or bank transfer, and ask for a
            receipt.
          </li>
          <li>
            Agree the rent, deposit, notice period and house rules in writing before moving in.
          </li>
          <li>Be cautious of prices far below the area average, or owners who refuse a visit.</li>
        </ul>
      </section>
      <section>
        <h2>For owners</h2>
        <ul>
          <li>
            Verify a tenant&apos;s identity with a government ID at move-in, and keep a copy of the
            agreement.
          </li>
          <li>Share your contact details only through accepted booking requests.</li>
          <li>Never share bank or UPI details in listing photos or descriptions.</li>
        </ul>
      </section>
      <section>
        <h2>Report a problem</h2>
        <p>
          If a listing looks fake, a user behaves badly, or you were asked for money under false
          pretences, email <a href={`mailto:${settings.support_email}`}>{settings.support_email}</a>{" "}
          or call {settings.support_phone}. We act on every report.
        </p>
      </section>
    </LegalPage>
  );
}
