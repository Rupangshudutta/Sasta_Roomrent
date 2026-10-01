"use client";

import { Heart } from "lucide-react";
import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";

import { cn } from "@/lib/utils/cn";

import { setFavoriteAction } from "../actions";

type Props = {
  propertyId: string;
  initialSaved: boolean;
  isAuthenticated: boolean;
  nextPath: string;
  variant?: "overlay" | "inline";
};

/**
 * The prototype's wishlist heart, backed by the database instead of localStorage.
 * useOptimistic flips the heart immediately; a failed action reverts it and
 * shows the reason. Visitors are sent to sign in and come back to this page.
 */
export function FavoriteButton({
  propertyId,
  initialSaved,
  isAuthenticated,
  nextPath,
  variant = "overlay",
}: Props) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [optimisticSaved, setOptimisticSaved] = useOptimistic(saved);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const toggle = () => {
    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent(nextPath)}`);
      return;
    }
    const next = !optimisticSaved;
    setError(null);
    startTransition(async () => {
      setOptimisticSaved(next);
      const result = await setFavoriteAction(propertyId, next);
      if (result.ok) setSaved(result.data.saved);
      else setError(result.message);
    });
  };

  const label = optimisticSaved ? "Remove from saved rooms" : "Save this room";

  if (variant === "inline") {
    return (
      <span className="inline-flex flex-col items-start gap-1">
        <button
          type="button"
          onClick={toggle}
          disabled={pending}
          aria-pressed={optimisticSaved}
          className={cn(
            "rounded-pill inline-flex h-11 items-center gap-2 border px-5 text-sm font-medium transition",
            optimisticSaved
              ? "border-primary bg-primary/5 text-primary"
              : "border-border hover:border-primary/50 bg-white",
          )}
        >
          <Heart className={cn("h-4 w-4", optimisticSaved && "fill-current")} aria-hidden />
          {optimisticSaved ? "Saved" : "Save"}
        </button>
        {error ? <span className="text-danger text-xs">{error}</span> : null}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={optimisticSaved}
      aria-label={label}
      title={error ?? label}
      className={cn(
        "hover:bg-primary relative z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.15)] transition hover:text-white",
        optimisticSaved && "text-primary",
      )}
    >
      <Heart className={cn("h-4 w-4", optimisticSaved && "fill-current")} aria-hidden />
    </button>
  );
}
