"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, organizations } from "@/lib/db/schema";
import {
  stripe,
  priceIdFor,
  buildPriceIdFor,
  type CarePlanId,
  type BuildExtensionId,
} from "@/lib/stripe";

const APP_URL = process.env.AUTH_URL ?? "http://localhost:3000";

async function requireOwner() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("unauthorized");
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    with: { organization: true },
  });
  if (!user?.organization) throw new Error("no_org");
  if (user.role !== "owner") throw new Error("forbidden");
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

export async function startCareCheckout(formData: FormData) {
  const planInput = String(formData.get("plan") ?? "");
  const plan = (["care", "studio", "atelier"] as const).includes(planInput as CarePlanId)
    ? (planInput as CarePlanId)
    : null;
  if (!plan) throw new Error("invalid_plan");

  const priceId = priceIdFor(plan);
  if (!priceId) throw new Error("price_not_configured");

  const { user, org } = await requireOwner();
  const customerId = await ensureStripeCustomer(org.id, org.name, user.email);

  const session = await stripe().checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${APP_URL}/portal/dashboard?checkout=success`,
    cancel_url: `${APP_URL}/portal/dashboard?checkout=cancelled`,
    locale: user.locale === "es" ? "es" : "nl",
    metadata: { organizationId: org.id, plan },
    subscription_data: { metadata: { organizationId: org.id, plan } },
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

  const { user, org } = await requireOwner();
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
  const { org } = await requireOwner();
  if (!org.stripeCustomerId) throw new Error("no_customer");

  const session = await stripe().billingPortal.sessions.create({
    customer: org.stripeCustomerId,
    return_url: `${APP_URL}/portal/dashboard`,
  });
  redirect(session.url);
}
