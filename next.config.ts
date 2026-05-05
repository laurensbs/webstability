import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // Phase 1: keep config minimal. Image domains, security headers etc. land in Phase 2.
};

const intlWrapped = withNextIntl(nextConfig);

// Only wrap with Sentry when a DSN is set; otherwise don't pull in source-map upload.
export default process.env.SENTRY_DSN
  ? withSentryConfig(intlWrapped, {
      silent: true,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,
      widenClientFileUpload: true,
      disableLogger: true,
    })
  : intlWrapped;
