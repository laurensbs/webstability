// Webstability-branding voor de Cal.com-embed. Wordt door zowel de Cal-popup
// (CalPopupTrigger) als de inline Cal (CalEmbed op /contact) aangeroepen
// nadat de Cal-api beschikbaar is. Eén plek zodat de embed overal hetzelfde
// terracotta-accent + cream-fond + serif-heading toont, niet generiek-Cal.
//
// Documentatie: de UiConfig accepteert `styles` (legacy) en `cssVarsPerTheme`
// (nieuw); we zetten allebei voor maximale compatibiliteit. De CSS-vars zijn
// degene die Cal's Booker UI als design-tokens gebruikt.

// Cal's globale singleton is een functie `cal(method, ...args)`. We typeren
// 'm hier minimaal — `embed-core` is een transitive dep en willen we niet
// als directe import dwingen.
type AnyCal = ((method: "ui", config: Record<string, unknown>) => void) | undefined | null;

// Brand-palette spiegelt globals.css `@theme`:
const BRAND = {
  // Terracotta CTA-kleur — Cal noemt 'm `cal-brand`.
  brand: "#C9614F",
  // Donkere tekst op cream.
  text: "#1F1B16",
  bgWarm: "#EFE8DB",
  surface: "#FFFFFF",
  border: "#E5DDCC",
  muted: "#6B645A",
  cream: "#F5F0E8",
} as const;

export function applyWebstabilityCalBranding(cal: AnyCal | unknown) {
  if (typeof cal !== "function") return;
  try {
    (cal as (m: "ui", c: Record<string, unknown>) => void)("ui", {
      hideEventTypeDetails: false,
      theme: "light",
      // Legacy `styles.branding.brandColor` — sommige Cal-buildversies
      // luisteren hier nog steeds naar.
      styles: {
        branding: { brandColor: BRAND.brand },
      },
      // Moderne route: CSS-vars die Cal in z'n eigen Booker-UI gebruikt.
      cssVarsPerTheme: {
        light: {
          "cal-brand": BRAND.brand,
          "cal-brand-emphasis": BRAND.brand,
          "cal-brand-text": "#ffffff",
          "cal-bg": BRAND.surface,
          "cal-bg-emphasis": BRAND.bgWarm,
          "cal-bg-muted": BRAND.bgWarm,
          "cal-bg-subtle": BRAND.bgWarm,
          "cal-text": BRAND.text,
          "cal-text-emphasis": BRAND.text,
          "cal-text-muted": BRAND.muted,
          "cal-border": BRAND.border,
          "cal-border-subtle": BRAND.border,
        },
        dark: {
          "cal-brand": BRAND.brand,
          "cal-brand-emphasis": BRAND.brand,
          "cal-brand-text": "#ffffff",
        },
      },
    });
  } catch {
    // Branding faalt nooit hard — Cal blijft gewoon op default rendereren.
  }
}
