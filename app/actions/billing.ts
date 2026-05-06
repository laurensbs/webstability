"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, organizations } from "@/lib/db/schema";
import { stripe, priceIdFor, type CarePlanId } from "@/lib/stripe";

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

export async function openBillingPortal() {
  const { org } = await requireOwner();
  if (!org.stripeCustomerId) throw new Error("no_customer");

  const session = await stripe().billingPortal.sessions.create({
    customer: org.stripeCustomerId,
    return_url: `${APP_URL}/portal/dashboard`,
  });
  redirect(session.url);
}
