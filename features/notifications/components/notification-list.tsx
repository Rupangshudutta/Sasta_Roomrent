"use client";

import { Bell, CheckCheck } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { ActionButton } from "@/components/ui/action-button";
import type { NotificationRow } from "@/features/notifications/queries";
import { cn } from "@/lib/utils/cn";
import { formatDateTime } from "@/lib/utils/format";

import { markAllNotificationsReadAction, markNotificationReadAction } from "../actions";

export function NotificationList({ notifications }: { notifications: NotificationRow[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const unread = notifications.filter((n) => !n.read_at).length;

  if (notifications.length === 0) {
    return (
      <div className="rounded-card border-border bg-surface flex flex-col items-center border border-dashed px-6 py-12 text-center">
        <Bell className="text-primary h-8 w-8" aria-hidden />
        <p className="mt-3 font-semibold">No notifications yet</p>
        <p className="text-muted text-sm">
          Updates about your listings and requests will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {unread > 0 ? (
        <div className="flex justify-end">
          <ActionButton size="sm" variant="ghost" action={markAllNotificationsReadAction}>
            <CheckCheck className="h-4 w-4" aria-hidden /> Mark all read
          </ActionButton>
        </div>
      ) : null}
      <ul className="divide-border/60 rounded-card border-border/60 divide-y overflow-hidden border bg-white">
        {notifications.map((n) => {
          const content = (
            <>
              <div className="flex items-start justify-between gap-3">
                <p className={cn("font-medium", !n.read_at && "text-ink")}>{n.title}</p>
                {!n.read_at ? (
                  <span
                    className="bg-primary mt-1.5 h-2 w-2 shrink-0 rounded-full"
                    aria-label="Unread"
                  />
                ) : null}
              </div>
              {n.body ? <p className="text-muted mt-0.5 text-sm">{n.body}</p> : null}
              <p className="text-muted mt-1 text-xs">{formatDateTime(n.created_at)}</p>
            </>
          );
          const onOpen = () => {
            if (!n.read_at) {
              startTransition(async () => {
                await markNotificationReadAction(n.id);
                router.refresh();
              });
            }
          };
          return (
            <li key={n.id} className={cn("px-5 py-4", !n.read_at && "bg-primary/[0.03]")}>
              {n.href ? (
                <Link href={n.href} onClick={onOpen} className="hover:text-primary block">
                  {content}
                </Link>
              ) : (
                <button type="button" onClick={onOpen} className="block w-full text-left">
                  {content}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
