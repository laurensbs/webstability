/**
 * Single source of truth voor alle tier- en build-prijzen die op de
 * site getoond worden. Voorkomt drift tussen messages/*.json en
 * componenten als de BuildCalculator.
 *
 * Stripe-zijde (price IDs in env) is bewust losgekoppeld: Stripe is
 * de fact, deze constants zijn alleen display.
 */

export type TierId = "care" | "studio" | "atelier";
export type BuildId = "none" | "light" | "standard" | "custom";

export const TIER_PRICES: Record<TierId, number> = {
  care: 95,
  studio: 179,
  atelier: 399,
};

export const BUILD_PRICES: Record<BuildId, number> = {
  none: 0,
  light: 349,
  standard: 499,
  custom: 899,
};

/**
 * Build-projectprijzen (éénmalig, display) — losgekoppeld van de
 * BUILD_PRICES hierboven (dat zijn de tijdelijke maand-add-ons tijdens
 * een build). Dit zijn de richtprijzen voor het bouwwerk zelf:
 * - Kleine site / landingpage: vanaf €1.050
 * - Webshop met BTW/IVA: vanaf €3.000
 * - Verhuur-boekingssysteem / klantportaal: €6.000–10.000
 *   (was €5–8k; verhoogd per strategie v2 — €5k signaleerde "goedkoop")
 *   De €5k-instap blijft voor kleine verhuur (1–5 objecten).
 */
export const BUILD_PROJECT_FLOORS = {
  site: 1050,
  webshop: 3000,
  rentalSystemMin: 6000,
  rentalSystemMax: 10000,
  rentalSmall: 5000,
} as const;

/**
 * Discovery-traject (betaald) — de brug tussen de gratis kennismakings-
 * call en de €6–10k build. We tekenen samen het proces uit, klant
 * krijgt een concreet plan + vaste offerte. Bij doorgang verrekend in
 * de build. Geen Stripe-product nodig — wordt handmatig gefactureerd
 * (of via een Stripe Payment Link als het volume omhoog gaat).
 */
export const DISCOVERY_PRICE_MIN = 500;
export const DISCOVERY_PRICE_MAX = 750;

/**
 * Care is per 2026-05 gesloten voor nieuwe instroom — anker, geen aanbod.
 * Het minimum-bedrag voor nieuwe contracten is €150/m. Studio (€179) is
 * de feitelijke instap-tier op /prijzen.
 */
export const ENTRY_TIER: TierId = "studio";
export const LEGACY_TIERS = new Set<TierId>(["care"]);

export function isLegacyTier(id: TierId): boolean {
  return LEGACY_TIERS.has(id);
}

// ===========================================================================
// Parametrisch prijsmodel voor de publieke website/webshop-configurator.
// Geeft een *richtprijs-band* terug (low–high) — de definitieve offerte
// volgt na een kort gesprek. Bewust apart van de tier/build-constants
// hierboven; raakt die niet aan. Bedragen in hele euro's (de configurator-
// UI rekent om naar weergave; submit slaat cents op).
// ===========================================================================

export type ProjectKind = "website" | "webshop";

/** Basisbedrag (richt) per project-type — sluit aan op BUILD_PROJECT_FLOORS. */
export const PROJECT_BASE: Record<ProjectKind, number> = {
  website: BUILD_PROJECT_FLOORS.site, // 1050
  webshop: BUILD_PROJECT_FLOORS.webshop, // 3000
};

/** Aantal pagina's dat in het basisbedrag zit. */
export const PROJECT_PAGES_INCLUDED: Record<ProjectKind, number> = {
  website: 5,
  webshop: 8,
};

/** Meerprijs per pagina boven het inbegrepen aantal. */
export const PROJECT_EXTRA_PAGE = 120;

/** Maximaal aantal pagina's dat de configurator-stepper toelaat (daarboven
 * "neem contact op" — dan is het een groter traject). */
export const PROJECT_MAX_PAGES = 25;

/** Optionele add-ons. Key = id, value = { price, labelKey, appliesTo }.
 * `appliesTo` bepaalt voor welke dienst-types de optie in de configurator
 * verschijnt — een website-klant ziet geen "voorraad-koppeling", een
 * webshop-klant geen los "aanvraagformulier" (zit al in de checkout-flow).
 * De labelKeys verwijzen naar messages onder `configurator.options.*`. */
export const CONFIG_OPTIONS = {
  multilingual: { price: 600, labelKey: "multilingual", appliesTo: ["website", "webshop"] }, // NL + ES (of meer) volwaardig
  inventorySync: { price: 500, labelKey: "inventorySync", appliesTo: ["webshop"] }, // voorraad-koppeling (webshop)
  blog: { price: 350, labelKey: "blog", appliesTo: ["website", "webshop"] }, // blog / nieuws-sectie met CMS
  customDesign: { price: 800, labelKey: "customDesign", appliesTo: ["website", "webshop"] }, // eigen design i.p.v. template-variant
  copywriting: { price: 450, labelKey: "copywriting", appliesTo: ["website", "webshop"] }, // wij schrijven de teksten
  bookingForm: { price: 400, labelKey: "bookingForm", appliesTo: ["website"] }, // afspraak-/aanvraagformulier
} as const satisfies Record<
  string,
  { price: number; labelKey: string; appliesTo: readonly ProjectKind[] }
>;

export type ConfigOptionId = keyof typeof CONFIG_OPTIONS;

/** De option-ids die voor een gegeven dienst-type relevant zijn, in vaste
 * volgorde (zoals gedefinieerd in CONFIG_OPTIONS). */
export function configOptionsForKind(kind: ProjectKind): ConfigOptionId[] {
  return (Object.keys(CONFIG_OPTIONS) as ConfigOptionId[]).filter((id) =>
    (CONFIG_OPTIONS[id].appliesTo as readonly ProjectKind[]).includes(kind),
  );
}

/** Gecureerde kleur/sfeer-paletten voor de configurator (géén vrije
 * colorpicker — premium/curated). Key = id, value = { swatch: [hex,...],
 * labelKey }. De labelKeys verwijzen naar `configurator.palettes.*`. */
export const CONFIG_PALETTES = {
  warm: { labelKey: "warm", swatch: ["#F5F0E8", "#C9614F", "#6B1E2C"] },
  modern: { labelKey: "modern", swatch: ["#FFFFFF", "#1F1B16", "#2C5F5D"] },
  dark: { labelKey: "dark", swatch: ["#15110D", "#C9614F", "#EFE8DB"] },
  fresh: { labelKey: "fresh", swatch: ["#FBFAF7", "#2C5F5D", "#5A7A4A"] },
  bold: { labelKey: "bold", swatch: ["#0E0E10", "#6B1E2C", "#C9614F"] },
} as const;

export type ConfigPaletteId = keyof typeof CONFIG_PALETTES;

/** Taalkeuzes in de configurator. Label-keys → `configurator.languages.*`. */
export const CONFIG_LANGUAGE_OPTIONS = ["nl", "nl_es", "nl_es_en"] as const;
export type ConfigLanguageId = (typeof CONFIG_LANGUAGE_OPTIONS)[number];

/** ±-marge op de richtprijs — we tonen low/high zodat het eerlijk een
 * schatting is, geen harde offerte. */
const ESTIMATE_MARGIN = 0.15;

export type PriceLine = { labelKey: string; cents: number; meta?: Record<string, unknown> };

export type PriceEstimate = {
  /** Onderkant van de band, in cents. */
  lowCents: number;
  /** Bovenkant van de band, in cents. */
  highCents: number;
  /** Middenwaarde (waar de losse regels op optellen), in cents. */
  midCents: number;
  /** Opbouw, in cents — voor de "wat zit erin"-samenvatting. */
  lines: PriceLine[];
};

/**
 * Berekent de richtprijs-band voor een website/webshop-configuratie.
 * Pure functie — geen side effects, geen i18n (de UI vertaalt de labelKeys).
 */
export function estimateProjectPrice(input: {
  kind: ProjectKind;
  pages: number;
  options: ConfigOptionId[];
}): PriceEstimate {
  const base = PROJECT_BASE[input.kind];
  const included = PROJECT_PAGES_INCLUDED[input.kind];
  const pages = Math.max(included, Math.min(PROJECT_MAX_PAGES, Math.round(input.pages)));
  const extraPages = Math.max(0, pages - included);
  const extraPagesCost = extraPages * PROJECT_EXTRA_PAGE;

  const lines: PriceLine[] = [
    {
      labelKey: input.kind === "webshop" ? "base.webshop" : "base.website",
      cents: base * 100,
      meta: { includedPages: included },
    },
  ];
  if (extraPages > 0) {
    lines.push({
      labelKey: "extraPages",
      cents: extraPagesCost * 100,
      meta: { count: extraPages, perPage: PROJECT_EXTRA_PAGE },
    });
  }
  // Dedupe + alleen geldige option-ids meerekenen.
  const seen = new Set<ConfigOptionId>();
  for (const id of input.options) {
    if (!(id in CONFIG_OPTIONS) || seen.has(id)) continue;
    seen.add(id);
    const opt = CONFIG_OPTIONS[id];
    lines.push({ labelKey: `options.${opt.labelKey}`, cents: opt.price * 100, meta: { id } });
  }

  const midCents = lines.reduce((sum, l) => sum + l.cents, 0);
  const lowCents = Math.round((midCents * (1 - ESTIMATE_MARGIN)) / 5000) * 5000; // afronden op €50
  const highCents = Math.round((midCents * (1 + ESTIMATE_MARGIN)) / 5000) * 5000;
  return { lowCents, highCents, midCents, lines };
}
