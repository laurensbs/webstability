"use client";

import * as React from "react";

/**
 * Broadcast naar andere tabs dat deze sessie geverifieerd is.
 *
 * Wordt gemount bij eerste paint van /portal/dashboard. Een eventuele
 * /verify tab in een andere window van dezelfde browser luistert hierop
 * en navigeert zelf door — zo voelt de magic-link flow naadloos zonder
 * dat de user terug hoeft te schakelen.
 */
export function AuthVerifiedBeacon() {
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const bc = new BroadcastChannel("webstability-auth");
      bc.postMessage({ type: "verified", at: Date.now() });
      bc.close();
    } catch {
      // BroadcastChannel niet ondersteund — geen alternatief nodig,
      // verify-tab heeft een visibilitychange-fallback.
    }
  }, []);
  return null;
}
