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

export type VerticalSlug = (typeof VERTICAL_SLUGS)[number];

export function isVerticalSlug(s: string): s is VerticalSlug {
  return (VERTICAL_SLUGS as readonly string[]).includes(s);
}
