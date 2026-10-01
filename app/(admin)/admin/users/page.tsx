import type { Route } from "next";
import { Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { UserRowActions } from "@/features/admin/components/user-row-actions";
import { getAdminUsers } from "@/features/admin/queries";
import { PAGE_SIZE, userFilterSchema } from "@/features/admin/schema";
import { getCurrentUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Users" };

const roleTabs = [
  { value: "all", label: "All" },
  { value: "tenant", label: "Tenants" },
  { value: "owner", label: "Owners" },
  { value: "admin", label: "Admins" },
] as const;
const statusTabs = [
  { value: "all", label: "Any status" },
  { value: "active", label: "Active" },
  { value: "blocked", label: "Blocked" },
] as const;

export default async function AdminUsersPage({ searchParams }: PageProps<"/admin/users">) {
  const raw = await searchParams;
  const filter = userFilterSchema.parse(raw);
  const [{ rows, total }, me] = await Promise.all([getAdminUsers(filter), getCurrentUser()]);

  const href = (overrides: Partial<typeof filter>) => {
    const next = { ...filter, ...overrides };
    const params = new URLSearchParams();
    if (next.role !== "all") params.set("role", next.role);
    if (next.status !== "all") params.set("status", next.status);
    if (next.q) params.set("q", next.q);
    if (next.page > 1) params.set("page", String(next.page));
    const qs = params.toString();
    return `/admin/users${qs ? `?${qs}` : ""}` as Route;
  };

  const pill = (active: boolean) =>
    cn(
      "rounded-pill border px-3.5 py-1.5 text-sm font-medium transition",
      active
        ? "border-primary bg-primary text-white"
        : "border-border bg-white hover:border-primary/50",
    );

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-muted text-sm">
            Blocking signs the user out of every area and is recorded in the audit log.
          </p>
        </div>
        <form method="get" action="/admin/users" role="search" className="flex gap-2">
          {filter.role !== "all" ? <input type="hidden" name="role" value={filter.role} /> : null}
          {filter.status !== "all" ? (
            <input type="hidden" name="status" value={filter.status} />
          ) : null}
          <label className="sr-only" htmlFor="q">
            Search name, email or phone
          </label>
          <input
            id="q"
            name="q"
            defaultValue={filter.q}
            placeholder="Name, email or phone"
            className="rounded-pill border-border focus:border-primary h-10 border px-4 text-sm focus:outline-none"
          />
          <button
            type="submit"
            className="rounded-pill bg-primary inline-flex h-10 items-center gap-1 px-4 text-sm font-medium text-white"
          >
            <Search className="h-4 w-4" aria-hidden /> Search
          </button>
        </form>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {roleTabs.map((t) => (
          <Link
            key={t.value}
            href={href({ role: t.value, page: 1 })}
            className={pill(filter.role === t.value)}
          >
            {t.label}
          </Link>
        ))}
        <span className="bg-border mx-2 h-6 w-px" aria-hidden />
        {statusTabs.map((t) => (
          <Link
            key={t.value}
            href={href({ status: t.value, page: 1 })}
            className={pill(filter.status === t.value)}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="rounded-card border-border/60 overflow-x-auto border bg-white">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-surface text-muted text-left text-xs tracking-wide uppercase">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-border/60 divide-y">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-muted px-4 py-10 text-center">
                  No users match.
                </td>
              </tr>
            ) : (
              rows.map((u) => (
                <tr key={u.id} className="align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium">
                      {u.first_name} {u.last_name}
                    </p>
                    {u.owner_profile?.business_name ? (
                      <p className="text-muted text-xs">{u.owner_profile.business_name}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      tone={
                        u.role === "admin" ? "warning" : u.role === "owner" ? "info" : "neutral"
                      }
                    >
                      {u.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{u.email ?? "—"}</td>
                  <td className="px-4 py-3">{u.phone ?? "—"}</td>
                  <td className="px-4 py-3">{formatDate(u.created_at)}</td>
                  <td className="px-4 py-3">
                    {u.is_active ? (
                      <Badge tone="success">Active</Badge>
                    ) : (
                      <Badge tone="danger">Blocked</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <UserRowActions
                      userId={u.id}
                      isActive={u.is_active}
                      role={u.role}
                      isSelf={u.id === me?.id}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        page={filter.page}
        pageSize={PAGE_SIZE}
        total={total}
        makeHref={(page) => href({ page })}
      />
    </section>
  );
}
