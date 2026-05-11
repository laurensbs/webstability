"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, organizations, subscriptions, auditLog } from "@/lib/db/schema";
import {
  stripe,
  priceIdFor,
  buildPriceIdFor,
  type CarePlanId,
  type BuildExtensionId,
} from "@/lib/stripe";
import { DemoReadonlyError } from "@/lib/demo-guard";
import { getReferralByCode } from "@/lib/db/queries/referrals";
import type { ActionResult } from "@/lib/action-result";

const TIER_RANK: Record<CarePlanId, number> = { care: 0, studio: 1, atelier: 2 };

const APP_URL = process.env.AUTH_URL ?? "http://localhost:3000";
const REFERRAL_COUPON = process.env.STRIPE_REFERRAL_COUPON ?? "REFERRAL_250";

/**
 * Leest de ws_ref-cookie (gezet door de proxy bij /refer/[code]) en
 * geeft de geldige code terug — of `null` als er geen cookie is, de
 * code niet bestaat, of de referral al geconverteerd is. Wordt door
 * de checkout-flows gebruikt om de Stripe-coupon + metadata te zetten.
 */
async function activeReferralCode(): Promise<string | null> {
  const store = await cookies();
  const code = store.get("ws_ref")?.value?.trim();
  if (!code) return null;
  const referral = await getReferralByCode(code);
  if (!referral || referral.convertedOrgId) return null;
  return referral.code;
}

async function requireOwner() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("unauthorized");
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    with: { organization: true },
  });
  if (!user?.organization) throw new Error("no_org");
  if (user.role !== "owner") throw new Error("forbidden");
  if (user.isDemo) throw new DemoReadonlyError();
  return { user, org: user.organization };
}

async function ensureStripeCustomer(orgId: string, name: string, email: string) {
  const org = await db.query.organizations.findFirst({ where: eq(organizations.id, orgId) });
  if (org?.stripeCustomerId) return org.stripeCustomerId;

  const customer = await stripe().customers.create({
    name,
    email,
    metadata: { organizationId: orgId },
  });
  await db
    .update(organizations)
    .set({ stripeCustomerId: customer.id })
    .where(eq(organizations.id, orgId));
  return customer.id;
}

/**
 * Anonieme checkout — bezoeker is niet ingelogd. Stripe verzamelt
 * email + naam + kaart in de Checkout UI; na success komt de bezoeker
 * terug op /portal/dashboard?checkout=success&session_id=… waar we
 * via een dedicated handler de user + org aanmaken (op basis van de
 * Stripe-customer in die session) en een magic-link mailen.
 *
 * Werkt alleen voor de drie base tiers (care/studio/atelier). Build
 * extensions vragen om een actieve klant en zitten dus achter login.
 */
export async function startAnonCheckout(formData: FormData) {
  const planInput = String(formData.get("plan") ?? "");
  const plan = (["care", "studio", "atelier"] as const).includes(planInput as CarePlanId)
    ? (planInput as CarePlanId)
    : null;
  if (!plan) throw new Error("invalid_plan");

  const priceId = priceIdFor(plan);
  if (!priceId) throw new Error("price_not_configured");

  const referralCode = await activeReferralCode();

  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    // Stripe vraagt zelf om email + naam + kaart. customer_creation
    // zorgt dat er altijd een Stripe Customer wordt aangemaakt zodat
    // we 'm in de webhook kunnen koppelen aan een nieuwe org.
    customer_creation: "always",
    billing_address_collection: "auto",
    ...(referralCode ? { discounts: [{ coupon: REFERRAL_COUPON }] } : {}),
    success_url: `${APP_URL}/checkout/done?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_URL}/prijzen?checkout=cancelled`,
    metadata: { plan, anon: "true", ...(referralCode ? { referral_code: referralCode } : {}) },
    subscription_data: {
      metadata: { plan, anon: "true", ...(referralCode ? { referral_code: referralCode } : {}) },
    },
  });

  if (!session.url) throw new Error("no_checkout_url");
  redirect(session.url);
}

export async function startCareCheckout(formData: FormData) {
  const planInput = String(formData.get("plan") ?? "");
  const plan = (["care", "studio", "atelier"] as const).includes(planInput as CarePlanId)
    ? (planInput as CarePlanId)
    : null;
  if (!plan) throw new Error("invalid_plan");

  const priceId = priceIdFor(plan);
  if (!priceId) throw new Error("price_not_configured");

  let user, org;
  try {
    ({ user, org } = await requireOwner());
  } catch (e) {
    if (e instanceof DemoReadonlyError) redirect("/portal/dashboard?demo=readonly");
    throw e;
  }
  const customerId = await ensureStripeCustomer(org.id, org.name, user.email);
  const referralCode = await activeReferralCode();

  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    ...(referralCode ? { discounts: [{ coupon: REFERRAL_COUPON }] } : {}),
    success_url: `${APP_URL}/portal/dashboard?checkout=success`,
    cancel_url: `${APP_URL}/portal/dashboard?checkout=cancelled`,
    locale: user.locale === "es" ? "es" : "nl",
    metadata: {
      organizationId: org.id,
      plan,
      ...(referralCode ? { referral_code: referralCode } : {}),
    },
    subscription_data: {
      metadata: {
        organizationId: org.id,
        plan,
        ...(referralCode ? { referral_code: referralCode } : {}),
      },
    },
  });

  if (!session.url) throw new Error("no_checkout_url");
  redirect(session.url);
}

/**
 * Subscribe to a base plan PLUS a temporary build extension. The build
 * extension is added as a second line item and the resulting Stripe
 * subscription auto-cancels after `months` billing cycles via
 * `cancel_at`. After cancellation the customer drops to the base plan
 * (which stays active because it's a separate subscription if Stripe
 * splits them, or because cancel_at only targets that line — Stripe's
 * default behaviour: cancel_at applies to the whole sub, so we issue
 * the build add-on as its OWN subscription).
 */
export async function startCareCheckoutWithBuild(formData: FormData) {
  const planInput = String(formData.get("plan") ?? "");
  const buildInput = String(formData.get("build") ?? "");
  const monthsInput = Number(formData.get("months") ?? 0);

  const plan = (["care", "studio", "atelier"] as const).includes(planInput as CarePlanId)
    ? (planInput as CarePlanId)
    : null;
  if (!plan) throw new Error("invalid_plan");

  const build = (["light", "standard", "custom"] as const).includes(buildInput as BuildExtensionId)
    ? (buildInput as BuildExtensionId)
    : null;

  const months = Math.max(2, Math.min(8, Math.round(monthsInput)));

  const planPriceId = priceIdFor(plan);
  if (!planPriceId) throw new Error("price_not_configured");

  let user, org;
  try {
    ({ user, org } = await requireOwner());
  } catch (e) {
    if (e instanceof DemoReadonlyError) redirect("/portal/dashboard?demo=readonly");
    throw e;
  }
  const customerId = await ensureStripeCustomer(org.id, org.name, user.email);

  const baseSession = await stripe().checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: planPriceId, quantity: 1 }],
    success_url: `${APP_URL}/portal/dashboard?checkout=success`,
    cancel_url: `${APP_URL}/portal/dashboard?checkout=cancelled`,
    locale: user.locale === "es" ? "es" : "nl",
    metadata: { organizationId: org.id, plan },
    subscription_data: { metadata: { organizationId: org.id, plan } },
  });

  // Build extension is a separate subscription so cancel_at doesn't kill
  // the base plan when the build phase ends. Created server-side and
  // attached to the same customer; the user lands on Checkout for the
  // base plan first, then sees the add-on on their next invoice.
  if (build) {
    const buildPriceId = buildPriceIdFor(build);
    if (!buildPriceId) throw new Error("build_price_not_configured");

    const cancelAt = Math.floor(Date.now() / 1000) + months * 30 * 24 * 60 * 60;
    await stripe().subscriptions.create({
      customer: customerId,
      items: [{ price: buildPriceId, quantity: 1 }],
      cancel_at: cancelAt,
      metadata: {
        organizationId: org.id,
        build,
        months: String(months),
      },
    });
  }

  if (!baseSession.url) throw new Error("no_checkout_url");
  redirect(baseSession.url);
}

export async function openBillingPortal() {
  let org;
  try {
    ({ org } = await requireOwner());
  } catch (e) {
    if (e instanceof DemoReadonlyError) redirect("/portal/dashboard?demo=readonly");
    throw e;
  }
  if (!org.stripeCustomerId) throw new Error("no_customer");

  const session = await stripe().billingPortal.sessions.create({
    customer: org.stripeCustomerId,
    return_url: `${APP_URL}/portal/dashboard`,
  });
  redirect(session.url);
}

/**
 * Self-serve plan-switch voor de org-owner. Upgrade (naar een hogere
 * tier) gaat direct in met pro-rata facturering; downgrade (naar een
 * lagere tier) gaat pas in op de huidige periode-einde zodat er geen
 * refund-gedoe is. Geeft een ActionResult terug (geen redirect) zodat
 * de portal-UI een toast kan tonen.
 *
 * Bij gelijke tier: no-op success. Vereist een actieve Stripe-sub.
 */
export async function changeMyPlan(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  let user, org;
  try {
    ({ user, org } = await requireOwner());
  } catch (e) {
    if (e instanceof DemoReadonlyError) return { ok: true, messageKey: "demo_readonly" };
    return { ok: false, messageKey: "forbidden" };
  }

  const planInput = String(formData.get("plan") ?? "");
  const target = (["care", "studio", "atelier"] as const).includes(planInput as CarePlanId)
    ? (planInput as CarePlanId)
    : null;
  if (!target) return { ok: false, messageKey: "missing_fields" };

  const current = (org.plan ?? "care") as CarePlanId;
  if (current === target) return { ok: true, messageKey: "saved" };

  const newPriceId = priceIdFor(target);
  if (!newPriceId) return { ok: false, messageKey: "missing_fields" };

  const sub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.organizationId, org.id),
    orderBy: (s, { desc: d }) => [d(s.createdAt)],
  });
  if (!sub?.stripeSubscriptionId) return { ok: false, messageKey: "missing_fields" };

  const isUpgrade = TIER_RANK[target] > TIER_RANK[current];

  try {
    const stripeSub = await stripe().subscriptions.retrieve(sub.stripeSubscriptionId);
    const baseItem = stripeSub.items.data[0];
    if (!baseItem) return { ok: false, messageKey: "missing_fields" };

    if (isUpgrade) {
      // Direct, met pro-rata.
      await stripe().subscriptions.update(sub.stripeSubscriptionId, {
        items: [{ id: baseItem.id, price: newPriceId }],
        proration_behavior: "create_prorations",
        metadata: { owner_plan_change: target, changed_at: String(Date.now()) },
      });
      // Lokale sync — webhook bevestigt later, maar de UI mag direct
      // het nieuwe plan tonen.
      await db
        .update(subscriptions)
        .set({ plan: target, status: "active" })
        .where(eq(subscriptions.id, sub.id));
      await db
        .update(organizations)
        .set({ plan: target, planStartedAt: new Date() })
        .where(eq(organizations.id, org.id));
    } else {
      // Downgrade: schedule op periode-einde. We zetten de item-price
      // niet meteen, maar plannen het via een subscription schedule —
      // simpeler alternatief: proration_behavior 'none' + billing_cycle
      // ongewijzigd betekent de nieuwe prijs geldt vanaf de volgende
      // factuur (Stripe rekent de oude periode niet terug). Het plan
      // verandert pas lokaal als de webhook de nieuwe periode bevestigt.
      await stripe().subscriptions.update(sub.stripeSubscriptionId, {
        items: [{ id: baseItem.id, price: newPriceId }],
        proration_behavior: "none",
        metadata: { owner_plan_change: target, changed_at: String(Date.now()) },
      });
      // Niet lokaal flippen — pas bij de volgende invoice-cyclus via
      // de webhook. De UI toont "ingepland per volgende factuur".
    }

    await db.insert(auditLog).values({
      organizationId: org.id,
      userId: user.id,
      action: "subscription.plan_changed_by_owner",
      targetType: "subscription",
      targetId: sub.id,
      metadata: { from: current, to: target, immediate: isUpgrade },
    });
  } catch (err) {
    console.error("[billing] owner plan change failed:", err);
    return { ok: false, messageKey: "generic_error" };
  }

  return { ok: true, messageKey: isUpgrade ? "saved" : "scheduled" };
}
