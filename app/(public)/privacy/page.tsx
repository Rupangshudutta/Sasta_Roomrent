import type { Metadata } from "next";

import { LegalPage } from "@/components/layout/legal-page";
import { getPlatformSettings } from "@/features/catalog/queries";

export const metadata: Metadata = { title: "Privacy Policy" };

export default async function PrivacyPage() {
  const settings = await getPlatformSettings();
  return (
    <LegalPage
      title="Privacy Policy"
      updated="1 October 2026"
      intro={`This policy explains what personal data ${settings.platform_name} collects, why, and the choices you have.`}
    >
      <section>
        <h2>What we collect</h2>
        <ul>
          <li>
            Account data: name, email, mobile number, role (tenant or owner), password (hashed).
          </li>
          <li>
            Owner data: business name and type, listing details and photos, contact phone for
            listings.
          </li>
          <li>
            Activity data: booking requests, favourites, reviews, messages you send us, and
            notifications.
          </li>
          <li>
            Payment data: order and payment identifiers from Razorpay. We never see or store card
            numbers.
          </li>
          <li>
            Technical data: IP address and browser information in server logs, used for security.
          </li>
        </ul>
      </section>
      <section>
        <h2>How we use it</h2>
        <ul>
          <li>
            To run the marketplace: publish listings, deliver booking requests and share contact
            details as described in the Terms.
          </li>
          <li>
            To send transactional emails (confirmations, request updates). We do not send marketing
            email without consent.
          </li>
          <li>To keep the platform safe: moderation, fraud prevention, and enforcing our Terms.</li>
        </ul>
      </section>
      <section>
        <h2>Who sees your data</h2>
        <ul>
          <li>Owners see the name, phone and email of tenants who request their listing.</li>
          <li>
            Tenants see an owner&apos;s phone and email only after the owner accepts their request.
          </li>
          <li>
            Our processors: Supabase (database, authentication, file storage), Netlify (hosting),
            Razorpay (payments), Resend (email). Each processes data only on our instructions.
          </li>
          <li>We do not sell personal data.</li>
        </ul>
      </section>
      <section>
        <h2>Retention and your rights</h2>
        <p>
          We keep account data while your account is active and for as long as needed for legal and
          accounting purposes afterwards. You can update your profile at any time and request a copy
          or deletion of your data by emailing{" "}
          <a href={`mailto:${settings.support_email}`}>{settings.support_email}</a>.
        </p>
      </section>
      <section>
        <h2>Cookies</h2>
        <p>
          We use strictly necessary cookies to keep you signed in. We do not use advertising
          cookies.
        </p>
      </section>
    </LegalPage>
  );
}
