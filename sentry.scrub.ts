import type { ErrorEvent } from "@sentry/nextjs";

/**
 * PII-scrubber voor Sentry events. Verwijdert e-mailadres, IP en
 * cookies uit de payload zodat we GDPR-conform foutmeldingen kunnen
 * loggen zonder identificeerbare gegevens te bewaren.
 *
 * Wordt door `sentry.{client,server,edge}.config.ts` als `beforeSend`
 * toegepast.
 */
export function scrubPii(event: ErrorEvent): ErrorEvent | null {
  // User-object: email + ip_address strippen, alleen anon id behouden
  if (event.user) {
    const { id } = event.user;
    event.user = id ? { id } : undefined;
  }

  // Request headers/cookies opschonen
  if (event.request) {
    if (event.request.cookies) event.request.cookies = undefined;
    if (event.request.headers) {
      const headers = { ...event.request.headers } as Record<string, string>;
      delete headers.cookie;
      delete headers.authorization;
      delete headers["x-forwarded-for"];
      delete headers["x-real-ip"];
      event.request.headers = headers;
    }
    // Request-body kan POST-form data bevatten — niet loggen.
    if (event.request.data) event.request.data = "[scrubbed]";
  }

  // Server-name kan host-info bevatten — strip het
  if (event.server_name) event.server_name = undefined;

  return event;
}
