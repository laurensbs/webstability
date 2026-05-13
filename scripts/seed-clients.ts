// One-off seed: voor twee bestaande website-klanten een portal-account +
// org klaarzetten, mét wachtwoord, zónder welkomstmail.
//
// Run: `SEED_CLIENT_PASSWORD=xxxxx pnpm db:seed-clients`
//
// Bewust géén default-wachtwoord in deze file — credentials horen niet in
// git-history. Geef 't wachtwoord mee als env-var bij de run; bcryptjs
// hasht 'm voor we 'm in users.passwordHash zetten.
//
// Idempotent: bestaande user of org wordt gevonden en alleen geüpdatet
// waar nodig (wachtwoord-hash + org-koppeling). Plan = null (legacy
// website-klanten zonder maandelijks Stripe-abonnement — kun je later
// in /admin promoveren). Land NL, locale nl, role owner.
//
// Geen mail: we schrijven direct passwordHash in DB en zetten
// emailVerified zodat de klant meteen kan inloggen met email + ww
// zonder magic-link-verify.

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, organizations } from "@/lib/db/schema";
import { hashPassword } from "@/lib/password";

type ClientSeed = {
  email: string;
  contactName: string;
  orgName: string;
  orgSlug: string;
};

const CLIENTS: ClientSeed[] = [
  {
    email: "info@lissers.nl",
    contactName: "Mark",
    orgName: "Lissers",
    orgSlug: "lissers",
  },
  {
    email: "contact@hoogduinonderhoud.nl",
    contactName: "Bram",
    orgName: "Hoogduin Onderhoud",
    orgSlug: "hoogduin-onderhoud",
  },
];

async function ensureOrg(seed: ClientSeed): Promise<string> {
  const existing = await db.query.organizations.findFirst({
    where: eq(organizations.slug, seed.orgSlug),
    columns: { id: true },
  });
  if (existing) {
    console.log(`  · org ${seed.orgSlug} bestaat al (${existing.id})`);
    return existing.id;
  }
  const [created] = await db
    .insert(organizations)
    .values({
      name: seed.orgName,
      slug: seed.orgSlug,
      country: "NL",
      // plan = null: legacy website-klant zonder Stripe-abo. Wisselen
      // kan later via /admin als je 'm op een onderhoudsplan zet.
      plan: null,
    })
    .returning({ id: organizations.id });
  console.log(`  + org ${seed.orgSlug} aangemaakt (${created.id})`);
  return created.id;
}

async function ensureUser(seed: ClientSeed, orgId: string, passwordHash: string): Promise<void> {
  const email = seed.email.toLowerCase();
  const existing = await db.query.users.findFirst({
    where: eq(users.email, email),
    columns: { id: true, organizationId: true, passwordHash: true },
  });

  if (existing) {
    const patch: Record<string, unknown> = {};
    if (!existing.passwordHash) patch.passwordHash = passwordHash;
    if (!existing.organizationId) {
      patch.organizationId = orgId;
      patch.role = "owner";
    }
    if (Object.keys(patch).length > 0) {
      await db.update(users).set(patch).where(eq(users.id, existing.id));
      console.log(`  ~ user ${email} bijgewerkt (${Object.keys(patch).join(", ")})`);
    } else {
      console.log(`  · user ${email} bestaat al, niets gewijzigd`);
    }
    return;
  }

  await db.insert(users).values({
    email,
    name: seed.contactName,
    // emailVerified zetten zodat password-login direct werkt (anders
    // kun je pas inloggen nadat Auth.js een magic-link heeft gezien).
    emailVerified: new Date(),
    locale: "nl",
    role: "owner",
    organizationId: orgId,
    passwordHash,
    isStaff: false,
    isDemo: false,
  });
  console.log(`  + user ${email} aangemaakt (${seed.contactName})`);
}

async function main() {
  const password = process.env.SEED_CLIENT_PASSWORD;
  if (!password || password.length < 8) {
    console.error(
      "ontbreekt: SEED_CLIENT_PASSWORD (>= 8 chars). Run: SEED_CLIENT_PASSWORD=xxx pnpm db:seed-clients",
    );
    process.exit(1);
  }
  const passwordHash = await hashPassword(password);
  console.log(`Seed wachtwoord-hash gebouwd (${password.length} chars). Start...\n`);

  for (const seed of CLIENTS) {
    console.log(`→ ${seed.orgName} (${seed.email})`);
    const orgId = await ensureOrg(seed);
    await ensureUser(seed, orgId, passwordHash);
    console.log("");
  }

  console.log("Klaar. Klanten kunnen inloggen op /login met hun email + 'admin1234'.");
}

main()
  .catch((err) => {
    console.error("seed failed:", err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
