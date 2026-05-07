import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { demoEvents } from "@/lib/db/schema";

const ALLOWED_KINDS = new Set([
  "entered",
  "tour_completed",
  "tour_dismissed",
  "cta_clicked",
  "session_ended",
]);

/**
 * Lichtgewicht analytics-endpoint voor de demo-funnel. Fire-and-forget
 * vanuit DemoAnalyticsBeacon (client-component) of vanuit modal/banner
 * onClick handlers. Geen auth — POST is publiek toegankelijk; spam zou
 * op zijn ergst de funnel-counts opblazen.
 *
 * Privacy: IPs worden niet als plain-text bewaard, alleen als SHA-256
 * hash van IP + datum. Genoeg voor "uniek bezoek per dag" maar niet
 * voor user-identificatie.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { kind, source, role } = (body ?? {}) as {
    kind?: string;
    source?: string;
    role?: string;
  };

  if (!kind || !ALLOWED_KINDS.has(kind)) {
    return NextResponse.json({ error: "invalid_kind" }, { status: 400 });
  }

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "unknown";
  const userAgent = h.get("user-agent")?.slice(0, 200) ?? null;
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const ipHash = createHash("sha256").update(`${ip}-${today}`).digest("hex").slice(0, 32);

  await db.insert(demoEvents).values({
    kind: kind as "entered" | "tour_completed" | "tour_dismissed" | "cta_clicked" | "session_ended",
    source: typeof source === "string" ? source.slice(0, 50) : null,
    role: typeof role === "string" ? role.slice(0, 20) : null,
    userAgent,
    ipHash,
  });

  return NextResponse.json({ ok: true });
}
