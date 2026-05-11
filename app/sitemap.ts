import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { listPosts } from "@/lib/blog";
import { VERTICAL_SLUGS } from "@/lib/verticals";

const BASE_URL = process.env.AUTH_URL ?? "https://webstability.eu";

// Map internal pathname (NL canonical) → per-locale URL path.
// Mirrors the pathnames defined in i18n/routing.ts.
const STATIC_PATHS: Record<string, { nl: string; es: string }> = {
  "/": { nl: "/", es: "/es" },
  "/verhuur": { nl: "/verhuur", es: "/es/alquiler" },
  "/diensten": { nl: "/diensten", es: "/es/servicios" },
  "/faq": { nl: "/faq", es: "/es/preguntas" },
  "/cases": { nl: "/cases", es: "/es/cases" },
  "/cases/caravanverhuurspanje": {
    nl: "/cases/caravanverhuurspanje",
    es: "/es/cases/caravanverhuurspanje",
  },
  "/over": { nl: "/over", es: "/es/sobre" },
  "/prijzen": { nl: "/prijzen", es: "/es/precios" },
  "/contact": { nl: "/contact", es: "/es/contacto" },
  "/status": { nl: "/status", es: "/es/estado" },
  "/garanties": { nl: "/garanties", es: "/es/garantias" },
  "/privacy": { nl: "/privacy", es: "/es/privacidad" },
  "/aviso-legal": { nl: "/aviso-legal", es: "/es/aviso-legal" },
  "/blog": { nl: "/blog", es: "/es/blog" },
};

// Verticaal-pagina's onder /diensten/[vertical] (ES: /servicios/[vertical]).
// Slug-segment is gelijk in beide locales.
for (const slug of VERTICAL_SLUGS) {
  STATIC_PATHS[`/diensten/${slug}`] = {
    nl: `/diensten/${slug}`,
    es: `/es/servicios/${slug}`,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  for (const paths of Object.values(STATIC_PATHS)) {
    entries.push({
      url: `${BASE_URL}${paths.nl}`,
      alternates: {
        languages: {
          nl: `${BASE_URL}${paths.nl}`,
          es: `${BASE_URL}${paths.es}`,
          "x-default": `${BASE_URL}${paths.nl}`,
        },
      },
      changeFrequency: "weekly",
      priority: paths.nl === "/" ? 1 : 0.7,
    });
  }

  for (const locale of routing.locales) {
    const posts = await listPosts(locale);
    for (const post of posts) {
      const prefix = locale === "nl" ? "" : `/${locale}`;
      entries.push({
        url: `${BASE_URL}${prefix}/blog/${post.slug}`,
        lastModified: new Date(post.date),
        changeFrequency: "monthly",
        priority: 0.5,
      });
    }
  }

  return entries;
}
