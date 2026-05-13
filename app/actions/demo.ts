"use server";

import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { users, sessions, organizations } from "@/lib/db/schema";
import { rateLimit, clientIpFromHeaders } from "@/lib/rate-limit";

/**
 * Demo-login flow zonder magic-link. Gebruikt of de bestaande seed-users
 * (`demo-portal@…` / `demo-admin@…`), of maakt ze on-the-fly aan als ze
 * nog niet bestaan in deze omgeving — voorheen redirect'te dat naar
 * /demo/limited wat verwarrend was. Idempotent: 2e bezoek vindt 'em
 * gewoon terug.
 *
 * Sessie via een Auth.js-compatible row in de `sessions` tabel + cookie
 * met dezelfde naam die Auth.js zelf zou zetten. De DrizzleAdapter
 * accepteert deze sessies tijdens `auth()` calls.
 */

const PRODUCTION_HOST = "webstability.eu";

const PORTAL_EMAIL = "demo-portal@webstability.eu";
const ADMIN_EMAIL = "demo-admin@webstability.eu";
const PORTAL_ORG_SLUG = "demo-portal-org";

// Rate-limit: 10 demo-logins per uur per IP. Shared util — caveat
// (in-memory, per node-instance) gedocumenteerd in lib/rate-limit.ts.
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  return rateLimit({ key: `demo:ip:${ip}`, max: RATE_LIMIT_MAX, windowMs: RATE_LIMIT_WINDOW_MS })
    .ok;
}

async function getClientIp(): Promise<string> {
  return clientIpFromHeaders(await headers());
}

/**
 * Detecteer of we op een productie-host zitten. Op apex/subdomain
 * gebruiken we secure-cookie + cross-subdomain domain. Lokaal niet
 * — daar zou secure de cookie stuksturen.
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

/**
 * Vind óf maak een demo-org. Idempotent op slug.
 */
async function ensureDemoOrg(): Promise<string> {
  const existing = await db.query.organizations.findFirst({
    where: eq(organizations.slug, PORTAL_ORG_SLUG),
    columns: { id: true },
  });
  if (existing) return existing.id;

  const [created] = await db
    .insert(organizations)
    .values({
      name: "Demo Bedrijf",
      slug: PORTAL_ORG_SLUG,
      country: "NL",
      plan: "studio",
      isDemo: true,
    })
    .returning({ id: organizations.id });
  return created.id;
}

/**
 * Vind óf maak de demo-user. Portal-user krijgt een org gekoppeld;
 * admin-user is staff zonder org.
 */
async function ensureDemoUser(role: "portal" | "admin"): Promise<{ id: string }> {
  const email = role === "portal" ? PORTAL_EMAIL : ADMIN_EMAIL;
  const existing = await db.query.users.findFirst({
    where: and(eq(users.email, email), eq(users.isDemo, true)),
    columns: { id: true },
  });
  if (existing) return existing;

  const orgId = role === "portal" ? await ensureDemoOrg() : null;
  const [created] = await db
    .insert(users)
    .values({
      email,
      name: role === "portal" ? "Demo Klant" : "Demo Studio",
      emailVerified: new Date(),
      locale: "nl",
      role: "owner",
      organizationId: orgId,
      isStaff: role === "admin",
      isDemo: true,
      lastLoginAt: new Date(),
    })
    .returning({ id: users.id });
  console.info(`[demo] auto-created ${role} user (${email}) → ${created.id}`);
  return created;
}

async function setDemoSession(role: "portal" | "admin"): Promise<string> {
  const user = await ensureDemoUser(role);

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
  // Portal blijft op apex (geen subdomain rewrite door proxy nodig).
  redirect("/portal/dashboard");
}

export async function loginAsDemoAdmin(): Promise<never> {
  const ip = await getClientIp();
  if (!checkRateLimit(ip)) redirect("/demo/limited?reason=rate-limit");
  await setDemoSession("admin");
  // Admin op productie zit op een ander subdomain. Cookie is al gezet
  // met domain: .webstability.eu zodat 'ie cross-subdomain meegestuurd
  // wordt. Direct naar admin-host redirect'en voorkomt dat de proxy
  // een 308-redirect tussenvoegt waarbij sommige browsers / iOS Safari
  // de Set-Cookie header soms negeren tijdens redirect-chains.
  const authUrl = process.env.AUTH_URL ?? "";
  const isProd = authUrl.includes(PRODUCTION_HOST);
  if (isProd) {
    redirect("https://admin.webstability.eu/admin");
  }
  redirect("/admin");
}
