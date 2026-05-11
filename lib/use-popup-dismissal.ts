"use client";

import * as React from "react";

const KEY_PREFIX = "ws_popup_";

/**
 * Houdt bij of een popup recent gezien/gedismissd is via localStorage.
 * `suppressed` is `true` als de popup binnen `cooldownDays` al getoond
 * is, óf tijdens SSR / vóór hydratie (we tonen niets tot we client-side
 * hebben kunnen lezen). `markSeen()` slaat het huidige tijdstip op.
 *
 * De localStorage-read gebeurt eenmalig in een mount-effect — dit is de
 * standaard "sync met external state"-uitzondering op de set-state-in-
 * effect-regel; vandaar de gerichte eslint-disable.
 */
export function usePopupDismissal(
  id: string,
  cooldownDays: number,
): { suppressed: boolean; markSeen: () => void } {
  const [suppressed, setSuppressed] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    try {
      const raw = window.localStorage.getItem(`${KEY_PREFIX}${id}`);
      let isSuppressed = false;
      if (raw) {
        const seenAt = Number(raw);
        if (Number.isFinite(seenAt)) {
          const cooldownMs = cooldownDays * 24 * 60 * 60 * 1000;
          isSuppressed = Date.now() - seenAt < cooldownMs;
        }
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot sync from localStorage on mount
      if (active) setSuppressed(isSuppressed);
    } catch {
      if (active) setSuppressed(false);
    }
    return () => {
      active = false;
    };
  }, [id, cooldownDays]);

  const markSeen = React.useCallback(() => {
    try {
      window.localStorage.setItem(`${KEY_PREFIX}${id}`, String(Date.now()));
    } catch {
      // noop
    }
    setSuppressed(true);
  }, [id]);

  return { suppressed, markSeen };
}
