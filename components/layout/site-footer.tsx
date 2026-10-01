import { Home } from "lucide-react";
import Link from "next/link";

import { FacebookIcon, InstagramIcon, LinkedinIcon, XIcon } from "@/components/icons/social";
import { getPlatformSettings } from "@/features/catalog/queries";
import { footerNav } from "@/lib/config/site";

const socials = [
  { label: "Facebook", Icon: FacebookIcon, href: "https://facebook.com" },
  { label: "X (Twitter)", Icon: XIcon, href: "https://x.com" },
  { label: "Instagram", Icon: InstagramIcon, href: "https://instagram.com" },
  { label: "LinkedIn", Icon: LinkedinIcon, href: "https://linkedin.com" },
] as const;

/** Dark four-column footer from the prototype. */
export async function SiteFooter() {
  const settings = await getPlatformSettings();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-ink pt-12 pb-8 text-white">
      <div className="mx-auto w-full max-w-7xl px-4">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <p className="flex items-center gap-2 text-xl font-bold">
              <Home className="h-5 w-5" aria-hidden />
              {settings.platform_name}
            </p>
            <p className="mt-4 text-sm/6 text-white/70">
              Your trusted partner for long-term accommodation. Find PGs, shared rooms, single
              rooms, and flats at the best prices.
            </p>
            <ul className="mt-5 flex gap-3">
              {socials.map(({ label, Icon, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    aria-label={label}
                    rel="noopener noreferrer"
                    target="_blank"
                    className="hover:bg-primary inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition"
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <FooterColumn
            title="Quick Links"
            items={footerNav.quickLinks}
            className="md:col-span-2"
          />
          <FooterColumn title="Support" items={footerNav.support} className="md:col-span-3" />
          <div className="md:col-span-3">
            <FooterColumn title="For Property Owners" items={footerNav.owners} />
            <p className="mt-5 text-sm font-semibold">Need help?</p>
            <p className="text-sm text-white/70">
              <a href={`mailto:${settings.support_email}`} className="hover:text-white">
                {settings.support_email}
              </a>
              <br />
              <a
                href={`tel:${settings.support_phone.replace(/\s/g, "")}`}
                className="hover:text-white"
              >
                {settings.support_phone}
              </a>
            </p>
          </div>
        </div>
        <hr className="my-8 border-white/10" />
        <p className="text-center text-sm text-white/70">
          &copy; {year} {settings.platform_name}. All rights reserved. | Made with ❤️ for better
          living
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  items,
  className,
}: {
  title: string;
  items: ReadonlyArray<{ href: string; label: string }>;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="mb-4 font-semibold">{title}</p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.href + item.label}>
            <Link href={item.href} className="text-sm text-white/70 transition hover:text-white">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
