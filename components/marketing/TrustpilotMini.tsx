"use client";

import * as React from "react";

/**
 * Trustpilot Mini-widget (compact horizontal badge).
 *
 * Het Trustpilot bootstrap-script (geladen in app/[locale]/layout.tsx via
 * next/script) detecteert elementen met className "trustpilot-widget" en
 * vervangt de inhoud door de live widget — een TrustScore + sterren +
 * "Op X reviews" + click-through naar de profielpagina.
 *
 * Belangrijk: zonder geldige `data-businessunit-id` toont het script
 * niets en valt hij stil terug op de fallback-link binnen de div. Vraag
 * je business-id op in het Trustpilot Business dashboard onder
 * Showcase → Get the code (zie hier: https://support.trustpilot.com).
 *
 * Re-render guard: het Trustpilot script muteert de DOM directly. Bij
 * client-side route changes moeten we 'm opnieuw laten initialiseren,
 * anders blijft het oude rendering staan of komt er niets. We doen dat
 * via window.Trustpilot?.loadFromElement op mount.
 */

const BUSINESSUNIT_ID = "TODO_TRUSTPILOT_BUSINESSUNIT_ID";
const TEMPLATE_ID_MINI = "53aa8807dec7e10d38f59f32"; // standaard Mini-template
const PROFILE_URL = "https://nl.trustpilot.com/review/webstability.nl";

type TrustpilotApi = {
  loadFromElement?: (el: Element, force?: boolean) => void;
};
declare global {
  interface Window {
    Trustpilot?: TrustpilotApi;
  }
}

export function TrustpilotMini({
  locale = "nl-NL",
  className,
}: {
  locale?: "nl-NL" | "es-ES";
  className?: string;
}) {
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!ref.current) return;
    // Ondersteun async-laden van het bootstrap script: probeer nu, daarna
    // poll twee keer met korte interval voor het geval het script later
    // beschikbaar komt (rate-limited connectie etc).
    const tryInit = () => {
      if (ref.current && window.Trustpilot?.loadFromElement) {
        window.Trustpilot.loadFromElement(ref.current, true);
        return true;
      }
      return false;
    };
    if (tryInit()) return;
    const t1 = window.setTimeout(tryInit, 600);
    const t2 = window.setTimeout(tryInit, 1500);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`trustpilot-widget ${className ?? ""}`}
      data-locale={locale}
      data-template-id={TEMPLATE_ID_MINI}
      data-businessunit-id={BUSINESSUNIT_ID}
      data-style-height="24px"
      data-style-width="100%"
      data-theme="light"
    >
      {/* Fallback voor wanneer JS uit staat / script blokkeert */}
      <a href={PROFILE_URL} target="_blank" rel="noopener noreferrer">
        Trustpilot
      </a>
    </div>
  );
}
