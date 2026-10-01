"use client";

import { useEffect } from "react";

import { recordListingViewAction } from "@/features/favorites/actions";

/**
 * Counts one view per listing per browser session. sessionStorage is the dedupe
 * key, so refreshes and back/forward do not inflate the counter; a new tab or
 * a new day counts again, which is the behaviour owners expect from "views".
 */
export function ViewTracker({ propertyId }: { propertyId: string }) {
  useEffect(() => {
    const key = `viewed:${propertyId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Storage blocked (private mode): still count, at worst once per render.
    }
    void recordListingViewAction(propertyId);
  }, [propertyId]);
  return null;
}
