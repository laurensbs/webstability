"use server";

import { cookies, headers } from "next/headers";
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { signIn } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, sessions } from "@/lib/db/schema";
import {
  hashPassword,
  verifyPassword,
  isValidPassword,
  newSetupToken,
  SETUP_TOKEN_TTL_MS,
} from "@/lib/password";
import { sendSetPasswordMail } from "@/lib/email/set-password";

/**
 * Lichte lookup voor de 3-state login-copy. Returnt of een email al een
 * user-row heeft, zodat we kunnen kiezen tussen "Welkom terug" en "We
 * maken je account aan". Geen sessie-mutaties, geen rate-limit-impact —
 * alleen een SELECT met index-hit op email. Geen onderscheid tussen
 * "exists, error fetching" en "doesn't exist": bij twijfel false zodat
 * de UI altijd graceful blijft.
 */
export async function checkUserExists(email: string): Promise<{ exists: boolean }> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !trimmed.includes("@")) return { exists: false };
  try {
    const row = await db.query.users.findFirst({
      where: eq(users.email, trimmed),
      columns: { id: true },
    });
    return { exists: Boolean(row) };
  } catch {
    return { exists: false };
  }
}

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

// ===========================================================================
// Wachtwoord-auth — naast magic-link. Auth.js' Credentials-provider werkt niet
// met `session: { strategy: "database" }`, dus maken we hier zelf een sessie-
// rij en zetten de session-cookie (exact wat de DrizzleAdapter ook doet).
// ===========================================================================

// Cookie-naam + scope spiegelen lib/auth.ts: prod = __Secure-cookie op
// .webstability.eu, lokaal de default authjs-cookie op localhost.
const IS_PROD_DOMAIN = Boolean(
  process.env.AUTH_URL && process.env.AUTH_URL.includes("webstability.eu"),
);
const SESSION_COOKIE_NAME = IS_PROD_DOMAIN
  ? "__Secure-authjs.session-token"
  : "authjs.session-token";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 dagen — Auth.js default

type AuthResult = { ok: true } | { ok: false; error: string };

/** Inloggen met e-mail + wachtwoord. Magic-link blijft daarnaast werken. */
export async function loginWithPassword(
  _prev: AuthResult | null,
  formData: FormData,
): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { ok: false, error: "missing_fields" };

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
    columns: { id: true, passwordHash: true },
  });
  // Geen user óf geen wachtwoord ingesteld → zelfde fout (geen enumeratie).
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { ok: false, error: "invalid_credentials" };
  }

  const sessionToken = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(sessions).values({ sessionToken, userId: user.id, expires });
  await db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id));

  const jar = await cookies();
  jar.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: IS_PROD_DOMAIN,
    domain: IS_PROD_DOMAIN ? ".webstability.eu" : undefined,
    expires,
  });

  // Auto-promote tot staff bij een open invite — zelfde als de magic-link-flow.
  try {
    const { promoteUserIfInvited } = await import("@/app/actions/admin");
    await promoteUserIfInvited(email);
  } catch {
    // niet fataal
  }
  return { ok: true };
}

/**
 * "Wachtwoord vergeten / instellen": als het e-mail bij een user hoort,
 * genereer een token en mail een knop. Geeft altijd `{ ok: true }` —
 * geen account-enumeratie.
 */
export async function requestPasswordReset(
  _prev: AuthResult | null,
  formData: FormData,
): Promise<AuthResult> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email) return { ok: false, error: "missing_fields" };

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
    columns: { id: true, name: true, locale: true, passwordHash: true },
  });
  if (user) {
    const token = newSetupToken();
    await db
      .update(users)
      .set({
        passwordSetupToken: token,
        passwordSetupExpires: new Date(Date.now() + SETUP_TOKEN_TTL_MS),
      })
      .where(eq(users.id, user.id));
    try {
      const host = (await headers()).get("host") ?? "";
      const baseUrl = process.env.AUTH_URL ?? "https://webstability.eu";
      const locale: "nl" | "es" = user.locale === "es" ? "es" : "nl";
      const url = `${baseUrl}/${locale}/set-password?token=${encodeURIComponent(token)}`;
      await sendSetPasswordMail({
        to: email,
        name: user.name ?? null,
        url,
        locale,
        adminHost: host.toLowerCase().startsWith("admin."),
        isReset: Boolean(user.passwordHash),
      });
    } catch (err) {
      console.error("[auth] set-password mail failed:", err);
    }
  }
  return { ok: true };
}

/** Wachtwoord instellen via een token uit de mail. */
export async function setPasswordWithToken(
  _prev: AuthResult | null,
  formData: FormData,
): Promise<AuthResult> {
  const token = String(formData.get("token") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!token) return { ok: false, error: "invalid_token" };
  if (!isValidPassword(password)) return { ok: false, error: "weak_password" };

  const user = await db.query.users.findFirst({
    where: eq(users.passwordSetupToken, token),
    columns: { id: true, passwordSetupExpires: true },
  });
  if (!user || !user.passwordSetupExpires || user.passwordSetupExpires.getTime() < Date.now()) {
    return { ok: false, error: "invalid_token" };
  }

  const hash = await hashPassword(password);
  await db
    .update(users)
    .set({
      passwordHash: hash,
      passwordSetupToken: null,
      passwordSetupExpires: null,
      emailVerified: new Date(),
    })
    .where(eq(users.id, user.id));
  return { ok: true };
}

/**
 * Maak (indien nodig) een user voor dit e-mail en mail een "stel je wachtwoord
 * in"-link. Aangeroepen vanuit de checkout/pakket-flow zodat een klant na
 * betaling een echt account heeft. Faalt niet hard.
 */
export async function provisionAccountForCheckout(input: {
  email: string;
  name?: string | null;
  organizationId?: string | null;
  locale?: "nl" | "es";
}): Promise<{ userId: string; created: boolean }> {
  const email = input.email.trim().toLowerCase();
  const locale: "nl" | "es" = input.locale === "es" ? "es" : "nl";

  let user = await db.query.users.findFirst({
    where: eq(users.email, email),
    columns: { id: true, organizationId: true, name: true },
  });
  let created = false;
  const token = newSetupToken();
  const expires = new Date(Date.now() + SETUP_TOKEN_TTL_MS);

  if (!user) {
    const [row] = await db
      .insert(users)
      .values({
        email,
        name: input.name ?? null,
        locale,
        organizationId: input.organizationId ?? null,
        passwordSetupToken: token,
        passwordSetupExpires: expires,
      })
      .returning({ id: users.id });
    user = { id: row.id, organizationId: input.organizationId ?? null, name: input.name ?? null };
    created = true;
  } else {
    await db
      .update(users)
      .set({
        passwordSetupToken: token,
        passwordSetupExpires: expires,
        ...(input.organizationId && !user.organizationId
          ? { organizationId: input.organizationId }
          : {}),
      })
      .where(eq(users.id, user.id));
  }

  try {
    const baseUrl = process.env.AUTH_URL ?? "https://webstability.eu";
    const url = `${baseUrl}/${locale}/set-password?token=${encodeURIComponent(token)}`;
    await sendSetPasswordMail({
      to: email,
      name: user.name ?? input.name ?? null,
      url,
      locale,
      adminHost: false,
      isReset: false,
      fromCheckout: true,
    });
  } catch (err) {
    console.error("[auth] checkout set-password mail failed:", err);
  }
  return { userId: user.id, created };
}
