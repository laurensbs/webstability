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
    "/diensten": {
      nl: "/diensten",
      es: "/servicios",
    },
    "/cases": "/cases",
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
    "/checkout/done": "/checkout/done",
    "/portal/dashboard": "/portal/dashboard",
    "/portal/projects": "/portal/projects",
    "/portal/tickets": "/portal/tickets",
    "/portal/invoices": "/portal/invoices",
    "/portal/settings": "/portal/settings",
    "/portal/monitoring": "/portal/monitoring",
    "/portal/seo": "/portal/seo",
    "/portal/files": "/portal/files",
    "/portal/team": "/portal/team",
    "/admin": "/admin",
    "/admin/orgs": "/admin/orgs",
    "/admin/orgs/[orgId]": "/admin/orgs/[orgId]",
    "/admin/orgs/new": "/admin/orgs/new",
    "/admin/tickets": "/admin/tickets",
    "/admin/team": "/admin/team",
  },
});

export type Locale = (typeof routing.locales)[number];
