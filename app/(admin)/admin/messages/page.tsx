import { Inbox, Mail, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ActionButton } from "@/components/ui/action-button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { markContactMessageAction } from "@/features/admin/actions";
import { getContactMessages } from "@/features/admin/queries";
import { PAGE_SIZE } from "@/features/admin/schema";
import { contactInterestOptions } from "@/features/contact/schema";
import { cn } from "@/lib/utils/cn";
import { formatDateTime } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Contact inbox" };

export default async function AdminMessagesPage({ searchParams }: PageProps<"/admin/messages">) {
  const raw = await searchParams;
  const scope = raw.scope === "all" ? "all" : "unread";
  const page = Math.max(1, Number(raw.page) || 1);
  const { rows, total } = await getContactMessages(scope, page);
  const label = (v: string) => contactInterestOptions.find((o) => o.value === v)?.label ?? v;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Contact inbox</h1>
        <p className="text-muted text-sm">
          Messages from the public contact form. Reply by email or phone, then mark handled.
        </p>
      </div>
      <nav className="flex gap-2" aria-label="Scope">
        {(["unread", "all"] as const).map((s) => (
          <Link
            key={s}
            href={s === "unread" ? "/admin/messages" : "/admin/messages?scope=all"}
            className={cn(
              "rounded-pill border px-3.5 py-1.5 text-sm font-medium",
              scope === s
                ? "border-primary bg-primary text-white"
                : "border-border hover:border-primary/50 bg-white",
            )}
          >
            {s === "unread" ? "Unread" : "All"}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <EmptyState
          Icon={Inbox}
          title={scope === "unread" ? "Inbox zero" : "No messages yet"}
          body="New submissions from /contact land here and are emailed to support."
        />
      ) : (
        <ul className="space-y-3">
          {rows.map((m) => (
            <li
              key={m.id}
              className={cn(
                "rounded-card border bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.04)]",
                m.is_read ? "border-border/60" : "border-primary/40",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {m.name} <span className="text-muted text-xs font-normal">#{m.id}</span>
                  </p>
                  <p className="text-muted mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    <a
                      href={`mailto:${m.email}`}
                      className="hover:text-primary inline-flex items-center gap-1"
                    >
                      <Mail className="h-3.5 w-3.5" aria-hidden />
                      {m.email}
                    </a>
                    {m.phone ? (
                      <a
                        href={`tel:+91${m.phone}`}
                        className="hover:text-primary inline-flex items-center gap-1"
                      >
                        <Phone className="h-3.5 w-3.5" aria-hidden />
                        {m.phone}
                      </a>
                    ) : null}
                    <span>{formatDateTime(m.created_at)}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone="info">{label(m.interest)}</Badge>
                  {m.is_read ? (
                    <Badge tone="success">Handled</Badge>
                  ) : (
                    <Badge tone="warning">Unread</Badge>
                  )}
                </div>
              </div>
              <p className="mt-3 text-sm whitespace-pre-wrap">{m.message}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: your enquiry #${m.id} on Sasta Room`)}`}
                  className="rounded-pill border-border hover:border-primary/50 border px-4 py-1.5 text-sm font-medium"
                >
                  Reply by email
                </a>
                <ActionButton
                  size="sm"
                  variant={m.is_read ? "ghost" : "primary"}
                  action={() => markContactMessageAction(m.id, !m.is_read)}
                >
                  {m.is_read ? "Mark unread" : "Mark handled"}
                </ActionButton>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={total}
        makeHref={(p) => `/admin/messages?${scope === "all" ? "scope=all&" : ""}page=${p}`}
      />
    </section>
  );
}
