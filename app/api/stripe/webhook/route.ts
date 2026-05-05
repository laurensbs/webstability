import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { organizations, subscriptions, invoices } from "@/lib/db/schema";

export const runtime = "nodejs";

type SubStatus = "active" | "past_due" | "cancelled" | "trialing" | "incomplete";

function mapSubStatus(s: Stripe.Subscription.Status): SubStatus {
  switch (s) {
    case "active":
      return "active";
    case "past_due":
      return "past_due";
    case "canceled":
    case "unpaid":
    case "paused":
      return "cancelled";
    case "trialing":
      return "trialing";
    default:
      return "incomplete";
  }
}

async function findOrgByCustomer(customerId: string) {
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.stripeCustomerId, customerId),
  });
  return org ?? null;
}

async function upsertSubscription(stripeSub: Stripe.Subscription) {
  const customerId =
    typeof stripeSub.customer === "string" ? stripeSub.customer : stripeSub.customer.id;
  const org = await findOrgByCustomer(customerId);
  if (!org) return;

  const planMeta = (stripeSub.metadata?.plan ?? "pro") as "basic" | "pro" | "partner";
  const periodEnd = stripeSub.items.data[0]?.current_period_end ?? null;

  const existing = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.stripeSubscriptionId, stripeSub.id),
  });

  const values = {
    organizationId: org.id,
    plan: planMeta,
    status: mapSubStatus(stripeSub.status),
    currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    stripeSubscriptionId: stripeSub.id,
    cancelAt: stripeSub.cancel_at ? new Date(stripeSub.cancel_at * 1000) : null,
  };

  if (existing) {
    await db.update(subscriptions).set(values).where(eq(subscriptions.id, existing.id));
  } else {
    await db.insert(subscriptions).values(values);
  }

  // Reflect plan on org for fast reads.
  if (stripeSub.status === "active" || stripeSub.status === "trialing") {
    await db
      .update(organizations)
      .set({ plan: planMeta, planStartedAt: new Date(stripeSub.start_date * 1000) })
      .where(eq(organizations.id, org.id));
  }
}

async function upsertInvoice(stripeInv: Stripe.Invoice) {
  const customerId =
    typeof stripeInv.customer === "string" ? stripeInv.customer : stripeInv.customer?.id;
  if (!customerId || !stripeInv.id) return;
  const org = await findOrgByCustomer(customerId);
  if (!org) return;

  const status =
    stripeInv.status === "paid"
      ? "paid"
      : stripeInv.status === "void" || stripeInv.status === "uncollectible"
        ? "cancelled"
        : stripeInv.status === "open"
          ? "sent"
          : "draft";

  const existing = await db.query.invoices.findFirst({
    where: eq(invoices.stripeInvoiceId, stripeInv.id),
  });

  const vatAmount = (stripeInv.total_taxes ?? []).reduce((sum, t) => sum + (t.amount ?? 0), 0);

  const values = {
    organizationId: org.id,
    number: stripeInv.number ?? `STRIPE-${stripeInv.id.slice(-8).toUpperCase()}`,
    amount: stripeInv.subtotal,
    vatAmount,
    currency: (stripeInv.currency ?? "eur").toUpperCase(),
    status: status as "draft" | "sent" | "paid" | "overdue" | "cancelled",
    dueAt: stripeInv.due_date ? new Date(stripeInv.due_date * 1000) : null,
    paidAt:
      stripeInv.status === "paid" && stripeInv.status_transitions.paid_at
        ? new Date(stripeInv.status_transitions.paid_at * 1000)
        : null,
    pdfUrl: stripeInv.invoice_pdf ?? null,
    stripeInvoiceId: stripeInv.id,
  };

  if (existing) {
    await db.update(invoices).set(values).where(eq(invoices.id, existing.id));
  } else {
    await db.insert(invoices).values(values);
  }
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET missing" }, { status: 500 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "missing signature" }, { status: 400 });

  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "invalid signature";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await upsertSubscription(event.data.object as Stripe.Subscription);
        break;
      case "invoice.created":
      case "invoice.finalized":
      case "invoice.paid":
      case "invoice.payment_failed":
      case "invoice.voided":
        await upsertInvoice(event.data.object as Stripe.Invoice);
        break;
    }
  } catch (err) {
    console.error("stripe webhook handler error", err);
    return NextResponse.json({ error: "handler_failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
