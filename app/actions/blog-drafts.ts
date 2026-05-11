"use server";

import { cache } from "react";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, blogDrafts } from "@/lib/db/schema";
import { DemoReadonlyError } from "@/lib/demo-guard";

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

/**
 * Triggert de blog-conceptgenerator-cron handmatig (zelfde werk als de
 * wekelijkse run: oudste pending → Anthropic API → opslaan → mail). Doet
 * de fetch naar de eigen cron-route met het CRON_SECRET, net als
 * triggerDemoRefresh. Eén concept per call.
 */
export async function triggerBlogDraftGeneration(): Promise<{
  ok: boolean;
  generated?: string | null;
  reason?: string;
}> {
  try {
    await requireStaff();
  } catch {
    return { ok: false, reason: "forbidden" };
  }

  const base = process.env.AUTH_URL ?? "http://localhost:3000";
  const url = `${base.replace(/\/$/, "")}/api/cron/blog-draft`;
  const headers: Record<string, string> = {};
  if (process.env.CRON_SECRET) headers.authorization = `Bearer ${process.env.CRON_SECRET}`;

  try {
    const res = await fetch(url, { headers, cache: "no-store" });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      generated?: string | null;
      reason?: string;
    };
    revalidatePath("/admin/blog");
    return { ok: res.ok && data.ok !== false, generated: data.generated, reason: data.reason };
  } catch (err) {
    console.error("[blog-draft] manual trigger failed:", err);
    return { ok: false, reason: "fetch-failed" };
  }
}

/** Markeer een gegenereerd concept als gepubliceerd (handmatig in de repo gezet). */
export async function markBlogDraftPublished(id: string): Promise<{ ok: boolean }> {
  try {
    await requireStaff();
  } catch {
    return { ok: false };
  }
  await db.update(blogDrafts).set({ status: "published" }).where(eq(blogDrafts.id, id));
  revalidatePath("/admin/blog");
  return { ok: true };
}

/** Markeer een concept als afgekeurd / niet gebruikt. */
export async function markBlogDraftSkipped(id: string): Promise<{ ok: boolean }> {
  try {
    await requireStaff();
  } catch {
    return { ok: false };
  }
  await db.update(blogDrafts).set({ status: "skipped" }).where(eq(blogDrafts.id, id));
  revalidatePath("/admin/blog");
  return { ok: true };
}

/** Zet een afgekeurd / mislukt concept terug op 'pending' zodat de volgende run het oppakt. */
export async function retryBlogDraft(id: string): Promise<{ ok: boolean }> {
  try {
    await requireStaff();
  } catch {
    return { ok: false };
  }
  await db
    .update(blogDrafts)
    .set({ status: "pending", error: null, bodyMdx: null, model: null, generatedAt: null })
    .where(eq(blogDrafts.id, id));
  revalidatePath("/admin/blog");
  return { ok: true };
}
