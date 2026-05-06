"use server";

import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { signIn } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function signInAction(email: string, name?: string) {
  // Admin host routes the post-login redirect to /admin instead of
  // the customer portal. The proxy then rewrites it transparently.
  const host = (await headers()).get("host") ?? "";
  const isAdminHost = host.toLowerCase().startsWith("admin.");
  const redirectTo = isAdminHost ? "/admin" : "/portal/dashboard";

  // Als de bezoeker een naam invulde, schrijf 'm vast op de user-row
  // (alleen als die er nog geen heeft of leeg is). Bij een nieuwe user
  // bestaat de row nog niet — auth.js maakt 'm pas aan na magic-link
  // klik. Voor zulke gevallen plakken we de naam pas na de eerste
  // login via een 'pending name'-flow, maar voor nu is overschrijven
  // bij bestaande users de eenvoudigste win.
  const trimmedName = name?.trim();
  if (trimmedName && email) {
    try {
      const existing = await db.query.users.findFirst({
        where: eq(users.email, email.toLowerCase()),
        columns: { id: true, name: true },
      });
      if (existing && !existing.name) {
        await db.update(users).set({ name: trimmedName }).where(eq(users.id, existing.id));
      }
    } catch {
      // DB is best-effort hier; faal niet de hele login op een
      // naam-update.
    }
  }

  try {
    await signIn("nodemailer", { email, redirectTo });
  } catch (err) {
    // Auth.js throws a redirect-like error on success; only surface real errors.
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
    return { error: true };
  }
}
