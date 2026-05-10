"use client";

import * as React from "react";

type Kind = "entered" | "tour_completed" | "tour_dismissed" | "cta_clicked" | "session_ended";

/**
 * Fire-and-forget analytics beacon. Mount op een page om bij eerste
 * paint een event te registreren. Voor bv. /portal/dashboard met
 * `kind="entered" role="portal" source="hero"`.
 *
 * Geen retry — als de fetch faalt is dat OK, het is alleen funnel-data.
 */
export function DemoAnalyticsBeacon({
  kind,
  source,
  role,
}: {
  kind: Kind;
  source?: string;
  role?: "portal" | "admin";
}) {
  const firedRef = React.useRef(false);

  React.useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    // navigator.sendBeacon is ideaal — fire-and-forget zelfs bij page
    // unload. Fallback naar fetch als sendBeacon niet beschikbaar.
    const payload = JSON.stringify({ kind, source, role });
    try {
      if ("sendBeacon" in navigator) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon("/api/analytics/demo-event", blob);
      } else {
        void fetch("/api/analytics/demo-event", {
          method: "POST",
          body: payload,
          headers: { "content-type": "application/json" },
          keepalive: true,
        });
      }
    } catch {
      // noop — analytics mag niet de page-render breken.
    }
  }, [kind, source, role]);

  return null;
}

/**
 * Helper hook om een event te firen vanuit een onClick handler.
 */
export function useFireDemoEvent() {
  return React.useCallback((kind: Kind, source?: string, role?: "portal" | "admin") => {
    const payload = JSON.stringify({ kind, source, role });
    try {
      if ("sendBeacon" in navigator) {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon("/api/analytics/demo-event", blob);
      } else {
        void fetch("/api/analytics/demo-event", {
          method: "POST",
          body: payload,
          headers: { "content-type": "application/json" },
          keepalive: true,
        });
      }
      // Broadcast voor de DemoFollowUpModal — luistert op cta_clicked
      // om de email-vraag te tonen. Geen prop-drilling nodig zo.
      if (kind === "cta_clicked") {
        window.dispatchEvent(new CustomEvent("demo-cta-clicked", { detail: { source, role } }));
      }
    } catch {
      // noop
    }
  }, []);
}
