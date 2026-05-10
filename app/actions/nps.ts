"use server";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { npsResponses, auditLog } from "@/lib/db/schema";
import type { ActionResult } from "@/lib/action-result";

/**
 * Submit een NPS-antwoord op basis van een token. Eén-shot: een token
 * waarvan respondedAt al gezet is, kan niet opnieuw worden ingestuurd.
 * Geen session-check — de token is de auth. Brute-force is niet
 * realistisch (24-byte random + UNIQUE-constraint).
 */
export async function submitNpsResponse(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const token = String(formData.get("token") ?? "").trim();
  const scoreRaw = Number(formData.get("score") ?? -1);
  const comment = String(formData.get("comment") ?? "").trim();

  if (!token) return { ok: false, messageKey: "missing_fields" };
  if (!Number.isFinite(scoreRaw) || scoreRaw < 0 || scoreRaw > 10) {
    return { ok: false, messageKey: "missing_fields" };
  }
  if (comment.length > 1000) return { ok: false, messageKey: "too_long" };

  const row = await db.query.npsResponses.findFirst({
    where: eq(npsResponses.token, token),
    columns: {
      id: true,
      organizationId: true,
      projectId: true,
      askedAfterDays: true,
      respondedAt: true,
    },
  });
  if (!row) return { ok: false, messageKey: "not_found" };
  if (row.respondedAt) return { ok: true, messageKey: "saved" };

  await db
    .update(npsResponses)
    .set({
      score: Math.round(scoreRaw),
      comment: comment.length > 0 ? comment : null,
      respondedAt: new Date(),
    })
    .where(eq(npsResponses.id, row.id));

  await db.insert(auditLog).values({
    organizationId: row.organizationId,
    userId: null,
    action: "nps_responded",
    targetType: "project",
    targetId: row.projectId,
    metadata: {
      score: Math.round(scoreRaw),
      askedAfterDays: row.askedAfterDays,
      commentLength: comment.length,
    },
  });

  return { ok: true, messageKey: "saved" };
}
