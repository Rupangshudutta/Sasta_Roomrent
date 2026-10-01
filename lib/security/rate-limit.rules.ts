/** Limits per action. Kept free of server-only imports so they can be unit tested. */
export type RateLimitRule = { scope: string; limit: number; windowSeconds: number };

export const rateLimitRules = {
  register: { scope: "register", limit: 5, windowSeconds: 60 * 60 },
  login: { scope: "login", limit: 10, windowSeconds: 15 * 60 },
  forgotPassword: { scope: "forgot", limit: 3, windowSeconds: 60 * 60 },
  contact: { scope: "contact", limit: 5, windowSeconds: 60 * 60 },
  bookingRequest: { scope: "booking", limit: 10, windowSeconds: 60 * 60 },
  paymentOrder: { scope: "pay-order", limit: 10, windowSeconds: 10 * 60 },
} as const satisfies Record<string, RateLimitRule>;
