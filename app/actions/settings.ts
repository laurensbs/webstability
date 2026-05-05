"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import type { ActionResult } from "@/lib/action-result";

export async function updateProfile(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, messageKey: "unauthorized" };

  const name = String(formData.get("name") ?? "").trim();
  const localeInput = String(formData.get("locale") ?? "");
  const locale = localeInput === "es" ? "es" : "nl";

  await db
    .update(users)
    .set({
      name: name || null,
      locale,
    })
    .where(eq(users.id, session.user.id));

  revalidatePath("/portal/settings");
  revalidatePath("/portal/dashboard");
  return { ok: true, messageKey: "saved" };
}
