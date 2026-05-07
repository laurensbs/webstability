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

// --- Admin-side helpers --------------------------------------------------
//
// Server-only utilities die we vanuit /admin gebruiken om abonnementen te
// muteren namens een klant. Stripe is single source of truth — we lezen
// state van Stripe terug en sync'en lokale `subscriptions`-rows na elke
// mutatie.

/**
 * Haal de actieve subscription van een Stripe-customer op, met de eerste
 * line-item (de base-plan). Returnt null als er geen actieve sub is.
 *
 * Faalt graceful: bij API-error returnt null zodat de admin-UI nog
 * steeds kan renderen; staff ziet dan de DB-row als fallback.
 */
export async function getActiveStripeSubscription(stripeCustomerId: string) {
  if (!stripeCustomerId) return null;
  try {
    const subs = await stripe().subscriptions.list({
      customer: stripeCustomerId,
      status: "all",
      limit: 5,
    });
    // Prefer active/trialing, fallback naar meest-recente niet-cancelled.
    const ranked = [...subs.data].sort((a, b) => {
      const aActive = a.status === "active" || a.status === "trialing" ? 1 : 0;
      const bActive = b.status === "active" || b.status === "trialing" ? 1 : 0;
      if (aActive !== bActive) return bActive - aActive;
      return b.created - a.created;
    });
    return ranked[0] ?? null;
  } catch {
    return null;
  }
}

/**
 * Plan-wissel — vervang de hoofdprice op een bestaande subscription.
 * Stripe handelt prorate automatisch (default behavior). Faalt als de
 * subscription niet bestaat.
 */
export async function changeSubscriptionPlan(
  stripeSubscriptionId: string,
  newPlan: CarePlanId,
): Promise<void> {
  const newPriceId = priceIdFor(newPlan);
  if (!newPriceId) throw new Error(`No price ID for plan ${newPlan}`);
  const sub = await stripe().subscriptions.retrieve(stripeSubscriptionId);
  const baseItem = sub.items.data[0];
  if (!baseItem) throw new Error("Subscription has no items");
  await stripe().subscriptions.update(stripeSubscriptionId, {
    items: [{ id: baseItem.id, price: newPriceId }],
    proration_behavior: "create_prorations",
    metadata: { admin_plan_change: newPlan, changed_at: String(Date.now()) },
  });
}

/**
 * Pauzeer collection van een subscription voor N maanden. Stripe blijft
 * de sub als 'active' tonen maar genereert geen invoices tot resumes_at.
 */
export async function pauseStripeSubscription(
  stripeSubscriptionId: string,
  months: number,
): Promise<void> {
  const m = Math.max(1, Math.min(3, Math.round(months)));
  const resumesAt = Math.floor(Date.now() / 1000) + m * 30 * 24 * 60 * 60;
  await stripe().subscriptions.update(stripeSubscriptionId, {
    pause_collection: {
      behavior: "void",
      resumes_at: resumesAt,
    },
    metadata: { admin_paused_months: String(m) },
  });
}

/**
 * Resume een gepauzeerde sub direct.
 */
export async function resumeStripeSubscription(stripeSubscriptionId: string): Promise<void> {
  await stripe().subscriptions.update(stripeSubscriptionId, {
    pause_collection: "",
  });
}

/**
 * Cancel een subscription per einde van de huidige periode (zachte
 * cancel — klant houdt toegang tot huidige periode-eind).
 */
export async function cancelStripeSubscription(stripeSubscriptionId: string): Promise<void> {
  await stripe().subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: true,
    metadata: { admin_cancelled_at: String(Date.now()) },
  });
}

/**
 * Maak een Stripe-coupon aan en pas hem direct toe op de subscription.
 * Returnt het coupon-id voor opslag in de discounts-tabel.
 *
 * percentOff: 5-100. monthsApplied: null = forever, anders 1-12.
 */
export async function applyDiscountCoupon({
  stripeSubscriptionId,
  percentOff,
  monthsApplied,
  orgName,
}: {
  stripeSubscriptionId: string;
  percentOff: number;
  monthsApplied: number | null;
  orgName: string;
}): Promise<string> {
  const pct = Math.max(5, Math.min(100, Math.round(percentOff)));
  const duration: "forever" | "repeating" = monthsApplied === null ? "forever" : "repeating";
  const couponPayload: Stripe.CouponCreateParams = {
    percent_off: pct,
    duration,
    name: `Studio-discount voor ${orgName} (${pct}%)`,
    metadata: { admin_grant: "1", granted_at: String(Date.now()) },
  };
  if (duration === "repeating" && monthsApplied !== null) {
    couponPayload.duration_in_months = Math.max(1, Math.min(12, monthsApplied));
  }
  const coupon = await stripe().coupons.create(couponPayload);
  await stripe().subscriptions.update(stripeSubscriptionId, {
    discounts: [{ coupon: coupon.id }],
  });
  return coupon.id;
}
