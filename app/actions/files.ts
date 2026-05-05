"use server";

import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { put, del } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { files, users } from "@/lib/db/schema";
import type { ActionResult } from "@/lib/action-result";

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
  const category = String(formData.get("category") ?? "deliverable") as
    | "contract"
    | "asset"
    | "deliverable"
    | "report";
  if (!file || file.size === 0) return { ok: false, messageKey: "missing_file" };

  const blobPath = `org/${orgId}/${Date.now()}-${file.name}`;
  const blob = await put(blobPath, file, { access: "public" });

  await db.insert(files).values({
    organizationId: orgId,
    name: file.name,
    url: blob.url,
    blobPath: blob.pathname,
    category,
    uploadedBy: userId,
  });

  revalidatePath("/portal/files");
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
