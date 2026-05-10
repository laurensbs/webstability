import type { MetadataRoute } from "next";

const BASE_URL = process.env.AUTH_URL ?? "https://webstability.eu";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/portal/", "/admin/", "/login", "/verify", "/strategie"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
