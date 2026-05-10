import path from "node:path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { withSentryConfig } from "@sentry/nextjs";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // Pin Turbopack root: a stray pnpm-lock.yaml in /Users/laurens makes
  // Next infer the home dir as workspace root, which breaks resolving
  // tailwindcss + breaks CSS in Server Components renders.
  turbopack: {
    root: path.resolve(__dirname),
  },
  // External image hosts we trust for founder/case-study assets. Add
  // sparingly — every host extends the allow-list for `next/image`.
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "u.cubeupload.com",
        pathname: "/laurensbos/**",
      },
    ],
  },
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
