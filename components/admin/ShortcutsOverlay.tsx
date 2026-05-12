"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

/**
 * Sneltoetsen-cheatsheet voor de admin. Druk `?` (Shift+/) op een willekeurige
 * admin-pagina om dit overlay te tonen. Bewust statisch (staff-only, NL volstaat)
 * en zonder dependencies — luistert zelf op de keydown, zelfde modal-stijl als
 * de command palette. Esc / klik-buiten / X sluit.
 */
const GROUPS: Array<{ title: string; rows: Array<{ keys: string[]; label: string }> }> = [
  {
    title: "Navigatie",
    rows: [
      { keys: ["⌘", "K"], label: "Zoeken (klanten · tickets · projecten)" },
      { keys: ["g", "d"], label: "Naar dashboard" },
      { keys: ["g", "o"], label: "Naar klanten" },
      { keys: ["g", "l"], label: "Naar leads" },
      { keys: ["g", "t"], label: "Naar tickets" },
      { keys: ["g", "b"], label: "Naar blog-queue" },
      { keys: ["g", "s"], label: "Naar team" },
    ],
  },
  {
    title: "Algemeen",
    rows: [
      { keys: ["?"], label: "Dit overzicht tonen" },
      { keys: ["Esc"], label: "Overlay / palette sluiten" },
    ],
  },
];

export function ShortcutsOverlay() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if (e.key === "?" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (e.key === "Escape" && open) setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-(--color-text)/40 px-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="shadow-modal rounded-panel relative w-full max-w-md overflow-hidden border border-(--color-border) bg-(--color-surface)"
            role="dialog"
            aria-label="Sneltoetsen"
          >
            <header className="flex items-center justify-between border-b border-(--color-border) px-5 py-3">
              <p className="font-mono text-[11px] tracking-[0.18em] text-(--color-muted) uppercase">
                {"// "}sneltoetsen
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Sluiten"
                className="inline-flex h-7 w-7 items-center justify-center rounded text-(--color-muted) transition-colors hover:bg-(--color-bg-warm) hover:text-(--color-text)"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </header>
            <div className="space-y-5 px-5 py-4">
              {GROUPS.map((g) => (
                <div key={g.title}>
                  <p className="mb-2 font-mono text-[10px] tracking-[0.16em] text-(--color-muted) uppercase">
                    {g.title}
                  </p>
                  <ul className="space-y-1.5">
                    {g.rows.map((r) => (
                      <li key={r.label} className="flex items-center justify-between gap-4">
                        <span className="text-[14px] text-(--color-text)">{r.label}</span>
                        <span className="flex shrink-0 items-center gap-1">
                          {r.keys.map((k, i) => (
                            <kbd
                              key={i}
                              className="inline-flex min-w-[20px] items-center justify-center rounded border border-(--color-border) bg-(--color-bg-warm) px-1.5 py-0.5 font-mono text-[11px] text-(--color-text)"
                            >
                              {k}
                            </kbd>
                          ))}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <footer className="border-t border-(--color-border) bg-(--color-bg-warm) px-5 py-2">
              <p className="font-mono text-[10px] tracking-wide text-(--color-muted)">
                {"g "}gevolgd door een letter binnen 800ms · niet in invoervelden
              </p>
            </footer>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
