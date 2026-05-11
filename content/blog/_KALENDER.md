# Content-kalender — blog

Doel: ranken voor "verhuursoftware", "boekingssysteem verhuur",
"klantportaal laten bouwen", Costa Brava / Spanje, MKB-maatwerk.
NL-first; ES-vertaling per post 1-2 weken later. Target: 1 post per
week. Elke post: 1000+ woorden, één H1 (= titel), logische H2's met
zoekwoord, frontmatter met `keywords` + `tags`, minstens 2 interne
links (naar `/verhuur`, `/diensten`, `/diensten/[vertical]`, `/cases`
of een andere blog-post).

## Gepubliceerd (volledige artikelen)
- ✅ booqable-vs-maatwerk — "booqable alternatief", "verhuursoftware vergelijken"
- ✅ tommy-alternatief-nederlands — "tommy alternatief", "kassasysteem verhuur"
- ✅ verhuursysteem-twee-talen — "meertalige verhuursoftware", "verhuursoftware nederland spanje"
- ✅ verhuursysteem-kiezen — "verhuursysteem kiezen", "verhuursoftware kopen"
- ✅ mobile-first-dashboards — "mobile-first admin", "admin-systeem op maat"
- ✅ seo-spanje — "lokale seo spanje", "google.es ranken"
- ⚠️ avantio-alternativa-personalizada (ES) — skeleton, nog afmaken naar 1000+ woorden
- ✅ elegir-sistema-alquiler (ES) — vertaling van verhuursysteem-kiezen
- ✅ seo-local-espana (ES) — vertaling van seo-spanje

## Te schrijven (prioriteit hoog → laag)
1. **verhuursoftware-vergelijken-2026** — overkoepelende gids: SaaS vs maatwerk,
   de bekende tools (Booqable/Tommy/Avantio/Icnea/Lodgify) op een rij, een
   beslisboom. Target: "verhuursoftware vergelijken", "beste verhuursoftware".
   Links naar de drie alternatief-artikelen + `/diensten/verhuur-boekingssysteem`.
2. **boekingssysteem-laten-bouwen-kosten** — "wat kost een boekingssysteem op maat",
   "boekingssysteem laten maken prijs". Diepe uitleg vaste-prijs-model, 4-weken-levering,
   abonnement daarna, maatwerk-vs-SaaS over 3 jaar. Links naar `/prijzen` + de vertical.
3. **klantportaal-voor-verhuurbedrijf** — "klantportaal verhuur", "klantportaal laten bouwen".
   Concrete use-cases (gast ziet boeking/documenten/borg-status). Links naar
   `/diensten/klantportaal-laten-bouwen` + `/cases/caravanverhuurspanje`.
4. **dubbele-boekingen-voorkomen** — "dubbele boekingen voorkomen", "airbnb booking sync".
   Hoe channel-sync werkt, waarom Excel breekt, één-bron-principe.
5. **software-voor-caravanverhuur** — branchepagina-achtig, "software caravanverhuur",
   "caravanverhuur systeem". Specifiek: borg, huurcontract, weekprijzen, stacaravans.
6. **reparatie-portaal-voor-werkplaatsen** — "reparatie portaal", "werkbon software werkplaats".
   iPad-flow, papierloos, status-tracking. Verwijst naar VOLT/AUTO-case.
7. **admin-systeem-op-maat-vs-excel** — "admin systeem op maat", "bedrijf draait op excel".
   Wanneer is de stap weg van Excel logisch, wat krijg je ervoor.
8. **mkb-maatwerk-software-wanneer-wel-niet** — "maatwerk software mkb", "custom software wanneer".
   Eerlijke afbakening: wanneer SaaS, wanneer maatwerk.
9. **boekhouding-koppelen-aan-verhuursysteem** — "holded koppelen", "e-boekhouden integratie verhuur".
   Hoe een koppeling werkt, NL+ES dubbele boekhouding.
10. **verhuursoftware-begrippen-woordenlijst** — glossary-post: "channel manager", "dubbele boeking",
    "klantportaal", "multi-currency", "borg-automatisering". Long-tail traffic, interne links naar
    alle relevante pagina's.
11. **seo-voor-lokale-bedrijven-spanje** (ES) — uitbreiding van seo-local-espana, dieper.

## Werkwijze per post
1. Schrijf in `content/blog/nl/[slug].mdx` met volledige frontmatter.
2. Build + check dat `/blog/[slug]` rendert en de BlogPosting + Breadcrumb JSON-LD valid is.
3. Vertaal naar `content/blog/es/[slug-es].mdx` (eigen slug mag, ES-versie hoeft niet
   exact dezelfde slug te hebben — zie bestaande ES-posts).
4. Voeg eventueel een verwijzing toe vanuit een relevante service-page of vertical.
5. Na deploy: URL indexeren in Google Search Console.
