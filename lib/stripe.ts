import Stripe from "stripe";

let cached: Stripe | null = null;

export function stripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY missing");
  cached = new Stripe(key, { apiVersion: "2026-04-22.dahlia" });
  return cached;
}

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

// Care plans — Price IDs are created in Stripe Dashboard → Products,
// then dropped into env. Code stays the same regardless of test/live mode.
export const CARE_PLANS = {
  care: { id: "care", priceEnv: "STRIPE_PRICE_CARE", monthly: 69 },
  studio: { id: "studio", priceEnv: "STRIPE_PRICE_STUDIO", monthly: 179 },
  atelier: { id: "atelier", priceEnv: "STRIPE_PRICE_ATELIER", monthly: 399 },
} as const;

export type CarePlanId = keyof typeof CARE_PLANS;

export function priceIdFor(plan: CarePlanId): string | null {
  return process.env[CARE_PLANS[plan].priceEnv] ?? null;
}
