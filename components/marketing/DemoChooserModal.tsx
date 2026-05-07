"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, ArrowRight, User, Building2 } from "lucide-react";
import { Link } from "@/i18n/navigation";

type Strings = {
  triggerLabel: string;
  title: string;
  body: string;
  portalLabel: string;
  portalBody: string;
  adminLabel: string;
  adminBody: string;
  cancel: string;
};

/**
 * Modal die twee demo-ingangen aanbiedt: klantenportaal of studio admin.
 * Wordt geopend door een tertiaire link in de hero. Stijl matcht
 * DiscountModal — wijn-rode top-border, AnimatePresence, ESC-dismiss.
 *
 * De daadwerkelijke login gebeurt op de demo-pages (/demo/portal,
 * /demo/admin) — deze modal is enkel een keuze-UI.
 */
export function DemoChooserModal({ strings }: { strings: Strings }) {
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
        className="underline decoration-(--color-border) underline-offset-4 transition-colors hover:text-(--color-text) hover:decoration-(--color-wine)"
      >
        {strings.triggerLabel} →
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
              className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-t-2 border-(--color-border) border-t-(--color-wine) bg-(--color-surface) p-6 md:p-8"
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-(--color-muted) hover:bg-(--color-bg-warm) hover:text-(--color-text)"
                aria-label={strings.cancel}
              >
                <X className="h-4 w-4" />
              </button>

              <h2 className="font-serif text-2xl">{strings.title}</h2>
              <p className="mt-2 text-[14px] leading-[1.55] text-(--color-muted)">{strings.body}</p>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <Link
                  href="/demo/portal"
                  className="group flex flex-col items-start gap-3 rounded-xl border border-(--color-border) bg-(--color-bg-warm)/40 p-5 transition-colors hover:border-(--color-accent)/40 hover:bg-(--color-accent-soft)/40"
                  onClick={() => setOpen(false)}
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-(--color-accent)/10 text-(--color-accent)">
                    <User className="h-4 w-4" />
                  </span>
                  <p className="text-[15px] font-medium text-(--color-text)">
                    {strings.portalLabel}
                  </p>
                  <p className="text-[13px] leading-snug text-(--color-muted)">
                    {strings.portalBody}
                  </p>
                  <span className="mt-auto inline-flex items-center gap-1 text-[13px] font-medium text-(--color-accent) transition-transform group-hover:translate-x-0.5">
                    Open <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>

                <Link
                  href="/demo/admin"
                  className="group flex flex-col items-start gap-3 rounded-xl border border-(--color-border) bg-(--color-bg-warm)/40 p-5 transition-colors hover:border-(--color-wine)/40 hover:bg-(--color-wine)/5"
                  onClick={() => setOpen(false)}
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-(--color-wine)/10 text-(--color-wine)">
                    <Building2 className="h-4 w-4" />
                  </span>
                  <p className="text-[15px] font-medium text-(--color-text)">
                    {strings.adminLabel}
                  </p>
                  <p className="text-[13px] leading-snug text-(--color-muted)">
                    {strings.adminBody}
                  </p>
                  <span className="mt-auto inline-flex items-center gap-1 text-[13px] font-medium text-(--color-wine) transition-transform group-hover:translate-x-0.5">
                    Open <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
