import type { Route } from "next";
import {
  Bell,
  Building2,
  CalendarCheck,
  CreditCard,
  Heart,
  Inbox,
  LayoutDashboard,
  PlusCircle,
  UserRound,
  Users,
  type LucideIcon,
} from "lucide-react";

import type { UserRole } from "@/lib/auth/session";

export type NavItem = { href: Route; label: string; Icon: LucideIcon };

export const dashboardNav: Record<UserRole, { areaLabel: string; items: readonly NavItem[] }> = {
  tenant: {
    areaLabel: "Tenant",
    items: [
      { href: "/dashboard", label: "Overview", Icon: LayoutDashboard },
      { href: "/dashboard/bookings", label: "My requests", Icon: CalendarCheck },
      { href: "/dashboard/favorites", label: "Saved rooms", Icon: Heart },
      { href: "/dashboard/payments", label: "Payments", Icon: CreditCard },
      { href: "/notifications", label: "Notifications", Icon: Bell },
      { href: "/dashboard/profile", label: "Profile", Icon: UserRound },
    ],
  },
  owner: {
    areaLabel: "Owner",
    items: [
      { href: "/owner", label: "Overview", Icon: LayoutDashboard },
      { href: "/owner/properties", label: "My listings", Icon: Building2 },
      { href: "/owner/properties/new", label: "Add listing", Icon: PlusCircle },
      { href: "/owner/bookings", label: "Booking requests", Icon: CalendarCheck },
      { href: "/notifications", label: "Notifications", Icon: Bell },
      { href: "/owner/profile", label: "Profile", Icon: UserRound },
    ],
  },
  admin: {
    areaLabel: "Admin",
    items: [
      { href: "/admin", label: "Overview", Icon: LayoutDashboard },
      { href: "/admin/listings", label: "Listings review", Icon: Building2 },
      { href: "/admin/users", label: "Users", Icon: Users },
      { href: "/admin/messages", label: "Contact inbox", Icon: Inbox },
      { href: "/admin/payments", label: "Payments", Icon: CreditCard },
      { href: "/notifications", label: "Notifications", Icon: Bell },
    ],
  },
};
