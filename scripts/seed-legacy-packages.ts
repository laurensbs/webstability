// One-off: legacy-pakket-config zetten op bestaande klanten. Geen mail,
// geen Stripe — directe DB-write. Idempotent (kan veilig opnieuw).
//
// Lissers — "Web Starter" €30,25/mnd incl btw (€25,00 excl). Oude klant
// van vóór Webstability, gereduceerd onderhoudstarief. Krijgt in 't
// portaal alleen passieve infra: hosting + backups + security-updates +
// uptime-monitoring. Geen wijzigings-tickets, geen uren-budget, geen
// maand-/week-rapport.
//
// Hoogduin Onderhoud (Bram Hoogduin) — zelfde Web Starter als Lissers,
// €30,25 incl btw/mnd = €25,00 excl. Zelfde gereduceerde tarief, zelfde
// passieve infra (hosting + backups + security-updates + uptime).
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

  // ---- Hoogduin Onderhoud — zelfde Web Starter ----
  const hoogduin = await db.query.organizations.findFirst({
    where: eq(organizations.slug, "hoogduin-onderhoud"),
    columns: { id: true, websiteUrl: true },
  });
  if (!hoogduin) {
    console.error("Hoogduin org niet gevonden — run eerst pnpm db:seed-clients.");
    process.exit(1);
  }
  await db
    .update(organizations)
    .set({
      legacyPackageName: "Web Starter",
      legacyPackagePriceCents: 2500,
      legacyBillingInterval: "monthly",
      websiteUrl: hoogduin.websiteUrl ?? "https://hoogduinonderhoud.nl",
    })
    .where(eq(organizations.id, hoogduin.id));
  console.log(`✓ Hoogduin (${hoogduin.id}) bijgewerkt — Web Starter €25,00 excl/mnd`);

  console.log("\nKlaar.");
}

main()
  .catch((err) => {
    console.error("legacy seed failed:", err);
    process.exit(1);
  })
  .finally(() => process.exit(0));
