"use server";

import { cache } from "react";
import { eq, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, organizations, auditLog } from "@/lib/db/schema";
import { DemoReadonlyError } from "@/lib/demo-guard";
import { sendBulkMail, type BulkTemplateId } from "@/lib/email/bulk-templates";
import type { ActionResult } from "@/lib/action-result";

const fetchStaffUser = cache(async (sessionUserId: string) => {
  return db.query.users.findFirst({
    where: eq(users.id, sessionUserId),
    columns: { id: true, isStaff: true, isDemo: true },
  });
});

async function requireStaff() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("unauthorized");
  const user = await fetchStaffUser(session.user.id);
  if (!user?.isStaff) throw new Error("forbidden");
  if (user.isDemo) throw new DemoReadonlyError();
  return { userId: user.id };
}

const TEMPLATE_IDS: BulkTemplateId[] = ["short_update", "invoice_reminder", "quarterly_report"];

/**
 * Bulk-mail één template naar de owner-mailbox van iedere geselecteerde
 * org. Schrijft per ontvanger een audit-log met action="bulk_mail" en
 * metadata.template. Demo-staff krijgt readonly-error.
 */
export async function bulkMailOrgs(formData: FormData): Promise<ActionResult> {
  let userId: string;
  try {
    ({ userId } = await requireStaff());
  } catch (e) {
    if (e instanceof DemoReadonlyError) return { ok: true, messageKey: "demo_readonly" };
    return { ok: false, messageKey: "forbidden" };
  }

  const orgIds = formData.getAll("orgId").map((v) => String(v));
  const templateInput = String(formData.get("template") ?? "");
  const template = TEMPLATE_IDS.includes(templateInput as BulkTemplateId)
    ? (templateInput as BulkTemplateId)
    : null;
  if (!template) return { ok: false, messageKey: "invalid_template" };
  if (orgIds.length === 0) return { ok: false, messageKey: "no_orgs_selected" };

  // Haal owner-emails op (één per org). Owner = users met role=owner +
  // organizationId=X. Zonder owner → skip die org (geen mail, geen
  // audit-entry).
  const owners = await db
    .select({
      orgId: users.organizationId,
      userEmail: users.email,
      userName: users.name,
      orgName: organizations.name,
    })
    .from(users)
    .innerJoin(organizations, eq(organizations.id, users.organizationId))
    .where(inArray(organizations.id, orgIds));

  // Eén email per org — de eerste owner-rij die we tegenkomen.
  const seen = new Set<string>();
  const sent: Array<{ orgId: string; to: string }> = [];
  const skipped: string[] = [];

  for (const row of owners) {
    if (!row.orgId || seen.has(row.orgId)) continue;
    seen.add(row.orgId);
    try {
      await sendBulkMail({
        to: row.userEmail,
        recipientName: row.userName,
        template,
      });
      sent.push({ orgId: row.orgId, to: row.userEmail });
    } catch (err) {
      console.error(`[bulk_mail] send failed for ${row.userEmail}:`, err);
      skipped.push(row.orgId);
    }
  }

  // Audit-log per succesvolle ontvanger.
  if (sent.length > 0) {
    await db.insert(auditLog).values(
      sent.map((s) => ({
        organizationId: s.orgId,
        userId,
        action: "bulk_mail",
        targetType: "organization",
        targetId: s.orgId,
        metadata: { template, to: s.to },
      })),
    );
  }

  console.info(`[bulk_mail] template=${template} sent=${sent.length} skipped=${skipped.length}`);
  return { ok: true, messageKey: "bulk_mail_sent" };
}

/**
 * Forceer een demo-refresh-cron-run vanuit /admin. Hetzelfde
 * mechanisme als Vercel-cron, maar handmatig getriggerd. Auth: gewone
 * staff (niet demo) — anders is "forceer refresh" een trigger voor
 * demo-bezoekers, en dat botst met de read-only guard.
 */
export async function triggerDemoRefresh(): Promise<{ ok: boolean }> {
  try {
    await requireStaff();
  } catch {
    return { ok: false };
  }

  const base = process.env.AUTH_URL ?? "http://localhost:3000";
  const url = `${base.replace(/\/$/, "")}/api/cron/demo-refresh`;
  const headers: Record<string, string> = {};
  if (process.env.CRON_SECRET) {
    headers.authorization = `Bearer ${process.env.CRON_SECRET}`;
  }
  try {
    const res = await fetch(url, { headers, cache: "no-store" });
    return { ok: res.ok };
  } catch (err) {
    console.error("[demo-refresh] manual trigger failed:", err);
    return { ok: false };
  }
}
