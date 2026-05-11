// Seed-onderwerpen voor de wekelijkse AI-blog-conceptgenerator. De cron
// `/api/cron/blog-draft` upsert deze lijst naar de `blog_drafts`-tabel
// (op slug; bestaande rijen worden niet overschreven) en pakt vervolgens
// de oudste 'pending' om te genereren.
//
// Voeg hier een onderwerp toe → bij de volgende cron-run staat het in de
// queue. Lagere `priority` = eerder aan de beurt. Houd de NL-first regel
// aan; ES-vertaling doet Laurens (of een latere uitbreiding) los.
//
// Schrijf-richtlijnen die de generator afdwingt staan in
// `lib/blog/generate.ts` (huisstijl, lengte, frontmatter, interne links).

export type BlogTopicSeed = {
  /** Bestandsnaam zonder .mdx, kebab-case. Uniek. */
  slug: string;
  /** Werktitel — de generator mag 'm aanscherpen maar blijft on-topic. */
  title: string;
  /** Primaire zoekwoorden, komma-gescheiden. */
  targetKeywords: string;
  /** Briefing: hoek, wat benadrukken, welke interne links suggereren. */
  brief: string;
  priority?: number;
};

export const BLOG_TOPIC_SEEDS: BlogTopicSeed[] = [
  {
    slug: "booqable-prijzen-uitgelegd",
    title: "Wat kost Booqable echt — het prijsmodel uitgelegd en wanneer het te duur wordt",
    targetKeywords: "booqable prijs, booqable kosten, booqable abonnement, booqable nederlands",
    brief:
      "Leg het Booqable-prijsmodel uit (plannen, per-seat/per-feature, add-ons), reken het door over 1/3/5 jaar, en laat zien op welk punt — gemengd portfolio, tweede locatie, internationaal — maatwerk goedkoper uitpakt. Eerlijk: Booqable is prima voor één-type/één-locatie. Interne links: /blog/booqable-vs-maatwerk, /blog/verhuursoftware-vergelijken-2026, /diensten/verhuur-boekingssysteem, /verhuur, /contact.",
    priority: 10,
  },
  {
    slug: "verhuurbedrijf-opschalen-van-10-naar-50-objecten",
    title:
      "Een verhuurbedrijf opschalen van 10 naar 50 objecten — wat er breekt en wat je systeem moet kunnen",
    targetKeywords:
      "verhuurbedrijf groeien, verhuurbedrijf opschalen, meer objecten verhuren, verhuursoftware schaalbaar",
    brief:
      "Wat breekt er bij groei: Excel-agenda's, handmatige boekhouding, één-bron-principe dat niet meer houdt, meerdere medewerkers, meerdere locaties, channel-sync. Wat moet een systeem dan kunnen. Eerlijke 'wanneer is opschalen-werk de moeite waard'-sectie. Interne links: /blog/dubbele-boekingen-voorkomen, /blog/admin-systeem-op-maat-vs-excel, /diensten/verhuur-boekingssysteem, /cases/caravanverhuurspanje, /contact.",
    priority: 20,
  },
  {
    slug: "online-betalingen-voor-verhuur",
    title:
      "Online betalingen voor je verhuurbedrijf — betaalprovider kiezen, borg-autorisatie, NL en ES",
    targetKeywords:
      "ideal verhuur, stripe verhuursysteem, online betalen verhuur, borg automatiseren betaalprovider",
    brief:
      "Hoe online betalen werkt in een verhuursysteem: betaalprovider kiezen (Stripe/Mollie), iDEAL/Bancontact/kaart, borg-autorisatie vs incasso, deelbetalingen, terugbetalingen, en de NL+ES betaalmethode-mix. Eerlijke 'wanneer heb je dit echt nodig'-sectie. Interne links: /blog/verhuursoftware-begrippen-woordenlijst, /diensten/verhuur-boekingssysteem, /diensten/klantportaal-laten-bouwen, /contact.",
    priority: 30,
  },
  {
    slug: "avantio-alternatief-nederlands",
    title:
      "Avantio alternatief — wanneer maatwerk goedkoper is dan enterprise-vakantieverhuursoftware",
    targetKeywords:
      "avantio alternatief, avantio nederlands, vakantieverhuur software, enterprise verhuursoftware",
    brief:
      "NL-versie van de bestaande ES-post avantio-alternativa-personalizada. Avantio is sterk vanaf ~20 units op de Spaanse markt; voor een Nederlandse verhuurder met 5-15 panden aan de Costa Brava is het te zwaar/te duur en NL is een afterthought. Kosten over 24 maanden, wat je krijgt voor het verschil (eigen merk, NL+ES portaal, NL-boekhoudkoppeling, geen per-property fee). Eerlijke 'wanneer Avantio toch klopt'-sectie. Interne links: /blog/verhuursoftware-vergelijken-2026, /blog/verhuursysteem-twee-talen, /diensten/verhuur-boekingssysteem, /cases/caravanverhuurspanje, /contact.",
    priority: 40,
  },
];
