import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { eq, and, desc } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { organizations, subscriptions, invoices, auditLog, users } from "@/lib/db/schema";
import { markReferralConverted } from "@/lib/db/queries/referrals";
import { sendExitSurveyMail } from "@/lib/email/exit-survey";

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

  const planMeta = (stripeSub.metadata?.plan ?? "studio") as "care" | "studio" | "atelier";
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

  // Cancel-transitie detecteren *vóór* de update: existing.cancelAt
  // null → nieuwe waarde gezet = klant heeft net opgezegd. Self-cancel
  // via Stripe Customer Portal (admin-cancel logt z'n eigen audit-entry
  // en gaat ook door deze webhook). We onderscheiden de twee via een
  // audit-log lookup verderop.
  const wasCancelled = Boolean(existing?.cancelAt);
  const becomingCancelled = Boolean(stripeSub.cancel_at) && !wasCancelled;

  if (existing) {
    await db.update(subscriptions).set(values).where(eq(subscriptions.id, existing.id));
  } else {
    await db.insert(subscriptions).values(values);
  }

  // Exit-survey mail bij self-cancel (KX13). Voorwaarden:
  // - net pas cancel-at-period-end gezet
  // - geen recent 'subscription.cancelled' audit-entry van *admin*
  //   (anders is dit een door Laurens uitgevoerde cancel — geen
  //   survey, want het is al een persoonlijk gesprek geweest)
  // - nog geen eerdere exit-survey verstuurd voor deze sub-cycle
  if (becomingCancelled) {
    try {
      // Idempotency + admin-cancel exclude — beide via auditLog.
      const recentAudit = await db.query.auditLog.findMany({
        where: and(eq(auditLog.organizationId, org.id), eq(auditLog.targetType, "subscription")),
        orderBy: [desc(auditLog.createdAt)],
        limit: 10,
      });
      const alreadySent = recentAudit.some(
        (a) =>
          a.action === "subscription.exit_survey_sent" &&
          // metadata.subId match — anders een eerdere cycle
          (a.metadata as { subId?: string } | null)?.subId === stripeSub.id,
      );
      const adminCancelled = recentAudit.some(
        (a) =>
          a.action === "subscription.cancelled" &&
          a.targetId === existing?.id &&
          // binnen 5 minuten = admin-actie die dezelfde webhook triggerde
          Date.now() - a.createdAt.getTime() < 5 * 60 * 1000,
      );

      if (!alreadySent && !adminCancelled) {
        const owner = await db.query.users.findFirst({
          where: and(eq(users.organizationId, org.id), eq(users.role, "owner")),
          columns: { email: true, name: true, locale: true },
        });
        if (owner?.email) {
          await sendExitSurveyMail({
            to: owner.email,
            name: owner.name,
            orgName: org.name,
            locale: owner.locale,
          });
          await db.insert(auditLog).values({
            organizationId: org.id,
            userId: null,
            action: "subscription.exit_survey_sent",
            targetType: "subscription",
            targetId: existing?.id ?? null,
            metadata: { subId: stripeSub.id, to: owner.email },
          });
        }
      }
    } catch (err) {
      // Mail-failure mag de webhook niet kapot maken — Stripe gaat anders
      // retry'en en we krijgen dubbele mails als de mail dán wél lukt.
      console.error("[stripe webhook] exit-survey mail failed:", err);
    }
  }

  // Reflect plan on org for fast reads.
  if (stripeSub.status === "active" || stripeSub.status === "trialing") {
    await db
      .update(organizations)
      .set({ plan: planMeta, planStartedAt: new Date(stripeSub.start_date * 1000) })
      .where(eq(organizations.id, org.id));
  }

  // Referral-conversie: als de subscription-metadata een referral_code
  // bevat, markeer 'm als geconverteerd (idempotent — markReferralConverted
  // is no-op als al geconverteerd of self-referral). Doen we hier i.p.v.
  // bij checkout.session.completed omdat de org-koppeling pas hier
  // gegarandeerd bestaat (anon-checkout maakt de org aan in /checkout/done).
  const referralCode = stripeSub.metadata?.referral_code;
  if (referralCode && (stripeSub.status === "active" || stripeSub.status === "trialing")) {
    const converted = await markReferralConverted(referralCode, org.id);
    if (converted) {
      await db.insert(auditLog).values({
        organizationId: org.id,
        userId: null,
        action: "referral.converted",
        targetType: "organization",
        targetId: org.id,
        metadata: { referralCode },
      });
    }
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
