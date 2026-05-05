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
  basic: { id: "basic", priceEnv: "STRIPE_PRICE_CARE_BASIC", monthly: 195 },
  pro: { id: "pro", priceEnv: "STRIPE_PRICE_CARE_PRO", monthly: 395 },
  partner: { id: "partner", priceEnv: "STRIPE_PRICE_CARE_PARTNER", monthly: 795 },
} as const;

export type CarePlanId = keyof typeof CARE_PLANS;

export function priceIdFor(plan: CarePlanId): string | null {
  return process.env[CARE_PLANS[plan].priceEnv] ?? null;
}
