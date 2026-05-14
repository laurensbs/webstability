// Slugs voor de dynamische /diensten/[vertical]-route. De content per
// slug staat in messages/{nl,es}.json onder `verticals.{slug}`. Voeg
// hier een slug toe + de bijbehorende messages-blokken en de page
// rendert automatisch (generateStaticParams loopt over deze lijst,
// sitemap ook).
//
// De slug is per definitie hetzelfde in NL en ES — de route-segment
// wisselt niet per locale, alleen het bovenliggende pad (/diensten vs
// /servicios) doet dat via i18n/routing.ts.

export const VERTICAL_SLUGS = [
  "verhuur-boekingssysteem",
  "klantportaal-laten-bouwen",
  "website-laten-maken",
  "webshop-laten-maken",
  "admin-systeem-op-maat",
  "reparatie-portaal",
] as const;

/** Verticals waarvoor de publieke project-configurator (/aanvragen)
 * relevant is — daar tonen we een prominente "stel je project samen"-CTA. */
export const CONFIGURABLE_VERTICALS = new Set<string>([
  "website-laten-maken",
  "webshop-laten-maken",
]);

/** Mapping van vertical-slug naar de interne demo-pagina die het meest
 * representatief is voor die dienst. Gebruikt op de vertical-pagina om
 * naast de "plan een gesprek"-CTA een "open live demo"-knop te tonen.
 * Interne paden i.p.v. externe URL's — geen Vercel-deploy of DNS nodig.
 *
 * Niet elke vertical heeft een demo — website/webshop zijn pure
 * marketing-cases zonder portaal of admin om te demonstreren. */
export const VERTICAL_DEMO_URLS: Record<string, string> = {
  "verhuur-boekingssysteem": "/demo/verhuur",
  "reparatie-portaal": "/demo/reparatie",
  "klantportaal-laten-bouwen": "/demo/stalling",
  "admin-systeem-op-maat": "/demo/stalling",
};

export type VerticalSlug = (typeof VERTICAL_SLUGS)[number];

export function isVerticalSlug(s: string): s is VerticalSlug {
  return (VERTICAL_SLUGS as readonly string[]).includes(s);
}
