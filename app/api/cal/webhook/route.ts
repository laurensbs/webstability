import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { bookings, users, leads, leadActivity, auditLog } from "@/lib/db/schema";

/**
 * Cal.com webhook endpoint. Cal stuurt JSON payloads voor
 * BOOKING_CREATED, BOOKING_CANCELLED, en BOOKING_RESCHEDULED events.
 *
 * Auth: HMAC-SHA256 signature in header `x-cal-signature-256` met
 * shared secret in env CAL_WEBHOOK_SECRET. Als de secret niet
 * geconfigureerd is, accepteren we alles (dev-mode).
 *
 * Routing:
 * - Attendee-email matcht een bestaande user → schrijf naar bookings
 *   tabel gekoppeld aan die org.
 * - Attendee-email matcht geen user → upsert in leads (status=booked,
 *   source=cal_booking) + activity-entry.
 */
export const dynamic = "force-dynamic";
export const maxDuration = 30;

type CalEvent = "BOOKING_CREATED" | "BOOKING_CANCELLED" | "BOOKING_RESCHEDULED";

type CalPayload = {
  triggerEvent?: CalEvent;
  payload?: {
    uid?: string;
    title?: string;
    startTime?: string;
    endTime?: string;
    location?: string;
    additionalNotes?: string;
    attendees?: Array<{ email?: string; name?: string }>;
    rescheduleUid?: string;
  };
};

function verifySignature(secret: string, rawBody: string, signature: string): boolean {
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const provided = signature.replace(/^sha256=/, "");
  if (expected.length !== provided.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(provided, "hex"));
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const secret = process.env.CAL_WEBHOOK_SECRET;
  if (secret) {
    const sig = req.headers.get("x-cal-signature-256") ?? "";
    if (!sig || !verifySignature(secret, rawBody, sig)) {
      return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
    }
  }

  let parsed: CalPayload;
  try {
    parsed = JSON.parse(rawBody) as CalPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const event = parsed.triggerEvent;
  const p = parsed.payload ?? {};
  const uid = p.uid;
  if (!event || !uid) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }

  const attendee = p.attendees?.[0];
  const attendeeEmail = (attendee?.email ?? "").trim().toLowerCase() || null;
  const attendeeName = attendee?.name?.trim() || null;
  const startsAt = p.startTime ? new Date(p.startTime) : null;
  const endsAt = p.endTime ? new Date(p.endTime) : null;
  const meetingUrl =
    typeof p.location === "string" && /^https?:\/\//.test(p.location) ? p.location : null;

  // 1. Bestaande user/org match → bookings-tabel
  if (attendeeEmail) {
    const user = await db.query.users.findFirst({
      where: eq(users.email, attendeeEmail),
      columns: { organizationId: true },
    });
    if (user?.organizationId) {
      if (event === "BOOKING_CREATED") {
        if (!startsAt) {
          return NextResponse.json({ error: "missing_start_time" }, { status: 400 });
        }
        await db.insert(bookings).values({
          organizationId: user.organizationId,
          type: "review_call",
          calMeetingId: uid,
          startsAt,
          endsAt,
          status: "scheduled",
          attendeeEmail,
          attendeeName,
          meetingUrl,
          notes: p.additionalNotes ?? null,
        });
      } else if (event === "BOOKING_CANCELLED") {
        await db
          .update(bookings)
          .set({ status: "cancelled" })
          .where(eq(bookings.calMeetingId, uid));
      } else if (event === "BOOKING_RESCHEDULED" && startsAt) {
        await db
          .update(bookings)
          .set({ startsAt, endsAt, status: "rescheduled" })
          .where(eq(bookings.calMeetingId, uid));
      }

      await db.insert(auditLog).values({
        organizationId: user.organizationId,
        userId: null,
        action: `cal.${event.toLowerCase()}`,
        targetType: "booking",
        targetId: uid,
        metadata: { startsAt: startsAt?.toISOString() ?? null, attendeeEmail },
      });
      return NextResponse.json({ ok: true, routed: "booking" });
    }
  }

  // 2. Geen bestaande user → leads (alleen voor email-bekende attendees)
  if (!attendeeEmail) {
    return NextResponse.json({ ok: true, routed: "skipped_no_email" });
  }

  const existingLead = await db.query.leads.findFirst({
    where: eq(leads.email, attendeeEmail),
    columns: { id: true, status: true },
  });

  if (event === "BOOKING_CREATED") {
    if (existingLead) {
      // Promote naar 'booked' als status nog cold/warmed was.
      const promote = ["cold", "warmed"].includes(existingLead.status);
      await db
        .update(leads)
        .set({
          status: promote ? "booked" : existingLead.status,
          updatedAt: new Date(),
        })
        .where(eq(leads.id, existingLead.id));
      await db.insert(leadActivity).values({
        leadId: existingLead.id,
        kind: "call_booked",
        summary: `Cal-call gepland voor ${startsAt?.toISOString().slice(0, 16) ?? "?"}`,
        metadata: { uid, startsAt: startsAt?.toISOString(), meetingUrl },
      });
    } else {
      const [created] = await db
        .insert(leads)
        .values({
          email: attendeeEmail,
          name: attendeeName,
          source: "cal_booking",
          status: "booked",
          nextActionAt: startsAt,
          nextActionLabel: "Bereid de call voor",
        })
        .returning({ id: leads.id });
      if (created) {
        await db.insert(leadActivity).values({
          leadId: created.id,
          kind: "call_booked",
          summary: `Cal-call gepland (nieuwe lead)`,
          metadata: { uid, startsAt: startsAt?.toISOString(), meetingUrl },
        });
      }
    }
  } else if (event === "BOOKING_CANCELLED" && existingLead) {
    await db.insert(leadActivity).values({
      leadId: existingLead.id,
      kind: "call_booked",
      summary: "Cal-call geannuleerd",
      metadata: { uid },
    });
  } else if (event === "BOOKING_RESCHEDULED" && existingLead) {
    await db.insert(leadActivity).values({
      leadId: existingLead.id,
      kind: "call_booked",
      summary: `Cal-call verzet naar ${startsAt?.toISOString().slice(0, 16) ?? "?"}`,
      metadata: { uid, startsAt: startsAt?.toISOString() },
    });
  }

  return NextResponse.json({ ok: true, routed: "lead" });
}
