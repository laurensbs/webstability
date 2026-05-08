"use server";

import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { users, sessions } from "@/lib/db/schema";

/**
 * Demo-login flow zonder magic-link. Maakt een Auth.js-compatible
 * sessie-row + cookie aan voor de seed-user `demo-portal@…` of
 * `demo-admin@…`. De DrizzleAdapter accepteert deze sessies tijdens
 * `auth()` calls omdat ze in dezelfde `sessions` tabel staan.
 *
 * Sliding TTL van 30 min — bij elke subsequent action wordt expires
 * niet expliciet bijgewerkt, maar bezoekers die actief klikken houden
 * de cookie levend doordat de cookie zelf elke 30 min een nieuwe
 * `expires` krijgt via een lichte refresh in de DemoBanner-component
 * (P3). MVP is goed genoeg.
 */

const PRODUCTION_HOST = "webstability.eu";

// In-memory rate-limit per IP. 10 demo-logins per uur. Reset bij
// server-restart, niet cross-region — voldoende voor MVP-volume.
type Bucket = { count: number; resetAt: number };
const rateLimit = new Map<string, Bucket>();
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const bucket = rateLimit.get(ip);
  if (!bucket || bucket.resetAt < now) {
    rateLimit.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (bucket.count >= RATE_LIMIT_MAX) return false;
  bucket.count += 1;
  return true;
}

async function getClientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "unknown";
}

/**
 * Detecteer of we op een productie-host zitten (webstability.eu of
 * admin.webstability.eu). Op apex/subdomain gebruiken we secure-cookie
 * + cross-subdomain domain. Lokaal niet — daar zou secure de cookie
 * stuksturen.
 */
function getCookieConfig() {
  const authUrl = process.env.AUTH_URL ?? "";
  const isProd = authUrl.includes(PRODUCTION_HOST);
  return {
    name: isProd ? "__Secure-authjs.session-token" : "authjs.session-token",
    secure: isProd,
    domain: isProd ? `.${PRODUCTION_HOST}` : undefined,
  };
}

const SESSION_TTL_MS = 30 * 60 * 1000;

async function setDemoSession(role: "portal" | "admin"): Promise<string> {
  const email = role === "portal" ? "demo-portal@webstability.eu" : "demo-admin@webstability.eu";
  const user = await db.query.users.findFirst({
    where: and(eq(users.email, email), eq(users.isDemo, true)),
    columns: { id: true },
  });
  if (!user) {
    console.error(
      `[demo] no isDemo user found for ${email} — run \`pnpm db:seed:demo\` op productie`,
    );
    redirect(`/demo/limited?reason=missing&role=${role}`);
  }

  const sessionToken = randomUUID();
  const expires = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(sessions).values({ sessionToken, userId: user.id, expires });

  const cfg = getCookieConfig();
  const jar = await cookies();
  jar.set(cfg.name, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: cfg.secure,
    domain: cfg.domain,
    expires,
  });

  console.info(
    `[demo] ${role} session set: token=${sessionToken.slice(0, 8)}…, cookie=${cfg.name}, domain=${cfg.domain ?? "<localhost>"}`,
  );
  return sessionToken;
}

export async function loginAsDemoPortal(): Promise<never> {
  const ip = await getClientIp();
  if (!checkRateLimit(ip)) redirect("/demo/limited?reason=rate-limit");
  await setDemoSession("portal");
  redirect("/portal/dashboard");
}

export async function loginAsDemoAdmin(): Promise<never> {
  const ip = await getClientIp();
  if (!checkRateLimit(ip)) redirect("/demo/limited?reason=rate-limit");
  await setDemoSession("admin");
  redirect("/admin");
}
