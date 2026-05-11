# Content-kalender — blog

Doel: ranken voor "verhuursoftware", "boekingssysteem verhuur",
"klantportaal laten bouwen", Costa Brava / Spanje, MKB-maatwerk.
NL-first; ES-vertaling per post 1-2 weken later. Target: 1 post per
week. Elke post: 1000+ woorden, één H1 (= titel), logische H2's met
zoekwoord, frontmatter met `keywords` + `tags`, minstens 2 interne
links (naar `/verhuur`, `/diensten`, `/diensten/[vertical]`, `/cases`
of een andere blog-post).

## Gepubliceerd (volledige artikelen)
- ✅ dubbele-boekingen-voorkomen — "dubbele boekingen voorkomen", "airbnb booking sync"
- ✅ software-voor-caravanverhuur — "software caravanverhuur", "caravanverhuur systeem"
- ✅ reparatie-portaal-voor-werkplaatsen — "reparatie portaal", "werkbon software werkplaats"
- ✅ admin-systeem-op-maat-vs-excel — "admin systeem op maat", "bedrijf draait op excel"
- ✅ mkb-maatwerk-software-wanneer-wel-niet — "maatwerk software mkb", "custom software wanneer"
- ✅ boekhouding-koppelen-aan-verhuursysteem — "holded koppelen", "e-boekhouden integratie verhuur"
- ✅ verhuursoftware-begrippen-woordenlijst — "verhuursoftware begrippen", "channel manager uitleg"
- ✅ verhuursoftware-vergelijken-2026 — "verhuursoftware vergelijken", "beste verhuursoftware"
- ✅ boekingssysteem-laten-bouwen-kosten — "boekingssysteem laten bouwen kosten", "verhuursoftware prijs"
- ✅ klantportaal-voor-verhuurbedrijf — "klantportaal verhuur", "klantportaal laten bouwen"
- ✅ booqable-vs-maatwerk — "booqable alternatief", "verhuursoftware vergelijken"
- ✅ tommy-alternatief-nederlands — "tommy alternatief", "kassasysteem verhuur"
- ✅ verhuursysteem-twee-talen — "meertalige verhuursoftware", "verhuursoftware nederland spanje"
- ✅ verhuursysteem-kiezen — "verhuursysteem kiezen", "verhuursoftware kopen"
- ✅ mobile-first-dashboards — "mobile-first admin", "admin-systeem op maat"
- ✅ seo-spanje — "lokale seo spanje", "google.es ranken"
- ✅ avantio-alternativa-personalizada (ES) — "avantio alternativa", "alternativa avantio personalizada"
- ✅ elegir-sistema-alquiler (ES) — vertaling van verhuursysteem-kiezen
- ✅ seo-local-espana (ES) — vertaling van seo-spanje
- ✅ seo-para-negocios-locales-espana (ES) — "seo negocios locales españa", "google business profile españa"
- ✅ evitar-reservas-duplicadas (ES) — vertaling van dubbele-boekingen-voorkomen
- ✅ software-alquiler-caravanas (ES) — vertaling van software-voor-caravanverhuur
- ✅ portal-reparaciones-para-talleres (ES) — vertaling van reparatie-portaal-voor-werkplaatsen
- ✅ sistema-interno-a-medida-vs-excel (ES) — vertaling van admin-systeem-op-maat-vs-excel
- ✅ software-a-medida-pymes (ES) — vertaling van mkb-maatwerk-software-wanneer-wel-niet
- ✅ conectar-contabilidad-sistema-alquiler (ES) — vertaling van boekhouding-koppelen-aan-verhuursysteem
- ✅ glosario-software-alquiler (ES) — vertaling van verhuursoftware-begrippen-woordenlijst

## Te schrijven (prioriteit hoog → laag)
_(Alle geplande posts + ES-vertalingen zijn geschreven. Volgende ideeën —
vrij in te vullen, ~1 per week, NL-first met ES-vertaling 1-2 weken later:)_
- **booqable-prijzen-uitgelegd** — "booqable prijs", "booqable kosten" — wat Booqable echt kost over de jaren, wanneer het te duur wordt.
- **verhuurbedrijf-opschalen-van-10-naar-50-objecten** — "verhuurbedrijf groeien", "meer objecten verhuren" — wat er breekt bij groei, wat je systeem dan moet kunnen.
- **online-betalingen-voor-verhuur** — "ideal verhuur", "stripe verhuursysteem" — betaalprovider kiezen, borg-autorisatie, NL+ES betaalmethodes.
- ES-vertaling van **verhuursysteem-twee-talen** ontbreekt nog (de NL-posts verwijzen ernaar).
- ES-vertalingen van verhuursoftware-vergelijken-2026, boekingssysteem-laten-bouwen-kosten, klantportaal-voor-verhuurbedrijf, booqable-vs-maatwerk, tommy-alternatief-nederlands, mobile-first-dashboards.

## Werkwijze per post
1. Schrijf in `content/blog/nl/[slug].mdx` met volledige frontmatter.
2. Build + check dat `/blog/[slug]` rendert en de BlogPosting + Breadcrumb JSON-LD valid is.
3. Vertaal naar `content/blog/es/[slug-es].mdx` (eigen slug mag, ES-versie hoeft niet
   exact dezelfde slug te hebben — zie bestaande ES-posts).
4. Voeg eventueel een verwijzing toe vanuit een relevante service-page of vertical.
5. Na deploy: URL indexeren in Google Search Console.
