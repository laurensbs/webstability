import { NextResponse } from "next/server";
import { and, eq, lt, isNull, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { leads, leadActivity } from "@/lib/db/schema";
import { sendOutreachMail } from "@/lib/email/lead-outreach";

/**
 * Lead-nurture-cron — dagelijks 10:00 (Vercel cron-config). Stuurt
 * ÉÉN automatische opvolg-mail naar leads die zijn blijven liggen:
 * status cold of warmed, geen actieve opvolging gepland (nextActionAt
 * is null), geen eerdere auto-nurture (nurturedAt is null), en al
 * minstens 7 dagen geen activiteit (updatedAt ouder dan 7 dagen).
 *
 * Cold → `lead_outreach_intro`. Warmed (heeft interesse getoond,
 * bv. demo-bezoek) → `lead_dormant_revive`. Na deze ene mail is het
 * aan mij; de cron raakt dezelfde lead niet opnieuw aan (nurturedAt
 * gezet). Bewust ééns — geen drip-campagne, geen spam.
 *
 * Faalt graceful per lead. Audit via een lead_activity-entry.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authOk(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

const STALE_DAYS = 7;
// Veiligheidsklep: stuur per run maximaal dit aantal mails — voorkomt
// dat een achterstallige database in één keer 50 mails uitspuugt.
const MAX_PER_RUN = 15;

export async function GET(req: Request) {
  if (!authOk(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000);

  const candidates = await db
    .select({
      id: leads.id,
      email: leads.email,
      name: leads.name,
      status: leads.status,
    })
    .from(leads)
    .where(
      and(
        inArray(leads.status, ["cold", "warmed"]),
        isNull(leads.nextActionAt),
        isNull(leads.nurturedAt),
        lt(leads.updatedAt, cutoff),
      ),
    )
    .limit(MAX_PER_RUN);

  const sent: string[] = [];
  const skipped: string[] = [];

  for (const lead of candidates) {
    try {
      if (!lead.email || !lead.email.includes("@")) {
        skipped.push(`${lead.id}:no-email`);
        continue;
      }
      const template = lead.status === "warmed" ? "lead_dormant_revive" : "lead_outreach_intro";

      await sendOutreachMail({
        to: lead.email,
        leadName: lead.name,
        template,
      });

      await db
        .update(leads)
        .set({ nurturedAt: new Date(), updatedAt: new Date() })
        .where(eq(leads.id, lead.id));

      await db.insert(leadActivity).values({
        leadId: lead.id,
        kind: "mail_sent",
        summary: `Automatische opvolg-mail verstuurd (${template})`,
        actorStaffId: null,
        metadata: { template, auto: true },
      });

      sent.push(lead.id);
    } catch (err) {
      console.error(`[nurture-leads] lead ${lead.id} failed:`, err);
      skipped.push(`${lead.id}:error`);
    }
  }

  return NextResponse.json({
    ok: true,
    sentCount: sent.length,
    skippedCount: skipped.length,
    sent,
    skipped,
  });
}
