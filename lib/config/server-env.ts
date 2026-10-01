import "server-only";

import { parseServerEnv, type ServerEnv } from "./env";

/**
 * Server-side environment. Importing this module from a Client Component
 * fails the build thanks to `server-only`, which is the guarantee that no
 * secret ever ships to the browser.
 */
export const serverEnv: ServerEnv = parseServerEnv(process.env);

export const featureFlags = {
  paymentsEnabled: serverEnv.PAYMENTS_ENABLED,
} as const;
