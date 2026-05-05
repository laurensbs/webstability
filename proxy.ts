// Next 16 renamed `middleware.ts` to `proxy.ts` (same edge function, clearer name).
// next-intl ships its handler under the legacy `middleware` export — that name
// refers to the export itself, not the Next file convention, so we keep using it.
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Run on every path except Next internals, API routes, and static assets.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
