import { Briefcase, ChevronDown, Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { getPlatformSettings } from "@/features/catalog/queries";
import { ContactForm } from "@/features/contact/components/contact-form";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Call, WhatsApp or message the Sasta Room team.",
};

const faqs = [
  {
    q: "How quickly can I find a room?",
    a: "Most users find their perfect room within 2-3 days. You can browse properties instantly, send a booking request, and connect with the owner as soon as they accept. Our reviewed listings ensure you don't waste time on fake properties.",
  },
  {
    q: "Do I need to pay any brokerage?",
    a: "Absolutely not! Sasta Room is 100% broker-free. You connect directly with property owners. No hidden charges, no brokerage fees. Save thousands of rupees that you would otherwise pay to brokers.",
  },
  {
    q: "Are all properties verified?",
    a: "Every listing is reviewed by our team before it goes live. We check the details and photos, and we remove listings that receive complaints. Your safety and trust are our priority.",
  },
  {
    q: "What if I need to cancel my request?",
    a: "You can cancel a booking request any time before you move in from your dashboard. If a payment was made through the platform, refunds follow the policy shown at checkout. Contact our support team for assistance.",
  },
  {
    q: "How do I list my property?",
    a: "It's simple! Sign up as an owner, fill in details, upload photos, and submit. Our team will review your property within 24-48 hours. Listing is completely free.",
  },
  {
    q: "Is my payment information secure?",
    a: "100% secure! Payments on Sasta Room are processed by Razorpay, India's most trusted payment gateway with bank-grade encryption. We never store your card details.",
  },
] as const;

export default async function ContactPage() {
  const settings = await getPlatformSettings();
  const phoneHref = `tel:${settings.support_phone.replace(/[^\d+]/g, "")}`;

  const cards = [
    {
      Icon: Phone,
      title: "Call Us Now",
      body: "Available for your queries",
      link: { href: phoneHref, label: settings.support_phone },
      note: "Instant Support",
    },
    {
      Icon: MessageCircle,
      title: "WhatsApp Chat",
      body: "Get instant replies on WhatsApp",
      link: {
        href: `https://wa.me/${settings.whatsapp_number}`,
        label: "Start Chat",
        external: true,
      },
      note: "Fastest Response Time",
    },
    {
      Icon: Mail,
      title: "Email Support",
      body: "We reply within 2 hours",
      link: { href: `mailto:${settings.support_email}`, label: settings.support_email },
      note: "Detailed Assistance",
    },
  ] as const;

  return (
    <>
      <section className="from-brand to-primary bg-gradient-to-br pt-16 pb-32 text-white">
        <div className="mx-auto w-full max-w-7xl px-4 text-center">
          <h1 className="text-4xl font-bold sm:text-5xl">Get In Touch</h1>
          <p className="mt-4 text-lg opacity-95 sm:text-xl">
            We&apos;re here to help you find your perfect room
          </p>
        </div>
      </section>

      <section className="mx-auto -mt-20 w-full max-w-7xl px-4">
        <ul className="grid gap-6 md:grid-cols-3">
          {cards.map(({ Icon, title, body, link, note }) => (
            <li
              key={title}
              className="hover:border-primary rounded-[20px] border-2 border-transparent bg-white p-8 text-center shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition"
            >
              <span className="from-brand to-primary mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br text-white">
                <Icon className="h-7 w-7" aria-hidden />
              </span>
              <h2 className="mt-4 text-xl font-semibold">{title}</h2>
              <p className="text-muted mt-1 text-sm">{body}</p>
              <a
                href={link.href}
                {...("external" in link && link.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="text-primary hover:text-primary-dark mt-3 inline-block text-lg font-semibold break-all"
              >
                {link.label}
              </a>
              <p className="text-muted mt-2 text-xs">{note}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-16 lg:grid-cols-[3fr_2fr]">
        <div className="rounded-[20px] bg-white p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)] sm:p-10">
          <h2 className="text-2xl font-bold">Send Us a Message</h2>
          <p className="text-muted mt-1 mb-6">
            Fill out the form and we&apos;ll get back to you within 2 hours
          </p>
          <ContactForm />
        </div>
        <aside className="from-primary/5 to-secondary/5 space-y-8 rounded-[20px] bg-gradient-to-br p-8">
          <InfoItem Icon={Clock} title="Response Time">
            Average response time: <strong>Under 2 Hours</strong>
            <br />
            <span className="text-sm">We&apos;re committed to helping you quickly</span>
          </InfoItem>
          <InfoItem Icon={MapPin} title="Head Office">
            {settings.office_address}
          </InfoItem>
          <InfoItem Icon={Briefcase} title="Working Hours">
            Phone support: during office hours
            <br />
            Office: {settings.working_hours}
          </InfoItem>
        </aside>
      </section>

      <section id="faq" className="bg-surface py-16">
        <div className="mx-auto w-full max-w-4xl px-4">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold">Frequently Asked Questions</h2>
            <p className="text-muted mt-2">Quick answers to common questions</p>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details key={faq.q} className="group rounded-card bg-white shadow-sm open:shadow-md">
                <summary className="hover:bg-surface flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-lg font-medium [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <ChevronDown
                    className="text-primary h-5 w-5 shrink-0 transition group-open:rotate-180"
                    aria-hidden
                  />
                </summary>
                <p className="text-muted px-6 pb-6">{faq.a}</p>
              </details>
            ))}
          </div>
          <div className="mt-10 text-center">
            <p className="text-lg">Still have questions?</p>
            <Link
              href="#contactForm"
              className="rounded-pill bg-primary hover:bg-primary-dark mt-3 inline-block px-8 py-3 font-semibold text-white transition"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function InfoItem({
  Icon,
  title,
  children,
}: {
  Icon: typeof Clock;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <Icon className="text-primary mt-1 h-7 w-7 shrink-0" aria-hidden />
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-muted mt-1">{children}</p>
      </div>
    </div>
  );
}
