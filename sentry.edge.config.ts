import * as Sentry from "@sentry/nextjs";
import { scrubPii } from "./sentry.scrub";

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.1,
    enabled: process.env.NODE_ENV === "production",
    sendDefaultPii: false,
    beforeSend: scrubPii,
  });
}
