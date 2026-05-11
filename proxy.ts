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
    // Auth-related routes are shared across hosts and live at their
    // own top-level paths. Don't rewrite them — let next-intl serve
    // /login, /verify, /api/auth/... as-is on the admin host too.
    const isAuthRoute =
      url.pathname === "/login" ||
      url.pathname.startsWith("/login/") ||
      url.pathname === "/verify" ||
      url.pathname.startsWith("/verify/") ||
      /^\/(nl|es)\/(login|verify)(\/|$)/.test(url.pathname) ||
      url.pathname.startsWith("/api/auth");

    // /demo/* routes mogen óók op admin-host bestaan zonder dat ze
    // gerewrite worden naar /admin/demo/*. Demo-portal moet apex-routing
    // krijgen zodat /portal/* daarna correct rendert.
    const isDemoRoute =
      url.pathname.startsWith("/demo/") || /^\/(nl|es)\/demo\//.test(url.pathname);

    if (isAuthRoute || isDemoRoute) return intlProxy(req);

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

  // /strategie is een privé top-level route buiten next-intl. Geen locale-
  // prefix, geen alternates, geen sitemap. Handler in app/strategie/ regelt
  // de wachtwoord-gate zelf.
  if (url.pathname === "/strategie" || url.pathname.startsWith("/strategie/")) {
    return NextResponse.next();
  }

  // /refer/[code] — bezoeker komt via een referral-link binnen. Zet een
  // 30-dagen cookie met de code zodat de Stripe-checkout 'm later kan
  // oppikken, en laat next-intl de pagina daarna serveren. Cookie wordt
  // hier gezet (proxy = enige plek waar het kan vóór de page-render).
  const referMatch = url.pathname.match(/^\/(?:nl\/|es\/)?refer\/([A-Za-z0-9]{4,32})$/);
  if (referMatch) {
    const code = referMatch[1]!;
    const res = intlProxy(req);
    res.cookies.set("ws_ref", code, {
      maxAge: 30 * 24 * 60 * 60,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });
    return res;
  }

  // Voeg `x-pathname` header toe voor de portal-layout die wil weten of
  // de huidige route /portal/intake is (om de gate-redirect te voorkomen).
  // Edge-runtime kan geen DB lezen, dus de daadwerkelijke gate-logica zit
  // in de layout zelf — we leveren alleen het pad aan.
  if (
    url.pathname === "/portal" ||
    url.pathname.startsWith("/portal/") ||
    /^\/(nl|es)\/portal(\/|$)/.test(url.pathname)
  ) {
    const reqHeaders = new Headers(req.headers);
    reqHeaders.set("x-pathname", url.pathname);
    return intlProxy(new NextRequest(req.nextUrl, { ...req, headers: reqHeaders }));
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
