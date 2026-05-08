"use client";

import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ArrowRight, X, Compass } from "lucide-react";

type Strings = {
  step: string; // "Stap {n} van 3"
  step1Title: string;
  step1Body: string;
  step2Title: string;
  step2Body: string;
  step3Title: string;
  step3Body: string;
  next: string;
  done: string;
  dismiss: string;
};

/**
 * 3-stap rondleiding voor demo-bezoekers. Verschijnt bij eerste paint
 * van /portal/dashboard (role="portal") of /admin (role="admin").
 * Dismiss-baar via X of via voltooien stap 3, opslag in localStorage.
 *
 * Hergebruikt het AdminWelcomeOnboarding-patroon — wijn-rode top-border,
 * AnimatePresence slide tussen steps, dot-indicator.
 *
 * Mount alleen als de page-server de component rendert (dwz current
 * user.isDemo=true). Geen client-side check op isDemo nodig.
 */
export function DemoTourOverlay({ role, strings }: { role: "portal" | "admin"; strings: Strings }) {
  const reduce = useReducedMotion();
  const STORAGE_KEY = `wb-demo-tour-${role}`;
  const [step, setStep] = React.useState(1);
  const [dismissed, setDismissed] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // private mode — overlay verschijnt opnieuw bij volgende sessie.
    }
    setDismissed(true);
  }

  if (dismissed) return null;

  const stepContent = (() => {
    if (step === 1) return { title: strings.step1Title, body: strings.step1Body };
    if (step === 2) return { title: strings.step2Title, body: strings.step2Body };
    return { title: strings.step3Title, body: strings.step3Body };
  })();

  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl border border-t-2 border-(--color-border) border-t-(--color-wine) bg-(--color-surface) p-6 md:p-8"
    >
      <button
        type="button"
        onClick={dismiss}
        className="absolute top-2 right-2 inline-flex h-11 w-11 items-center justify-center rounded-full text-(--color-muted) transition-colors hover:bg-(--color-bg-warm) hover:text-(--color-text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent) md:top-3 md:right-3 md:h-8 md:w-8"
        aria-label={strings.dismiss}
      >
        <X className="h-4 w-4" />
      </button>

      <p className="inline-flex items-center gap-2 text-[11px] font-medium tracking-[0.08em] text-(--color-wine)">
        <Compass className="h-3 w-3" />
        {strings.step.replace("{n}", String(step))}
      </p>

      <div className="relative mt-3 min-h-[100px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={reduce ? false : { opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? undefined : { opacity: 0, x: -12 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="font-serif text-2xl leading-tight md:text-3xl">{stepContent.title}</h2>
            <p className="mt-3 max-w-prose text-[14px] leading-[1.6] text-(--color-muted)">
              {stepContent.body}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <footer className="mt-6 flex items-center gap-3">
        {step < 3 ? (
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(3, s + 1))}
            className="inline-flex items-center gap-1.5 rounded-full bg-(--color-text) px-4 py-2 text-[13px] font-medium text-(--color-bg) transition-opacity hover:opacity-90"
          >
            {strings.next}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex items-center gap-1.5 rounded-full bg-(--color-wine) px-4 py-2 text-[13px] font-medium text-(--color-bg) transition-opacity hover:opacity-90"
          >
            {strings.done}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}

        <span className="ml-auto inline-flex items-center gap-2 text-(--color-muted)" aria-hidden>
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${step >= n ? "bg-(--color-wine)" : "bg-(--color-border)"}`}
            />
          ))}
        </span>
      </footer>
    </motion.section>
  );
}
