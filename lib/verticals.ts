// Slugs voor de dynamische /diensten/[vertical]-route. De content per
// slug staat in messages/{nl,es}.json onder `verticals.{slug}`. Voeg
// hier een slug toe + de bijbehorende messages-blokken en de page
// rendert automatisch (generateStaticParams loopt over deze lijst,
// sitemap ook).
//
// De slug is per definitie hetzelfde in NL en ES — de route-segment
// wisselt niet per locale, alleen het bovenliggende pad (/diensten vs
// /servicios) doet dat via i18n/routing.ts.
//
// Sinds de positionering verschoven is naar "complete panelen op
// abonnement" zijn de losse website/webshop verticals verwijderd uit
// deze lijst — die worden niet meer als dienst aangeboden.
// /diensten/website-laten-maken en /diensten/webshop-laten-maken
// redirecten naar /diensten via Next's permanentRedirect (zie de
// pagina's; oude SEO-juice blijft behouden).
//
// Slugs zijn uit historische reden URL-vriendelijke versies van het
// product (bv. "verhuur-boekingssysteem"); de UI-label leeft in de
// messages bundle en is "Verhuurpaneel" — past bij de nieuwe
// abonnement-positionering zonder dat we URLs hoeven te breken.

export const VERTICAL_SLUGS = [
  "verhuur-boekingssysteem",
  "reparatie-portaal",
  "klantportaal-laten-bouwen",
  "admin-systeem-op-maat",
] as const;

/** Maandelijkse abonnementsprijs per paneel in EUR (excl. BTW).
 * Centraal gedefinieerd zodat /prijzen, /diensten/[slug] en de
 * picker dezelfde getallen tonen. Pas hier 1 plek aan en de hele
 * site volgt. Indicatief — bevestiging in offerte na intake. */
export const PANEL_MONTHLY_PRICE: Record<VerticalSlug, number> = {
  "klantportaal-laten-bouwen": 245,
  "reparatie-portaal": 395,
  "verhuur-boekingssysteem": 495,
  "admin-systeem-op-maat": 545,
};

/** Mapping van paneel-slug naar de interne demo-pagina die het paneel
 * representeert. Gebruikt op de detail-pagina voor de "open live demo"-knop.
 *
 * Stalling-demo werkt voor zowel klantportaal als adminpaneel omdat het
 * platform beide kanten laat zien (klantlogin + studio admin). */
export const VERTICAL_DEMO_URLS: Record<VerticalSlug, string> = {
  "verhuur-boekingssysteem": "/demo/verhuur",
  "reparatie-portaal": "/demo/reparatie",
  "klantportaal-laten-bouwen": "/demo/stalling/portaal",
  "admin-systeem-op-maat": "/demo/stalling",
};

export type VerticalSlug = (typeof VERTICAL_SLUGS)[number];

export function isVerticalSlug(s: string): s is VerticalSlug {
  return (VERTICAL_SLUGS as readonly string[]).includes(s);
}
