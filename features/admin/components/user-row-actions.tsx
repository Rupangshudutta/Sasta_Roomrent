"use client";

import { Ban, CheckCircle2 } from "lucide-react";
import { useActionState, useState } from "react";

import { ActionButton } from "@/components/ui/action-button";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/lib/actions/result";

import { setUserActiveAction, setUserRoleAction } from "../actions";

type Props = {
  userId: string;
  isActive: boolean;
  role: "tenant" | "owner" | "admin";
  isSelf: boolean;
};

export function UserRowActions({ userId, isActive, role, isSelf }: Props) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<
    ActionResult<undefined> | undefined,
    FormData
  >(setUserActiveAction, undefined);

  if (isSelf || role === "admin") {
    return <span className="text-muted text-xs">{isSelf ? "You" : "Admin"}</span>;
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        <ActionButton
          size="sm"
          variant="ghost"
          action={() => setUserRoleAction(userId, role === "owner" ? "tenant" : "owner")}
          confirmMessage={`Change this user's role to ${role === "owner" ? "tenant" : "owner"}?`}
        >
          Make {role === "owner" ? "tenant" : "owner"}
        </ActionButton>
        <Button
          size="sm"
          variant={isActive ? "outline" : "primary"}
          onClick={() => setOpen((v) => !v)}
        >
          {isActive ? (
            <>
              <Ban className="h-4 w-4" aria-hidden /> Block
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" aria-hidden /> Unblock
            </>
          )}
        </Button>
      </div>
      {open ? (
        <form
          action={formAction}
          className="rounded-card-sm border-border bg-surface flex w-full max-w-xs flex-col gap-2 border p-3"
        >
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="active" value={isActive ? "false" : "true"} />
          <label className="text-xs font-medium" htmlFor={`reason-${userId}`}>
            Note for the audit log {isActive ? "(sent to the user)" : "(optional)"}
          </label>
          <textarea
            id={`reason-${userId}`}
            name="reason"
            rows={2}
            maxLength={500}
            className="rounded-card-sm border-border border px-2 py-1.5 text-sm"
            placeholder={isActive ? "e.g. Repeated fake listings" : ""}
          />
          {state && !state.ok ? <p className="text-danger text-xs">{state.message}</p> : null}
          {state?.ok ? <p className="text-success text-xs">{state.message}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              variant={isActive ? "danger" : "primary"}
              loading={pending}
            >
              Confirm
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
