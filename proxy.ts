// Next 16 renamed `middleware.ts` to `proxy.ts` (same edge function, clearer name).
// next-intl ships its handler under the legacy `middleware` export — that name
// refers to the export itself, not the Next file convention, so we keep using it.
//
// Auth gating on /portal/* lives in app/[locale]/portal/layout.tsx instead of here:
// the Drizzle adapter is Node-only and can't run in the edge proxy.
import { NextResponse, NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlProxy = createMiddleware(routing);

// Marketing/portal/admin all live on the same Next app. We expose
// /admin behind admin.webstability.eu by rewriting the URL pathname
// before next-intl runs. The browser keeps the subdomain in the bar.
//
// Inversely, /admin on the apex/www host redirects to the subdomain
// so there's a single canonical entry point to the staff portal.
const ADMIN_HOSTS = new Set(["admin.webstability.eu", "admin.localhost", "admin.localhost:3000"]);

function isAdminHost(host: string | null) {
  if (!host) return false;
  return ADMIN_HOSTS.has(host.toLowerCase());
}

export default function proxy(req: NextRequest) {
  const host = req.headers.get("host");
  const url = req.nextUrl;

  if (isAdminHost(host)) {
    // Already on admin host. If the URL accidentally already has the
    // /admin prefix (someone bookmarked admin.webstability.eu/admin),
    // strip it so we don't double-prefix on the rewrite.
    const stripped = url.pathname.replace(/^\/(nl|es)\/admin/, "/$1").replace(/^\/admin/, "");
    if (stripped !== url.pathname) {
      const clean = req.nextUrl.clone();
      clean.pathname = stripped || "/";
      return NextResponse.redirect(clean);
    }

    // Rewrite path → /admin{path} (or /{locale}/admin{path}) so the
    // app/[locale]/admin tree handles the request. next-intl is run
    // on the rewritten URL via the helper below.
    const rewritten = req.nextUrl.clone();
    rewritten.pathname = `/admin${url.pathname === "/" ? "" : url.pathname}`;
    const rewriteReq = new NextRequest(rewritten, req);
    return intlProxy(rewriteReq);
  }

  // Apex / www. Block /admin paths so the staff portal has one canonical home.
  if (url.pathname === "/admin" || url.pathname.startsWith("/admin/")) {
    const target = new URL(`https://admin.webstability.eu${url.pathname}${url.search}`);
    return NextResponse.redirect(target);
  }
  if (/^\/(nl|es)\/admin(\/|$)/.test(url.pathname)) {
    const stripped = url.pathname.replace(/^\/(nl|es)/, "");
    const target = new URL(`https://admin.webstability.eu${stripped}${url.search}`);
    return NextResponse.redirect(target);
  }

  return intlProxy(req);
}

export const config = {
  matcher: ["/((?!api|og|_next|_vercel|.*\\..*).*)"],
};
