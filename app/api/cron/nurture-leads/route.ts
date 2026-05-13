import { NextResponse } from "next/server";
import { and, eq, lt, isNull, inArray, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { leads, leadActivity } from "@/lib/db/schema";
import { sendOutreachMail } from "@/lib/email/lead-outreach";
import { sendConfiguratorWarmReminder } from "@/lib/email/configurator-warm-reminder";

/**
 * Lead-nurture-cron — dagelijks 10:00 (Vercel cron-config). Twee paden:
 *
 * **Pad A — koude/dormante leads** (klassiek). Stuurt ÉÉN automatische
 * opvolg-mail naar leads die zijn blijven liggen: status cold of warmed,
 * geen actieve opvolging gepland (nextActionAt is null), geen eerdere
 * auto-nurture (nurturedAt is null), en al minstens 7 dagen geen
 * activiteit (updatedAt ouder dan 7 dagen). Cold → `lead_outreach_intro`,
 * warmed → `lead_dormant_revive`.
 *
 * **Pad B — configurator-leads waar Laurens te laat is** (warm-keten,
 * KX7). De configurator zet `nextActionAt = morgen` met label
 * "Configurator-aanvraag opvolgen". Als die datum verstreken is en
 * Laurens nog geen handmatige actie heeft genomen (status nog cold/
 * warmed, geen `nurturedAt`), stuurt deze cron een korte excuus-mail
 * met "ik kom morgen écht bij je terug". Bewust ééns — `nurturedAt`
 * markeert 'm.
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

async function localeForLead(leadId: string): Promise<"nl" | "es"> {
  // Pak de oorspronkelijke configurator_submit-activity en lees de locale
  // uit metadata. Fallback NL als er om wat voor reden iets ontbreekt.
  const row = await db.query.leadActivity.findFirst({
    where: eq(leadActivity.leadId, leadId),
    orderBy: [desc(leadActivity.createdAt)],
    columns: { metadata: true, kind: true },
  });
  const meta = (row?.metadata ?? null) as { locale?: unknown } | null;
  return meta?.locale === "es" ? "es" : "nl";
}

export async function GET(req: Request) {
  if (!authOk(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const cutoff = new Date(now.getTime() - STALE_DAYS * 24 * 60 * 60 * 1000);

  // ---- Pad A: koude/dormante leads ----
  const dormantCandidates = await db
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

  for (const lead of dormantCandidates) {
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

  // ---- Pad B: configurator-leads waar de beloofde opvolging is overschreden ----
  // We zoeken leads met source='configurator', status nog cold/warmed,
  // nextActionAt verstreken (> 12u eroverheen voor wat speling), en
  // nog geen automatische mail (nurturedAt IS NULL). De 12u-grace zorgt
  // dat een lead die *vandaag* om 9:00 binnenkomt met nextActionAt
  // morgen 9:00 niet door déze run van 10:00 wordt opgepakt.
  const overdueCutoff = new Date(now.getTime() - 12 * 60 * 60 * 1000);
  const overdueConfigurator = await db
    .select({
      id: leads.id,
      email: leads.email,
      name: leads.name,
    })
    .from(leads)
    .where(
      and(
        eq(leads.source, "configurator"),
        inArray(leads.status, ["cold", "warmed"]),
        isNull(leads.nurturedAt),
        lt(leads.nextActionAt, overdueCutoff),
      ),
    )
    .limit(MAX_PER_RUN);

  const configuratorSent: string[] = [];
  for (const lead of overdueConfigurator) {
    try {
      if (!lead.email || !lead.email.includes("@")) {
        skipped.push(`${lead.id}:no-email`);
        continue;
      }
      const locale = await localeForLead(lead.id);

      await sendConfiguratorWarmReminder({
        to: lead.email,
        name: lead.name,
        locale,
      });

      await db
        .update(leads)
        .set({ nurturedAt: new Date(), updatedAt: new Date() })
        .where(eq(leads.id, lead.id));

      await db.insert(leadActivity).values({
        leadId: lead.id,
        kind: "mail_sent",
        summary: "Configurator warm-reminder verstuurd (auto)",
        actorStaffId: null,
        metadata: { template: "configurator_warm_reminder", auto: true, locale },
      });

      configuratorSent.push(lead.id);
    } catch (err) {
      console.error(`[nurture-leads] configurator-overdue ${lead.id} failed:`, err);
      skipped.push(`${lead.id}:configurator-error`);
    }
  }

  return NextResponse.json({
    ok: true,
    sentCount: sent.length,
    configuratorSentCount: configuratorSent.length,
    skippedCount: skipped.length,
    sent,
    configuratorSent,
    skipped,
  });
}
