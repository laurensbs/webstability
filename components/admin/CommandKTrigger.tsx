"use client";

import { Search } from "lucide-react";

/**
 * Search-pill in de admin-topbar die de gebruiker uitnodigt cmd+K te
 * gebruiken. Klik dispatcht ook een synthetisch keyboard-event zodat
 * dezelfde palette opent.
 */
export function CommandKTrigger({ placeholder }: { placeholder: string }) {
  function handleClick() {
    const event = new KeyboardEvent("keydown", {
      key: "k",
      metaKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);
  }

  // Detecteer mac vs windows voor de juiste keyboard-symbol.
  const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
  const modKey = isMac ? "⌘" : "Ctrl";

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group flex w-full max-w-md items-center gap-2 rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-1.5 text-[13px] text-(--color-muted) transition-colors hover:border-(--color-accent)/40 hover:text-(--color-text)"
    >
      <Search className="h-3.5 w-3.5 shrink-0" />
      <span className="flex-1 truncate text-left">{placeholder}</span>
      <kbd className="hidden shrink-0 rounded border border-(--color-border) bg-(--color-bg-warm) px-1.5 py-0.5 font-mono text-[10px] font-medium text-(--color-muted) sm:inline-flex sm:items-center sm:gap-0.5">
        <span>{modKey}</span>
        <span>K</span>
      </kbd>
    </button>
  );
}
