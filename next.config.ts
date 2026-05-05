import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  // Phase 1: keep config minimal. Image domains, security headers etc. land in Phase 2.
};

export default withNextIntl(nextConfig);
