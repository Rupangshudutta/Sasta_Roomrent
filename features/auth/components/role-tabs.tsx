"use client";

import { Building2, UserRound } from "lucide-react";

import { cn } from "@/lib/utils/cn";

import type { SignupRole } from "../schema";

/**
 * The "I am a tenant / I am an owner" selector from the prototype. It is a
 * radio group under the hood, so the value travels with the form (name="role")
 * and keyboard users can switch with arrow keys.
 */
type RoleTabsProps = {
  value: SignupRole;
  onChange: (role: SignupRole) => void;
};

const roles: ReadonlyArray<{ value: SignupRole; label: string; Icon: typeof UserRound }> = [
  { value: "tenant", label: "I'm looking for a room", Icon: UserRound },
  { value: "owner", label: "I'm a property owner", Icon: Building2 },
];

export function RoleTabs({ value, onChange }: RoleTabsProps) {
  return (
    <fieldset className="rounded-card-sm bg-surface grid grid-cols-2 gap-2 p-1">
      <legend className="sr-only">Account type</legend>
      {roles.map(({ value: role, label, Icon }) => {
        const active = role === value;
        return (
          <label
            key={role}
            className={cn(
              "flex cursor-pointer items-center justify-center gap-2 rounded-[10px] px-3 py-2.5 text-sm font-medium transition",
              active ? "text-primary bg-white shadow-sm" : "text-muted hover:text-ink",
            )}
          >
            <input
              type="radio"
              name="role"
              value={role}
              checked={active}
              onChange={() => onChange(role)}
              className="sr-only"
            />
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </label>
        );
      })}
    </fieldset>
  );
}
