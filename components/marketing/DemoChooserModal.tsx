"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ExternalLink, Warehouse, Wrench, KeyRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type DemoCase = {
  label: string;
  body: string;
  /** Backwards-compat: oude single-link entry. Als `adminUrl`/`portalUrl`
   * gezet zijn, krijgt de kaart twee mini-knoppen (klant + admin). */
  url?: string;
  adminUrl?: string;
  portalUrl?: string;
};

type Strings = {
  triggerLabel: string;
  title: string;
  body: string;
  cases: DemoCase[];
  cancel: string;
};

/**
 * Modal die de bezoeker laat kiezen uit de drie productie-cases (stalling,
 * reparatie, verhuur). Elke kaart linkt naar een geanonimiseerde live demo
 * (Vercel deploy van het echte project, met dummy data).
 *
 * Stijl matcht DiscountModal — wijn-rode top-border, AnimatePresence,
 * ESC-dismiss, click-outside-to-close.
 *
 * Iconen worden positioneel toegewezen aan de cases-volgorde uit de
 * messages bundle: 1ᵉ stalling, 2ᵉ reparatie, 3ᵉ verhuur. Als de volgorde
 * verandert moet je de iconenlijst hieronder ook aanpassen.
 */

// Iconen per index — past bij de volgorde van demoCases in nl.json/es.json.
const CASE_ICONS: LucideIcon[] = [Warehouse, Wrench, KeyRound];

export function DemoChooserModal({
  strings,
  triggerClassName,
  triggerSuffix = " →",
}: {
  strings: Strings;
  /** Override de standaard underline-styling. Voor pill/button-stijl
   * triggers (bv. cases-pagina demo-callout). */
  triggerClassName?: string;
  /** Tekst die achter de label komt (default ' →'). Pass '' voor knop-styling. */
  triggerSuffix?: string;
}) {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          triggerClassName ??
          "underline decoration-(--color-border) underline-offset-4 transition-colors hover:text-(--color-text) hover:decoration-(--color-wine)"
        }
      >
        {strings.triggerLabel}
        {triggerSuffix}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-(--color-text)/40 px-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={strings.title}
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-t-2 border-(--color-border) border-t-(--color-wine) bg-(--color-surface) p-6 md:p-8"
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute top-2 right-2 inline-flex h-11 w-11 items-center justify-center rounded-full text-(--color-muted) transition-colors hover:bg-(--color-bg-warm) hover:text-(--color-text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent) md:top-3 md:right-3 md:h-8 md:w-8"
                aria-label={strings.cancel}
              >
                <X className="h-4 w-4" />
              </button>

              <h2 className="font-serif text-2xl">{strings.title}</h2>
              <p className="mt-2 text-[14px] leading-[1.55] text-(--color-muted)">{strings.body}</p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {strings.cases.map((c, i) => {
                  const Icon = CASE_ICONS[i] ?? Warehouse;
                  // Bepaal admin/portaal links — fallback op single-link
                  // entry voor backwards-compat.
                  const adminUrl = c.adminUrl ?? c.url;
                  const portalUrl = c.portalUrl;
                  return (
                    <div
                      key={c.label}
                      className="flex flex-col gap-3 rounded-xl border border-(--color-border) bg-(--color-bg-warm)/40 p-5"
                    >
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-(--color-wine)/10 text-(--color-wine)">
                        <Icon className="h-4 w-4" />
                      </span>
                      <p className="text-[15px] font-medium text-(--color-text)">{c.label}</p>
                      <p className="flex-1 text-[13px] leading-snug text-(--color-muted)">
                        {c.body}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {adminUrl ? (
                          <a
                            href={adminUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setOpen(false)}
                            className="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-(--color-wine) px-3 py-1.5 text-[12px] font-medium text-(--color-bg) transition-opacity hover:opacity-90"
                          >
                            Admin <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : null}
                        {portalUrl ? (
                          <a
                            href={portalUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => setOpen(false)}
                            className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-(--color-wine)/40 px-3 py-1.5 text-[12px] font-medium text-(--color-wine) transition-colors hover:bg-(--color-wine)/10"
                          >
                            Klantkant <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
