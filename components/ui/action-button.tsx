"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { ActionResult } from "@/lib/actions/result";

import { Button, type ButtonProps } from "./button";

/**
 * Button that invokes a Server Action returning ActionResult, with optional
 * confirmation, a pending state, and inline feedback. Used for row-level
 * actions (submit, unlist, delete) where a whole form would be overkill.
 */
type ActionButtonProps = Omit<ButtonProps, "onClick" | "type"> & {
  action: () => Promise<ActionResult<unknown>>;
  confirmMessage?: string;
  onDone?: (result: ActionResult<unknown>) => void;
};

export function ActionButton({
  action,
  confirmMessage,
  onDone,
  children,
  ...props
}: ActionButtonProps) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const router = useRouter();

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <Button
        type="button"
        loading={pending}
        onClick={() => {
          if (confirmMessage && !window.confirm(confirmMessage)) return;
          setMessage(null);
          startTransition(async () => {
            const result = await action();
            if (result.ok) {
              setMessage(result.message ? { ok: true, text: result.message } : null);
              router.refresh();
            } else {
              setMessage({ ok: false, text: result.message });
            }
            onDone?.(result);
          });
        }}
        {...props}
      >
        {children}
      </Button>
      {message ? (
        <span role="status" className={`text-xs ${message.ok ? "text-success" : "text-danger"}`}>
          {message.text}
        </span>
      ) : null}
    </span>
  );
}
