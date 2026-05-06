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
  care: { id: "care", priceEnv: "STRIPE_PRICE_CARE", monthly: 95 },
  studio: { id: "studio", priceEnv: "STRIPE_PRICE_STUDIO", monthly: 179 },
  atelier: { id: "atelier", priceEnv: "STRIPE_PRICE_ATELIER", monthly: 399 },
} as const;

export type CarePlanId = keyof typeof CARE_PLANS;

export function priceIdFor(plan: CarePlanId): string | null {
  return process.env[CARE_PLANS[plan].priceEnv] ?? null;
}

// Build extensions — temporary monthly add-ons for active builds. Each
// has a fixed €/month price; the customer pays it for the duration of
// the build (2-8 months) on top of their base Care/Studio/Atelier tier.
// Subscription is created with `cancel_at` so it auto-stops after N
// billing cycles.
export const BUILD_EXTENSIONS = {
  light: { id: "light", priceEnv: "STRIPE_PRICE_BUILD_LIGHT", monthly: 349 },
  standard: { id: "standard", priceEnv: "STRIPE_PRICE_BUILD_STANDARD", monthly: 499 },
  custom: { id: "custom", priceEnv: "STRIPE_PRICE_BUILD_CUSTOM", monthly: 899 },
} as const;

export type BuildExtensionId = keyof typeof BUILD_EXTENSIONS;

export function buildPriceIdFor(ext: BuildExtensionId): string | null {
  return process.env[BUILD_EXTENSIONS[ext].priceEnv] ?? null;
}
