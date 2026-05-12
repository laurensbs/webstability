/**
 * Eén bron van waarheid voor "wat voor dienst heeft deze klant" en wat daaruit
 * volgt: de fase-set van de build-stepper, de welkom-onboarding-stappen, en de
 * handover-checklist-extra's. Alle vertakkingen in de flow (configurator,
 * dashboard, intake, admin) leiden hiernaartoe.
 *
 * `project.type` (de DB-enum: website | webshop | system | care | build | seo)
 * is de feitelijke bron; `serviceKindFromProjectType()` mapt 'm naar een van de
 * vier presentatie-categorieën hieronder.
 */

export type ServiceKind = "website" | "webshop" | "platform" | "other";

type ProjectType = "care" | "build" | "website" | "webshop" | "system" | "seo";

export function serviceKindFromProjectType(
  type: ProjectType | string | null | undefined,
): ServiceKind {
  switch (type) {
    case "website":
    case "seo":
      return "website";
    case "webshop":
      return "webshop";
    case "system":
    case "build":
      return "platform";
    default:
      return "other";
  }
}

/** Voor een org met meerdere projecten: pak het meest "concrete" dienst-type
 * (een actief website/webshop/platform-project boven 'care'/'other'). */
export function serviceKindFromProjects(
  projects: Array<{ type: string; status: string }>,
): ServiceKind {
  const order: ServiceKind[] = ["platform", "webshop", "website", "other"];
  const kinds = projects.map((p) => serviceKindFromProjectType(p.type));
  for (const k of order) if (kinds.includes(k)) return k;
  return "other";
}

// --------------------------------------------------------------------------
// Fase-stappen van de build-stepper. De basis is altijd planning → in
// ontwikkeling → … → live; de tussenstappen verschillen per dienst-type.
// De ProjectStatusStepper rendert deze labels; `current` wordt afgeleid uit
// project.status (planning | in_progress | review | live | done).
// --------------------------------------------------------------------------

export type PhaseStep = { key: string; label: string };

/** Sleutels die we expliciet aan project.status koppelen: 'planning' = stap 0,
 * 'in_progress' = de eerste "bouw"-stap, 'review' = de op-één-na-laatste,
 * 'live' = de laatste. Tussenstappen tonen we als "onderweg" maar markeren we
 * niet apart actief (status heeft die granulariteit niet). */
export const PHASES_BY_KIND: Record<ServiceKind, PhaseStep[]> = {
  website: [
    { key: "planning", label: "Plan & inhoud" },
    { key: "in_progress", label: "Ontwerp & bouw" },
    { key: "review", label: "Review" },
    { key: "live", label: "Live" },
  ],
  webshop: [
    { key: "planning", label: "Plan & producten" },
    { key: "in_progress", label: "Ontwerp & bouw" },
    { key: "data", label: "Productdata & betalingen" },
    { key: "review", label: "Testbestellingen" },
    { key: "live", label: "Live" },
  ],
  platform: [
    { key: "planning", label: "Discovery & scope" },
    { key: "in_progress", label: "Architectuur & bouw" },
    { key: "review", label: "Review & integraties" },
    { key: "live", label: "Live" },
  ],
  other: [
    { key: "planning", label: "Plan" },
    { key: "in_progress", label: "In ontwikkeling" },
    { key: "review", label: "Review" },
    { key: "live", label: "Live" },
  ],
};

// --------------------------------------------------------------------------
// Welkom-onboarding in het portal — 3 stappen, dienst-specifiek. step1 is
// generiek ("welkom, {firstName}"); step2/step3 verschillen.
// --------------------------------------------------------------------------

export type OnboardingStep = { title: string; body: string };

export const ONBOARDING_BY_KIND: Record<
  ServiceKind,
  {
    step2: OnboardingStep & {
      ctaHref: "/portal/tickets" | "/portal/invoices" | "/portal/monitoring";
    };
    step3: OnboardingStep & {
      ctaHref: "/portal/tickets" | "/portal/invoices" | "/portal/monitoring";
    };
  }
> = {
  website: {
    step2: {
      title: "Hier zie je de voortgang van je site",
      body: "De voortgangsbalk + wekelijkse updates laten zien waar we staan. Zodra je site live is komt hier ook je live-URL en de uptime te staan.",
      ctaHref: "/portal/monitoring",
    },
    step3: {
      title: "Vraag of wijziging? Open een ticket",
      body: "Tekst aanpassen, een foto vervangen, een pagina erbij — alles loopt via tickets. Jij ziet de status, ik hou de draad vast.",
      ctaHref: "/portal/tickets",
    },
  },
  webshop: {
    step2: {
      title: "Hier zie je straks je bestellingen & omzet",
      body: "Zodra je shop live staat tonen we hier ordervolume, omzet en de conversie. Tijdens de bouw zie je de voortgang en de planning.",
      ctaHref: "/portal/monitoring",
    },
    step3: {
      title: "Producten, betalingen, verzending — laat het weten",
      body: "Aanpassingen aan je shop (nieuwe producten, prijzen, btw, verzendregels) doe je via een ticket. Ik regel het en koppel terug.",
      ctaHref: "/portal/tickets",
    },
  },
  platform: {
    step2: {
      title: "Hier zie je de status van je platform",
      body: "Bouw-voortgang, openstaande vragen voor jou, en — zodra het draait — de monitoring van de koppelingen en de live-omgeving.",
      ctaHref: "/portal/monitoring",
    },
    step3: {
      title: "Wijziging of nieuwe koppeling? Open een ticket",
      body: "Een extra integratie, een aanpassing aan de flow, een nieuwe gebruiker — alles via tickets, met status die jij kunt volgen.",
      ctaHref: "/portal/tickets",
    },
  },
  other: {
    step2: {
      title: "Hier zie je de voortgang van je project",
      body: "De voortgangsbalk + wekelijkse updates houden je op de hoogte. Je facturen vind je onder Facturen.",
      ctaHref: "/portal/invoices",
    },
    step3: {
      title: "Vraag of wijziging? Open een ticket",
      body: "Alles loopt via tickets — jij ziet de status, ik hou de draad vast.",
      ctaHref: "/portal/tickets",
    },
  },
};

// --------------------------------------------------------------------------
// "Wat gebeurt er nu" — de stappen op het configurator-successcherm + in de
// bevestigingsmail, dienst-specifiek. (De configurator produceert alleen
// website/webshop; 'platform'/'other' zijn er voor de mail-helper.)
// --------------------------------------------------------------------------

export const NEXT_STEPS_BY_KIND: Record<ServiceKind, string[]> = {
  website: [
    "Ik kijk je aanvraag door en kom binnen 1 werkdag bij je terug.",
    "We hebben een korte kennismaking om de details scherp te krijgen.",
    "Daarna krijg je een vaste offerte + planning, en verzamelen we samen de teksten en beelden.",
  ],
  webshop: [
    "Ik kijk je aanvraag door en kom binnen 1 werkdag bij je terug.",
    "We bespreken kort de producten, betaalmethodes en btw-opzet.",
    "Daarna krijg je een vaste offerte + planning; jij levert de productdata aan, ik koppel de betaalprovider.",
  ],
  platform: [
    "Ik kijk je aanvraag door en plan een discovery-gesprek.",
    "In dat gesprek tekenen we samen het proces en de koppelingen uit.",
    "Daarna krijg je een concreet plan + vaste offerte voor de bouw.",
  ],
  other: [
    "Ik kijk je aanvraag door en kom binnen 1 werkdag bij je terug.",
    "We hebben een korte kennismaking om de details scherp te krijgen.",
    "Daarna krijg je een vaste offerte en een planning.",
  ],
};

// --------------------------------------------------------------------------
// Handover-checklist-extra's per dienst-type — bovenop de generieke items.
// (Wordt gebruikt door de HandoverChecklist; puur tekst, staff vinkt af.)
// --------------------------------------------------------------------------

export const HANDOVER_EXTRAS_BY_KIND: Record<ServiceKind, string[]> = {
  website: [
    "Ingediend bij Search Console",
    "Favicon + OG-image gecontroleerd",
    "404 + redirects getest",
  ],
  webshop: [
    "Testbestelling met echte betaling gedaan",
    "Verzendregels ingesteld",
    "Btw per categorie geconfigureerd",
    "E-mail-bevestigingen (order/verzending) gecheckt",
  ],
  platform: [
    "Alle koppelingen getest met live-data",
    "Gebruikers + rollen ingericht",
    "Back-up-schema bevestigd",
  ],
  other: [],
};
