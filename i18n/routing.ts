import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["nl", "es"] as const,
  defaultLocale: "nl",
  // NL has no prefix; ES is served from /es/...
  localePrefix: "as-needed",

  // Translated slugs: each route lives at a different path per locale.
  // Add new pages here as Phase 2 builds them out.
  pathnames: {
    "/": "/",
    "/over": {
      nl: "/over",
      es: "/sobre",
    },
    "/prijzen": {
      nl: "/prijzen",
      es: "/precios",
    },
    "/contact": {
      nl: "/contact",
      es: "/contacto",
    },
    "/verhuur": {
      nl: "/verhuur",
      es: "/alquiler",
    },
    "/status": {
      nl: "/status",
      es: "/estado",
    },
    "/garanties": {
      nl: "/garanties",
      es: "/garantias",
    },
    "/aviso-legal": "/aviso-legal",
    "/privacy": {
      nl: "/privacy",
      es: "/privacidad",
    },
    "/blog": "/blog",
    "/login": "/login",
    "/verify": "/verify",
  },
});

export type Locale = (typeof routing.locales)[number];
