import type { Metadata } from "next";

type Locale = "nl" | "es";

type RouteKey =
  | "home"
  | "verhuur"
  | "diensten"
  | "aanvragen"
  | "faq"
  | "cases"
  | "caseCaravanverhuur"
  | "caseCaravanreparatie"
  | "over"
  | "prijzen"
  | "contact"
  | "status"
  | "garanties"
  | "blog"
  | "privacy"
  | "avisoLegal";

type Copy = { title: string; description: string };

/**
 * Per-route SEO copy. Titles are deliberately under 60 chars (Google
 * truncates around there) and descriptions land between 130-160 chars.
 *
 * Falls back to the [locale]/layout.tsx root metadata if a route key
 * is missing — that root has title.template: "%s · Webstability" so
 * any returned title automatically gets the brand suffix.
 */
const COPY: Record<Locale, Record<RouteKey, Copy>> = {
  nl: {
    home: {
      title: "Het systeem onder je bedrijf",
      description:
        "Wij bouwen het complete systeem onder je bedrijf — publieke site, online boekingen, jouw admin paneel, alles geïntegreerd. Vanuit Costa Brava voor MKB in Nederland en Spanje.",
    },
    verhuur: {
      title: "Software voor verhuurbedrijven",
      description:
        "Stop met dubbele boekingen tussen Airbnb, Booking en je Excel. Eén dashboard, automatische facturen, contracten in één klik. Maatwerk verhuursoftware voor caravans, boten, vakantiehuizen.",
    },
    diensten: {
      title: "Diensten — vier panelen op abonnement",
      description:
        "Verhuurpaneel, reparatiepaneel, klantportaal of admin op maat. Vaste maandprijs vanaf €245/mnd, geen losse projectfacturen. Eén systeem dat draait, één Laurens die het bouwt en bijhoudt.",
    },
    aanvragen: {
      title: "Vraag een paneel aan",
      description:
        "Vier complete bedrijfspanelen op abonnement: verhuur, reparatie, klantportaal en admin. Vertel kort wat je nodig hebt, dan plannen we een korte kennismaking.",
    },
    faq: {
      title: "Veelgestelde vragen",
      description:
        "Wat kost een boekingssysteem of klantportaal op maat, hoe lang duurt het, maatwerk vs SaaS, en hoe ik werk. De vragen die ik het meest krijg, vooraf beantwoord.",
    },
    cases: {
      title: "Cases & klantverhalen",
      description:
        "Eigen platforms en klantcases die laten zien wat het verschil is van één geïntegreerd systeem t.o.v. vijf losse tools — minder Excel-puzzels, meer uren terug per week.",
    },
    caseCaravanverhuur: {
      title: "Caravanverhuurspanje — verhuurplatform in 4 weken",
      description:
        "Hoe een Nederlandse verhuurder met 12 caravans + 4 stacaravans op de Costa Brava van Excel + dubbele boekingen naar één geïntegreerd platform ging — vaste prijs, vier weken levering.",
    },
    caseCaravanreparatie: {
      title: "Caravanreparatiespanje — reparatie-portaal voor de werkplaats",
      description:
        "Van papieren werkbon naar iPad-flow: klanten melden online, de order belandt direct in de werkplaats, monteurs updaten de status terwijl ze werken. ~80 reparaties per maand, papierloos.",
    },
    over: {
      title: "Over Laurens",
      description:
        "Eén ontwikkelaar, twaalf jaar ervaring, sinds drie jaar vanuit Costa Brava. Geen accountmanagers — direct contact met de developer die jouw systeem bouwt en blijft onderhouden.",
    },
    prijzen: {
      title: "Heldere prijzen",
      description:
        "Care-abonnementen vanaf €99/m, Build-projecten vanaf €499 setup. Maandelijks opzegbaar, eerste maand gratis, 15% korting bij jaarbetaling. Geen meerwerk-facturen.",
    },
    contact: {
      title: "Plan een gesprek",
      description:
        "Eerste gesprek is gratis — dertig minuten, geen pitch-deck, geen verkooppraat. Alleen een eerlijk advies of, en hoe, we elkaar kunnen helpen.",
    },
    status: {
      title: "Live status",
      description: "Live uptime van Webstability-services. Realtime-data, ververst elke minuut.",
    },
    garanties: {
      title: "Garanties",
      description:
        "Wat ik nooit doe: geen portfolio zonder toestemming, geen data-retentie na afloop, geen sub-processors zonder melding, geen vendor lock-in.",
    },
    blog: {
      title: "Blog",
      description:
        "Artikelen over verhuursoftware, integrale systemen en MKB-tech vanuit Costa Brava. Praktisch, eerlijk, gericht op ondernemers.",
    },
    privacy: {
      title: "Privacy",
      description: "Hoe Webstability omgaat met je persoonsgegevens. AVG/GDPR-conform, EU-hosted.",
    },
    avisoLegal: {
      title: "Aviso legal",
      description: "Wettelijke kennisgeving voor de Spaanse markt. KvK + NIF + Webstability BV.",
    },
  },
  es: {
    home: {
      title: "El sistema bajo tu empresa",
      description:
        "Construimos el sistema completo bajo tu empresa — web pública, reservas online, tu panel de admin, todo integrado. Desde Costa Brava para pymes en Países Bajos y España.",
    },
    verhuur: {
      title: "Software para empresas de alquiler",
      description:
        "Acaba con las reservas duplicadas entre Airbnb, Booking y tu Excel. Un dashboard, facturas automáticas, contratos en un clic. Software a medida para alquiler de caravanas, barcos, casas.",
    },
    diensten: {
      title: "Servicios — qué construimos para ti",
      description:
        "Plataforma de alquiler o reparación desde 7.800 €. Tienda online a medida desde 3.000 €. Suscripciones Care y crecimiento desde 69 €/m. Un sistema que funciona, un Laurens que lo mantiene.",
    },
    aanvragen: {
      title: "Solicita tu web o tienda online",
      description:
        "Configura tu web o tienda online — tipo, número de páginas, estilo, idiomas, opciones — y ve el precio orientativo al instante. Después una charla breve para el presupuesto definitivo. Precio fijo, cuatro semanas.",
    },
    faq: {
      title: "Preguntas frecuentes",
      description:
        "Cuánto cuesta un sistema de reservas o portal de cliente a medida, cuánto tarda, a medida vs SaaS, y cómo trabajo. Las preguntas que más recibo, respondidas de antemano.",
    },
    cases: {
      title: "Casos y proyectos",
      description:
        "Plataformas propias y casos de cliente que muestran la diferencia entre un sistema integrado y cinco herramientas sueltas — menos puzzles de Excel, más horas de vuelta cada semana.",
    },
    caseCaravanverhuur: {
      title: "Caravanverhuurspanje — plataforma de alquiler en 4 semanas",
      description:
        "Cómo un alquilador neerlandés con 12 caravanas y 4 mobile-homes en la Costa Brava pasó de Excel + reservas duplicadas a una plataforma integrada — precio fijo, entrega en cuatro semanas.",
    },
    caseCaravanreparatie: {
      title: "Caravanreparatiespanje — portal de reparación para el taller",
      description:
        "Del parte de trabajo en papel al flujo en iPad: los clientes lo notifican online, la orden llega directa al taller, los mecánicos actualizan el estado mientras trabajan. ~80 reparaciones al mes, sin papel.",
    },
    over: {
      title: "Sobre Laurens",
      description:
        "Un desarrollador, doce años de experiencia, desde hace tres años en Costa Brava. Sin gestores de cuenta — hablas directamente con el dev que construye y mantiene tu sistema.",
    },
    prijzen: {
      title: "Precios claros",
      description:
        "Care desde 99 €/m, Build desde 499 € setup. Cancelable mensualmente, primer mes gratis, 15% de descuento con pago anual. Sin facturas sorpresa por horas extra.",
    },
    contact: {
      title: "Reservar primera llamada",
      description:
        "La primera llamada es gratis — treinta minutos, sin presentación comercial. Solo un consejo honesto sobre si, y cómo, podemos ayudarnos.",
    },
    status: {
      title: "Estado en vivo",
      description:
        "Uptime en vivo de los servicios de Webstability. Datos en tiempo real, actualizados cada minuto.",
    },
    garanties: {
      title: "Garantías",
      description:
        "Lo que nunca hago: sin portfolio sin permiso, sin retención de datos tras finalizar, sin subprocesadores sin avisar, sin vendor lock-in.",
    },
    blog: {
      title: "Blog",
      description:
        "Artículos sobre software de alquiler, sistemas integrados y tech para pymes desde Costa Brava. Práctico, honesto, dirigido a empresarios.",
    },
    privacy: {
      title: "Privacidad",
      description:
        "Cómo Webstability gestiona tus datos personales. Conforme a RGPD, alojado en la UE.",
    },
    avisoLegal: {
      title: "Aviso legal",
      description: "Aviso legal para el mercado español. KvK + NIF + Webstability BV.",
    },
  },
};

const SITE_BASE_URL = process.env.AUTH_URL ?? "https://webstability.eu";

/**
 * Schema.org Organization payload — emit once on the homepage so
 * Google knows the brand entity (name, URL, logo, contact). Reused
 * across locales (lang fragment per page).
 */
export function organizationLd(locale: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Webstability",
    url: SITE_BASE_URL,
    logo: `${SITE_BASE_URL}/og`,
    sameAs: [],
    founder: {
      "@type": "Person",
      name: "Laurens Bos",
    },
    address: {
      "@type": "PostalAddress",
      addressRegion: "Costa Brava",
      addressCountry: "ES",
    },
    contactPoint: {
      "@type": "ContactPoint",
      email: "hello@webstability.eu",
      contactType: "customer support",
      availableLanguage: ["nl", "es", "en"],
    },
    inLanguage: locale === "es" ? "es-ES" : "nl-NL",
  };
}

const SERVICE_TYPES_NL = [
  "Verhuursoftware",
  "Boekingssysteem",
  "Klantportaal",
  "Maatwerk software",
  "Webshop ontwikkeling",
];
const SERVICE_TYPES_ES = [
  "Software de alquiler",
  "Sistema de reservas",
  "Portal de cliente",
  "Software a medida",
  "Desarrollo de tiendas online",
];

/**
 * Schema.org LocalBusiness / ProfessionalService payload — emit op de
 * homepage zodat Google de lokale dienstverlener-entiteit kent (adres,
 * service-area NL+ES, prijsklasse, talen). Vult de Organization-schema
 * aan; samen geven ze een vollere knowledge-graph.
 */
export function localBusinessLd(locale: string) {
  const isEs = locale === "es";
  return {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "ProfessionalService"],
    name: "Webstability",
    url: SITE_BASE_URL,
    image: `${SITE_BASE_URL}/og`,
    logo: `${SITE_BASE_URL}/og`,
    priceRange: "€€",
    email: "hello@webstability.eu",
    founder: { "@type": "Person", name: "Laurens Bos" },
    address: {
      "@type": "PostalAddress",
      streetAddress: "Carrer Major",
      addressLocality: "Begur",
      addressRegion: "Girona",
      postalCode: "17255",
      addressCountry: "ES",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 41.954,
      longitude: 3.207,
    },
    areaServed: [
      { "@type": "Country", name: "Netherlands" },
      { "@type": "Country", name: "Spain" },
    ],
    knowsLanguage: ["nl", "es", "en"],
    serviceType: isEs ? SERVICE_TYPES_ES : SERVICE_TYPES_NL,
    inLanguage: isEs ? "es-ES" : "nl-NL",
  };
}

/**
 * Schema.org FAQPage payload — emit op pagina's met een FAQ-blok zodat
 * de vragen rich results kunnen worden. `items` is een lijst van
 * { q, a }; antwoorden mogen platte tekst zijn.
 */
export function faqPageLd(items: Array<{ q: string; a: string }>, locale: string) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: locale === "es" ? "es-ES" : "nl-NL",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

/**
 * Schema.org BreadcrumbList payload — emit op detail-pagina's (cases,
 * blog-posts, verticaal-pagina's) zodat Google de breadcrumb-trail in
 * de SERP toont. `items` is een geordende lijst van { name, url }
 * (absolute URLs); de laatste is de huidige pagina.
 */
export function breadcrumbLd(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Schema.org Service payload — emit op dienst-pagina's (/diensten,
 * /verhuur, verticaal-pagina's) zodat Google de dienst koppelt aan de
 * provider + service-area.
 */
export function serviceLd({
  name,
  description,
  locale,
  url,
}: {
  name: string;
  description: string;
  locale: string;
  url?: string;
}) {
  const isEs = locale === "es";
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name,
    description,
    ...(url ? { url } : {}),
    serviceType: isEs ? SERVICE_TYPES_ES : SERVICE_TYPES_NL,
    provider: {
      "@type": "Organization",
      name: "Webstability",
      url: SITE_BASE_URL,
    },
    areaServed: [
      { "@type": "Country", name: "Netherlands" },
      { "@type": "Country", name: "Spain" },
    ],
    inLanguage: isEs ? "es-ES" : "nl-NL",
  };
}

/**
 * Helper: bouwt een absolute URL voor een breadcrumb-item. NL = geen
 * prefix, ES = /es-prefix (paden komen 1-op-1 overeen met routing.ts).
 */
export function siteUrl(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_BASE_URL}${clean}`;
}

/**
 * Schema.org Person payload voor Laurens — emit op /over zodat Google
 * de persoon achter het merk kent (founder, jobTitle, worksFor,
 * knowsAbout). Versterkt de Organization/LocalBusiness-entiteit.
 */
export function personLd(locale: string) {
  const isEs = locale === "es";
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Laurens Bos",
    url: siteUrl(isEs ? "/es/sobre" : "/over"),
    image: "https://u.cubeupload.com/laurensbos/fc7278a70fe64fb6aa6a.jpg",
    jobTitle: isEs ? "Desarrollador & fundador" : "Developer & founder",
    worksFor: {
      "@type": "Organization",
      name: "Webstability",
      url: SITE_BASE_URL,
    },
    knowsLanguage: ["nl", "es", "en"],
    knowsAbout: isEs
      ? [
          "Software de alquiler",
          "Sistemas de reservas",
          "Software a medida",
          "Desarrollo web",
          "Next.js",
        ]
      : ["Verhuursoftware", "Boekingssystemen", "Maatwerk software", "Webontwikkeling", "Next.js"],
    address: {
      "@type": "PostalAddress",
      addressLocality: "Begur",
      addressRegion: "Girona",
      addressCountry: "ES",
    },
  };
}

/**
 * Schema.org BlogPosting payload — emit on every blog detail page so
 * the post can light up rich results (date, author, headline).
 */
export function blogPostingLd({
  locale,
  slug,
  title,
  description,
  date,
  author,
}: {
  locale: string;
  slug: string;
  title: string;
  description: string;
  date: string;
  author: string;
}) {
  const url =
    locale === "nl" ? `${SITE_BASE_URL}/blog/${slug}` : `${SITE_BASE_URL}/${locale}/blog/${slug}`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description,
    datePublished: date,
    dateModified: date,
    author: {
      "@type": "Person",
      name: author,
    },
    publisher: {
      "@type": "Organization",
      name: "Webstability",
      logo: { "@type": "ImageObject", url: `${SITE_BASE_URL}/og` },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    inLanguage: locale === "es" ? "es-ES" : "nl-NL",
  };
}

/**
 * Per-locale paden voor elke route. NL is de canonical (geen prefix),
 * ES krijgt vertaalde slugs. Komt overeen met `i18n/routing.ts`
 * `pathnames`. Wijzigt daar iets, dan ook hier aanpassen.
 */
const ROUTE_PATHS: Record<RouteKey, { nl: string; es: string }> = {
  home: { nl: "/", es: "/es" },
  verhuur: { nl: "/verhuur", es: "/es/alquiler" },
  diensten: { nl: "/diensten", es: "/es/servicios" },
  aanvragen: { nl: "/aanvragen", es: "/es/solicitar" },
  faq: { nl: "/faq", es: "/es/preguntas" },
  cases: { nl: "/cases", es: "/es/cases" },
  caseCaravanverhuur: {
    nl: "/cases/caravanverhuurspanje",
    es: "/es/cases/caravanverhuurspanje",
  },
  caseCaravanreparatie: {
    nl: "/cases/caravanreparatiespanje",
    es: "/es/cases/caravanreparatiespanje",
  },
  over: { nl: "/over", es: "/es/sobre" },
  prijzen: { nl: "/prijzen", es: "/es/precios" },
  contact: { nl: "/contact", es: "/es/contacto" },
  status: { nl: "/status", es: "/es/estado" },
  garanties: { nl: "/garanties", es: "/es/garantias" },
  blog: { nl: "/blog", es: "/es/blog" },
  privacy: { nl: "/privacy", es: "/es/privacidad" },
  avisoLegal: { nl: "/aviso-legal", es: "/es/aviso-legal" },
};

/**
 * Strategische og-eyebrow per pagina. De `/og`-route rendert een hero-card
 * met `?title=` + `?eyebrow=` als parameters; standaard is "costa brava ·
 * spanje", maar voor verhuur/prijzen/cases willen we de wig zichtbaar
 * maken op LinkedIn/X-shares. Geen entry hier = generieke eyebrow.
 */
const OG_EYEBROW: Partial<Record<RouteKey, { nl: string; es: string }>> = {
  verhuur: {
    nl: "voor verhuurbedrijven · NL+ES",
    es: "para empresas de alquiler · NL+ES",
  },
  prijzen: {
    nl: "vaste prijs · 4 weken levering",
    es: "precio fijo · entrega en 4 semanas",
  },
  cases: {
    nl: "3 verhuurplatforms · 47 werkplaatsen",
    es: "3 plataformas alquiler · 47 talleres",
  },
  caseCaravanverhuur: {
    nl: "verhuurplatform · 4 weken · live sinds 2024",
    es: "plataforma alquiler · 4 semanas · activo desde 2024",
  },
};

function ogImageUrl(title: string, eyebrow: string | null): string {
  const params = new URLSearchParams({ title });
  if (eyebrow) params.set("eyebrow", eyebrow);
  return `${SITE_BASE_URL}/og?${params.toString()}`;
}

export function pageMetadata(locale: string, key: RouteKey): Metadata {
  const lang: Locale = locale === "es" ? "es" : "nl";
  const copy = COPY[lang][key];
  const paths = ROUTE_PATHS[key];
  const canonicalPath = paths[lang];
  const canonical = `${SITE_BASE_URL}${canonicalPath}`;
  const eyebrow = OG_EYEBROW[key]?.[lang] ?? null;
  const ogImage = ogImageUrl(copy.title, eyebrow);
  return {
    title: copy.title,
    description: copy.description,
    alternates: {
      canonical,
      languages: {
        nl: `${SITE_BASE_URL}${paths.nl}`,
        es: `${SITE_BASE_URL}${paths.es}`,
        "x-default": `${SITE_BASE_URL}${paths.nl}`,
      },
    },
    openGraph: {
      title: `${copy.title} · Webstability`,
      description: copy.description,
      locale: lang === "es" ? "es_ES" : "nl_NL",
      type: "website",
      url: canonical,
      images: [{ url: ogImage, width: 1200, height: 630, alt: copy.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${copy.title} · Webstability`,
      description: copy.description,
      images: [ogImage],
    },
  };
}
