import * as Sentry from "@sentry/nextjs";

// Next.js calls this file at startup. We use it to load Sentry's
// server/edge configs depending on runtime.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
