"use client";

import * as React from "react";

/**
 * Root error-boundary — vangt fouten in de root-layout zelf op. Rendert z'n
 * eigen <html>/<body> (de normale layout is dan onbruikbaar) en gebruikt geen
 * next-intl/Tailwind-afhankelijkheden: pure inline styles in de brand-kleuren
 * zodat dit ook werkt als het CSS-bundle niet geladen is. Bewust kaal — dit
 * mag bijna nooit afgaan; doel is alleen geen witte/Next-default-pagina.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    if (typeof console !== "undefined") console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="nl">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f0e8",
          color: "#1f1b16",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
          padding: "1.5rem",
        }}
      >
        <div style={{ maxWidth: 480, textAlign: "center" }}>
          <p
            style={{
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#c9614f",
              margin: "0 0 1rem",
            }}
          >
            {"// "}er ging iets mis
          </p>
          <h1
            style={{
              fontFamily: "Georgia, ui-serif, serif",
              fontWeight: 400,
              fontSize: 32,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              margin: "0 0 0.75rem",
            }}
          >
            Er ging iets mis.
          </h1>
          <p style={{ color: "#6b645a", fontSize: 16, lineHeight: 1.6, margin: "0 0 1.5rem" }}>
            Sentry heeft Laurens al een melding gestuurd. Probeer het opnieuw — werkt het nog niet,
            mail dan gerust naar hello@webstability.eu.
          </p>
          {error.digest ? (
            <p
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: 11,
                color: "#6b645a",
                margin: "0 0 1.5rem",
              }}
            >
              {"// "}error: {error.digest}
            </p>
          ) : null}
          <button
            onClick={reset}
            style={{
              appearance: "none",
              border: 0,
              borderRadius: 999,
              padding: "0.7rem 1.4rem",
              background: "#c9614f",
              color: "#fff",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Opnieuw proberen
          </button>
        </div>
      </body>
    </html>
  );
}
