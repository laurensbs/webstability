"use server";

import { headers } from "next/headers";
import { db } from "@/lib/db";
import { leads, leadActivity } from "@/lib/db/schema";
import { rateLimit, clientIpFromHeaders } from "@/lib/rate-limit";

/**
 * Custom-service intake. Voor de vier maatwerk-verticals (verhuur,
 * klantportaal, reparatie, admin) waar een vaste-prijs richt-budget uit
 * een formulier niet werkt — een gesprek geeft hier sneller helderheid.
 *
 * Hergebruikt het leads + leadActivity patroon van de project-configurator
 * (`source: 'custom-intake'` zodat ze in de admin als aparte stroom
 * herkenbaar zijn). Geen prijsberekening, geen serverless-mail — alleen
 * persisten zodat de gesprek-flow vanuit de UI verder kan.
 */

export type CustomServiceKind = "verhuur" | "klantportaal" | "reparatie" | "admin";

const KINDS: CustomServiceKind[] = ["verhuur", "klantportaal", "reparatie", "admin"];

const KIND_LABEL: Record<CustomServiceKind, string> = {
  verhuur: "Verhuur boekingssysteem",
  klantportaal: "Klantportaal",
  reparatie: "Reparatie portaal",
  admin: "Admin systeem",
};

export type CustomIntakeResult =
  | { ok: true; leadId: string }
  | {
      ok: false;
      error:
        | "missing_fields"
        | "invalid_email"
        | "invalid_kind"
        | "rate_limited"
        | "spam"
        | "failed";
    };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_LIMIT_MAX = 1;
const EMAIL_LIMIT_WINDOW_MS = 60 * 1000;
const IP_LIMIT_MAX = 10;
const IP_LIMIT_WINDOW_MS = 60 * 60 * 1000;

export async function submitCustomIntake(formData: FormData): Promise<CustomIntakeResult> {
  // Honeypot — zelfde patroon als configurator
  const honeypot = String(formData.get("website_url") ?? "").trim();
  if (honeypot.length > 0) return { ok: false, error: "spam" };

  const kindInput = String(formData.get("kind") ?? "");
  if (!KINDS.includes(kindInput as CustomServiceKind)) {
    return { ok: false, error: "invalid_kind" };
  }
  const kind = kindInput as CustomServiceKind;

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const company = String(formData.get("company") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const localeInput = String(formData.get("locale") ?? "nl");
  const locale = localeInput === "es" ? "es" : "nl";

  if (!name || !email || !message) return { ok: false, error: "missing_fields" };
  if (!EMAIL_RE.test(email)) return { ok: false, error: "invalid_email" };

  // Rate limits — zelfde patroon als configurator
  const ip = clientIpFromHeaders(await headers());
  const emailGate = rateLimit({
    key: `cust:email:${email}`,
    max: EMAIL_LIMIT_MAX,
    windowMs: EMAIL_LIMIT_WINDOW_MS,
  });
  if (!emailGate.ok) return { ok: false, error: "rate_limited" };
  const ipGate = rateLimit({
    key: `cust:ip:${ip}`,
    max: IP_LIMIT_MAX,
    windowMs: IP_LIMIT_WINDOW_MS,
  });
  if (!ipGate.ok) return { ok: false, error: "rate_limited" };

  try {
    // Schrijft naar leads — zelfde tabel als de configurator zodat
    // de admin-cockpit één unified inbox heeft. Source "configurator"
    // hergebruiken (geen schema-migratie nodig); de specifieke kind
    // staat in leadActivity.metadata.
    const [lead] = await db
      .insert(leads)
      .values({
        email,
        name: name || null,
        company: company || null,
        source: "configurator",
      })
      .returning({ id: leads.id });

    await db.insert(leadActivity).values({
      leadId: lead.id,
      kind: "note_added",
      summary: `Custom-intake: ${KIND_LABEL[kind]} — ${message.slice(0, 80)}${message.length > 80 ? "…" : ""}`,
      metadata: {
        type: "custom_intake_submit",
        kind,
        kindLabel: KIND_LABEL[kind],
        locale,
        message,
      },
    });

    return { ok: true, leadId: lead.id };
  } catch {
    return { ok: false, error: "failed" };
  }
}
