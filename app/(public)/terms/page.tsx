import type { Metadata } from "next";

import { LegalPage } from "@/components/layout/legal-page";
import { getPlatformSettings } from "@/features/catalog/queries";

export const metadata: Metadata = { title: "Terms of Service" };

export default async function TermsPage() {
  const settings = await getPlatformSettings();
  return (
    <LegalPage
      title="Terms of Service"
      updated="1 October 2026"
      intro={`These terms govern your use of ${settings.platform_name}, a marketplace that connects people looking for long-term accommodation ("tenants") with people who list it ("owners"). By creating an account you agree to them.`}
    >
      <section>
        <h2>1. What we are, and are not</h2>
        <p>
          {settings.platform_name} is a listing and introduction service. We are not a broker,
          landlord, or party to any tenancy. Rent, deposit, house rules and move-in terms are agreed
          directly between the tenant and the owner.
        </p>
      </section>
      <section>
        <h2>2. Accounts</h2>
        <ul>
          <li>You must be 18 or older and provide accurate contact details.</li>
          <li>
            Keep your password confidential; you are responsible for activity on your account.
          </li>
          <li>
            We may suspend accounts that post false information, harass other users, or break the
            law.
          </li>
        </ul>
      </section>
      <section>
        <h2>3. Listings and review</h2>
        <ul>
          <li>
            Owners must only list properties they are entitled to rent out, with real photos and
            prices.
          </li>
          <li>
            Every listing is reviewed by our team before it is published and may be rejected or
            removed.
          </li>
          <li>Material edits to a published listing return it to review.</li>
        </ul>
      </section>
      <section>
        <h2>4. Booking requests and contact sharing</h2>
        <p>
          When a tenant sends a booking request, the owner sees the tenant&apos;s contact details to
          respond. The owner&apos;s contact details are shared with the tenant only after the owner
          accepts. Use shared details solely to arrange the tenancy.
        </p>
      </section>
      <section>
        <h2>5. Payments</h2>
        <p>
          Where payments are offered on the platform they are processed by Razorpay. Platform fees
          and any booking token amount are shown before you pay. Refunds follow the policy shown at
          the time of payment.
        </p>
      </section>
      <section>
        <h2>6. Reviews</h2>
        <p>
          Only tenants with an accepted and active or completed stay can review a property. Reviews
          must be honest and respectful; we may hide reviews that break these rules.
        </p>
      </section>
      <section>
        <h2>7. Liability</h2>
        <p>
          We provide the platform &quot;as is&quot;. To the extent permitted by law we are not
          liable for disputes between tenants and owners, for the condition of any property, or for
          indirect losses.
        </p>
      </section>
      <section>
        <h2>8. Contact</h2>
        <p>
          Questions about these terms:{" "}
          <a href={`mailto:${settings.support_email}`}>{settings.support_email}</a>. These terms are
          governed by the laws of India.
        </p>
      </section>
    </LegalPage>
  );
}
