// Next 16 renamed `middleware.ts` to `proxy.ts` (same edge function, clearer name).
// next-intl ships its handler under the legacy `middleware` export — that name
// refers to the export itself, not the Next file convention, so we keep using it.
//
// Auth gating on /portal/* lives in app/[locale]/portal/layout.tsx instead of here:
// the Drizzle adapter is Node-only and can't run in the edge proxy.
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  matcher: ["/((?!api|og|_next|_vercel|.*\\..*).*)"],
};
