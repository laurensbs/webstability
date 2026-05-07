"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { ToastForm } from "@/components/portal/ToastForm";
import { ToastSubmitButton } from "@/components/portal/ToastSubmitButton";
import type { ActionResult } from "@/lib/action-result";

type Action = (prev: ActionResult | null, formData: FormData) => Promise<ActionResult>;

type Strings = {
  triggerLabel: string;
  title: string;
  body: string;
  percentLabel: string;
  monthsLabel: string;
  monthsForever: string;
  reasonLabel: string;
  reasonPlaceholder: string;
  submit: string;
  cancel: string;
};

/**
 * Modal voor het toekennen van een Stripe-coupon-discount aan een
 * organisatie. %-slider + maanden-select + reden-textarea.
 *
 * `action` is `grantDiscount.bind(null, organizationId)` — de modal
 * weet niet welke org, alleen dat de action een ActionResult teruggeeft.
 */
export function DiscountModal({ action, strings }: { action: Action; strings: Strings }) {
  const [open, setOpen] = React.useState(false);
  const [percent, setPercent] = React.useState(20);
  const [months, setMonths] = React.useState<number>(3);

  // ESC sluit modal — niet via dialog-element zodat we volle controle
  // hebben over animaties.
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
        className="inline-flex items-center gap-1.5 rounded-md border border-(--color-wine)/40 bg-(--color-wine)/5 px-3 py-1.5 text-[13px] font-medium text-(--color-wine) transition-colors hover:bg-(--color-wine)/10"
      >
        {strings.triggerLabel}
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
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-t-2 border-(--color-border) border-t-(--color-wine) bg-(--color-surface) p-6 md:p-8"
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

              <ToastForm action={action} resetOnSuccess className="mt-6 space-y-5">
                {/* Percent slider */}
                <label className="block">
                  <span className="mb-2 flex items-center justify-between text-[13px] font-medium text-(--color-text)">
                    {strings.percentLabel}
                    <span className="font-mono text-(--color-wine)">{percent}%</span>
                  </span>
                  <input
                    type="range"
                    name="percentOff"
                    min={5}
                    max={100}
                    step={5}
                    value={percent}
                    onChange={(e) => setPercent(Number(e.target.value))}
                    className="h-3 w-full accent-(--color-wine) [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6"
                  />
                </label>

                {/* Months select */}
                <label className="block">
                  <span className="mb-2 block text-[13px] font-medium text-(--color-text)">
                    {strings.monthsLabel}
                  </span>
                  <select
                    name="monthsApplied"
                    value={months}
                    onChange={(e) => setMonths(Number(e.target.value))}
                    className="block min-h-11 w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-[15px]"
                  >
                    <option value={0}>{strings.monthsForever}</option>
                    {[1, 2, 3, 4, 5, 6, 9, 12].map((m) => (
                      <option key={m} value={m}>
                        {m} {m === 1 ? "maand" : "maanden"}
                      </option>
                    ))}
                  </select>
                </label>

                {/* Reason */}
                <label className="block">
                  <span className="mb-2 block text-[13px] font-medium text-(--color-text)">
                    {strings.reasonLabel}
                  </span>
                  <textarea
                    name="reason"
                    required
                    rows={3}
                    placeholder={strings.reasonPlaceholder}
                    className="block w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-[15px]"
                  />
                </label>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="inline-flex items-center rounded-full border border-(--color-border) px-4 py-2 text-[13px] font-medium text-(--color-muted) hover:text-(--color-text)"
                  >
                    {strings.cancel}
                  </button>
                  <ToastSubmitButton variant="primary">{strings.submit}</ToastSubmitButton>
                </div>
              </ToastForm>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
