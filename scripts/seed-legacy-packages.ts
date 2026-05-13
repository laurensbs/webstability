// One-off: legacy-pakket-config zetten op bestaande klanten. Geen mail,
// geen Stripe — directe DB-write. Idempotent (kan veilig opnieuw).
//
// Lissers — "Web Starter" €30,25/mnd incl btw (€25,00 excl). Oude klant
// van vóór Webstability, gereduceerd onderhoudstarief. Krijgt in 't
// portaal alleen passieve infra: hosting + backups + security-updates +
// uptime-monitoring. Geen wijzigings-tickets, geen uren-budget, geen
// maand-/week-rapport.
//
// Hoogduin Onderhoud — geen onderhouds-pakket; site-build-klant zonder
// abo. Krijgt alleen portaal-toegang (referentie + tickets bij
// problemen). websiteUrl mag jij later via /admin invullen.
//
// Run: pnpm tsx --env-file=.env.local scripts/seed-legacy-packages.ts

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { organizations } from "@/lib/db/schema";

async function main() {
  // ---- Lissers — Web Starter, €30,25 incl btw/mnd ----
  const lissers = await db.query.organizations.findFirst({
    where: eq(organizations.slug, "lissers"),
    columns: {
      id: true,
      legacyPackageName: true,
      legacyPackagePriceCents: true,
      legacyBillingInterval: true,
      websiteUrl: true,
    },
  });
  if (!lissers) {
    console.error("Lissers org niet gevonden — run eerst pnpm db:seed-clients.");
    process.exit(1);
  }
  await db
    .update(organizations)
    .set({
      legacyPackageName: "Web Starter",
      // Excl btw — admin tonen prijs zoals andere tier-prijzen (excl btw).
      // Klant ziet 't via 't portaal in dezelfde currency-format. €25,00.
      legacyPackagePriceCents: 2500,
      legacyBillingInterval: "monthly",
      // websiteUrl + websiteNote: pas in /admin in zodra je 'm wilt tonen.
      // Dashboard renders alleen iets bij ingevulde URL.
      websiteUrl: lissers.websiteUrl ?? "https://lissers.nl",
    })
    .where(eq(organizations.id, lissers.id));
  console.log(`✓ Lissers (${lissers.id}) bijgewerkt — Web Starter €25,00 excl/mnd`);

  // ---- Hoogduin Onderhoud — geen legacy-pakket ----
  // Laat alles op null. Hij ziet z'n portaal voor referentie + tickets.
  // websiteUrl: vul handmatig in via /admin als bekend. Niets te doen
  // hier; we zetten alleen even een sanity-check.
  const hoogduin = await db.query.organizations.findFirst({
    where: eq(organizations.slug, "hoogduin-onderhoud"),
    columns: { id: true, legacyPackageName: true },
  });
  if (!hoogduin) {
    console.error("Hoogduin org niet gevonden — run eerst pnpm db:seed-clients.");
    process.exit(1);
  }
  console.log(
    `· Hoogduin (${hoogduin.id}) — geen legacy-pakket-config (terecht; site-build-klant zonder abo)`,
  );

  console.log("\nKlaar.");
}

main()
  .catch((err) => {
    console.error("legacy seed failed:", err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
