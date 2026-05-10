import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { demoEvents, leads, leadActivity } from "@/lib/db/schema";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Submit-endpoint voor de "Wil je dat ik je volg?"-modal na cta_clicked.
 * Logt een demo_event met email, maakt (idempotent) een lead aan met
 * status=warmed + source=demo_self_serve, en geeft 200 terug zodat
 * de modal kan sluiten met een korte bedank-state.
 *
 * Publiek bereikbaar zoals het demo-event endpoint — spam zou op zijn
 * ergst de leads-lijst opblazen, geen security-risico.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const {
    email: rawEmail,
    role,
    source,
  } = (body ?? {}) as {
    email?: string;
    role?: string;
    source?: string;
  };
  const email = (rawEmail ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "invalid_email" }, { status: 400 });
  }

  // 1. demo_event met email (één rij, niet upsert — de funnel-counts
  //    waarderen rauwe events).
  await db.insert(demoEvents).values({
    kind: "cta_clicked",
    source: typeof source === "string" ? source.slice(0, 50) : "modal_follow_up",
    role: typeof role === "string" ? role.slice(0, 20) : null,
    email,
  });

  // 2. lead — alleen aanmaken als die er nog niet is voor deze email.
  const existing = await db.query.leads.findFirst({
    where: eq(leads.email, email),
    columns: { id: true },
  });
  if (!existing) {
    const [created] = await db
      .insert(leads)
      .values({
        email,
        source: "demo_self_serve",
        status: "warmed",
        notes: `Bekeek demo (${typeof role === "string" ? role : "?"}) en liet email achter.`,
      })
      .returning({ id: leads.id });
    if (created) {
      await db.insert(leadActivity).values({
        leadId: created.id,
        kind: "demo_visit",
        summary: "Liet email achter na demo-CTA",
        metadata: { role, source },
      });
    }
  } else {
    await db.insert(leadActivity).values({
      leadId: existing.id,
      kind: "demo_visit",
      summary: "Nieuw demo-bezoek met bekende email",
      metadata: { role, source },
    });
  }

  return NextResponse.json({ ok: true });
}
