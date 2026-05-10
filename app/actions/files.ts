"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { put, del } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { files, users, auditLog, projects } from "@/lib/db/schema";
import type { ActionResult } from "@/lib/action-result";

const FILE_CATEGORIES = [
  "contract",
  "asset",
  "deliverable",
  "report",
  "brand_kit",
  "copy",
  "screenshot",
  "wireframe",
  "final_handover",
] as const;
type FileCategory = (typeof FILE_CATEGORIES)[number];

async function requireUserOrg() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("unauthorized");
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { id: true, organizationId: true, role: true },
  });
  if (!user?.organizationId) throw new Error("no_org");
  return { userId: user.id, orgId: user.organizationId, role: user.role };
}

export async function uploadFile(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { ok: false, messageKey: "blob_not_configured" };
  }

  let userId: string;
  let orgId: string;
  try {
    const u = await requireUserOrg();
    userId = u.userId;
    orgId = u.orgId;
  } catch (err) {
    const m = err instanceof Error ? err.message : "unauthorized";
    return { ok: false, messageKey: m };
  }

  const file = formData.get("file") as File | null;
  const categoryInput = String(formData.get("category") ?? "deliverable");
  const category: FileCategory = FILE_CATEGORIES.includes(categoryInput as FileCategory)
    ? (categoryInput as FileCategory)
    : "deliverable";
  const projectIdRaw = String(formData.get("projectId") ?? "").trim();
  const replacesFileId = String(formData.get("replacesFileId") ?? "").trim();
  if (!file || file.size === 0) return { ok: false, messageKey: "missing_file" };

  // Voor versionering: als replacesFileId is meegegeven, lookup oudste
  // versie + bump version-nummer. Klant kan alleen z'n eigen org-files
  // vervangen — anders skip versionering.
  let version = 1;
  let replacesId: string | null = null;
  if (replacesFileId) {
    const previous = await db.query.files.findFirst({
      where: and(eq(files.id, replacesFileId), eq(files.organizationId, orgId)),
      columns: { id: true, version: true, projectId: true },
    });
    if (previous) {
      version = previous.version + 1;
      replacesId = previous.id;
    }
  }

  const blobPath = `org/${orgId}/${Date.now()}-${file.name}`;
  const blob = await put(blobPath, file, { access: "public" });

  const [created] = await db
    .insert(files)
    .values({
      organizationId: orgId,
      projectId: projectIdRaw || null,
      name: file.name,
      url: blob.url,
      blobPath: blob.pathname,
      category,
      uploadedBy: userId,
      version,
      replacesFileId: replacesId,
    })
    .returning({ id: files.id });

  await db.insert(auditLog).values({
    organizationId: orgId,
    userId,
    action: "file.uploaded",
    targetType: "file",
    targetId: created?.id ?? null,
    metadata: { name: file.name, category, version, replacesId },
  });

  revalidatePath("/portal/files");
  revalidatePath("/portal/dashboard");
  if (projectIdRaw) revalidatePath(`/portal/projects/${projectIdRaw}`);
  return { ok: true, messageKey: "uploaded" };
}

export async function deleteFile(fileId: string) {
  const { orgId } = await requireUserOrg();

  const file = await db.query.files.findFirst({
    where: and(eq(files.id, fileId), eq(files.organizationId, orgId)),
  });
  if (!file) throw new Error("not_found");

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      await del(file.blobPath);
    } catch {
      // Blob may already be gone; carry on with DB delete.
    }
  }
  await db.delete(files).where(eq(files.id, fileId));
  revalidatePath("/portal/files");
}

/**
 * Klant geeft akkoord op een deliverable. Schrijft approvedAt +
 * approvedBy en logt audit-log entry. Stuurt staff-notify mail
 * (gracefuul). Idempotent — als al goedgekeurd, no-op.
 */
export async function approveDeliverable(fileId: string): Promise<ActionResult> {
  let userId: string;
  let orgId: string;
  try {
    const u = await requireUserOrg();
    userId = u.userId;
    orgId = u.orgId;
  } catch (err) {
    return { ok: false, messageKey: err instanceof Error ? err.message : "unauthorized" };
  }

  const file = await db.query.files.findFirst({
    where: and(eq(files.id, fileId), eq(files.organizationId, orgId)),
    columns: { id: true, name: true, projectId: true, approvedAt: true },
  });
  if (!file) return { ok: false, messageKey: "not_found" };
  if (file.approvedAt) {
    return { ok: true, messageKey: "already_approved" };
  }

  const now = new Date();
  await db
    .update(files)
    .set({ approvedAt: now, approvedBy: userId, revisionNote: null, revisionRequestedAt: null })
    .where(eq(files.id, fileId));

  await db.insert(auditLog).values({
    organizationId: orgId,
    userId,
    action: "file.approved",
    targetType: "file",
    targetId: fileId,
    metadata: { name: file.name, projectId: file.projectId },
  });

  // Staff-notify: gebruik bulk-templates niet, maar log + console
  // (echte mail-template kan later — voor nu is portal-strip + mail
  // optioneel; faalt graceful).
  try {
    if (process.env.STAFF_NOTIFY_EMAIL || process.env.MAIL_AUDIT_BCC) {
      const { sendDeliverableApprovedNotify } =
        await import("@/lib/email/deliverable-approved-notify");
      const projectName = file.projectId
        ? ((
            await db.query.projects.findFirst({
              where: eq(projects.id, file.projectId),
              columns: { name: true },
            })
          )?.name ?? null)
        : null;
      const userRow = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { name: true, email: true },
      });
      await sendDeliverableApprovedNotify({
        fileName: file.name,
        projectName,
        approvedBy: userRow?.name ?? userRow?.email ?? "klant",
        orgId,
      });
    }
  } catch (err) {
    console.error("[files] approve staff-notify failed:", err);
  }

  revalidatePath("/portal/files");
  revalidatePath("/portal/dashboard");
  if (file.projectId) revalidatePath(`/portal/projects/${file.projectId}`);
  return { ok: true, messageKey: "approved" };
}

/**
 * Klant vraagt revisie aan met een korte note. Geen formele
 * blokkering van de file; staff ziet de note in admin-panel en kan
 * een nieuwe versie uploaden via uploadFile met replacesFileId.
 */
export async function requestRevision(formData: FormData): Promise<ActionResult> {
  let userId: string;
  let orgId: string;
  try {
    const u = await requireUserOrg();
    userId = u.userId;
    orgId = u.orgId;
  } catch (err) {
    return { ok: false, messageKey: err instanceof Error ? err.message : "unauthorized" };
  }

  const fileId = String(formData.get("fileId") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  if (!fileId) return { ok: false, messageKey: "missing_fields" };
  if (note.length > 1000) return { ok: false, messageKey: "too_long" };

  const file = await db.query.files.findFirst({
    where: and(eq(files.id, fileId), eq(files.organizationId, orgId)),
    columns: { id: true, name: true, projectId: true },
  });
  if (!file) return { ok: false, messageKey: "not_found" };

  await db
    .update(files)
    .set({
      revisionNote: note || "Klant vraagt om revisie zonder verdere toelichting.",
      revisionRequestedAt: new Date(),
      // Als de klant later toch akkoord wil geven kan dat alsnog —
      // approvedAt blijft null tot expliciet goedgekeurd.
    })
    .where(eq(files.id, fileId));

  await db.insert(auditLog).values({
    organizationId: orgId,
    userId,
    action: "file.revision_requested",
    targetType: "file",
    targetId: fileId,
    metadata: { name: file.name, projectId: file.projectId, noteLength: note.length },
  });

  revalidatePath("/portal/files");
  revalidatePath("/portal/dashboard");
  if (file.projectId) revalidatePath(`/portal/projects/${file.projectId}`);
  return { ok: true, messageKey: "revision_requested" };
}
