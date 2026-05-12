"use client";

import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ArrowRight, X, Inbox, Receipt } from "lucide-react";
import { Link } from "@/i18n/navigation";

const STORAGE_KEY = "wb:portal-onboarded";

type Strings = {
  step: string; // "Stap {n} van 3"
  step1Title: string; // "Welkom, {firstName} — dit is je portal"
  step1Body: string;
  step2Title: string;
  step2Body: string;
  step2Cta: string;
  step3Title: string;
  step3Body: string;
  step3Cta: string;
  next: string;
  dismiss: string;
};

/**
 * Welkom-onboarding voor een nieuwe klant — 3 stappen die het portal
 * introduceren (voortgang · tickets · facturen). Verschijnt alleen bij de
 * allereerste login (de dashboard-page mount 'm op `!user.lastLoginAt`) en
 * onthoudt dismiss in localStorage zodat 'ie niet terugkomt bij een refresh
 * voordat de lastLoginAt-update is geland. Patroon parallel aan
 * AdminWelcomeOnboarding.
 */
export function PortalWelcomeOnboarding({
  firstName,
  strings,
}: {
  firstName: string;
  strings: Strings;
}) {
  const reduce = useReducedMotion();
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
      // private mode — verschijnt volgende sessie opnieuw.
    }
    setDismissed(true);
  }

  if (dismissed) return null;

  const content = (() => {
    if (step === 1) {
      return {
        title: strings.step1Title.replace("{firstName}", firstName),
        body: strings.step1Body,
        cta: null as { label: string; href: "/portal/tickets" | "/portal/invoices" } | null,
      };
    }
    if (step === 2) {
      return {
        title: strings.step2Title,
        body: strings.step2Body,
        cta: { label: strings.step2Cta, href: "/portal/tickets" as const },
      };
    }
    return {
      title: strings.step3Title,
      body: strings.step3Body,
      cta: { label: strings.step3Cta, href: "/portal/invoices" as const },
    };
  })();

  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-panel relative overflow-hidden border border-t-2 border-(--color-border) border-t-(--color-accent) bg-(--color-surface) p-6 md:p-8"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label={strings.dismiss}
        className="absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-(--color-muted) transition-colors hover:bg-(--color-bg-warm) hover:text-(--color-text)"
      >
        <X className="h-4 w-4" />
      </button>

      <p className="text-[11px] font-medium tracking-[0.08em] text-(--color-accent)">
        {strings.step.replace("{n}", String(step))}
      </p>

      <div className="relative mt-3 min-h-[120px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={reduce ? false : { opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={reduce ? undefined : { opacity: 0, x: -12 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="text-h3">{content.title}</h2>
            <p className="mt-3 max-w-prose text-[15px] leading-[1.6] text-(--color-muted)">
              {content.body}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <footer className="mt-6 flex items-center gap-3">
        {content.cta ? (
          <Link
            href={content.cta.href}
            className="inline-flex items-center gap-1.5 rounded-full bg-(--color-text) px-4 py-2 text-[13px] font-medium text-(--color-bg) transition-opacity hover:opacity-90"
          >
            {content.cta.label}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ) : null}
        {step < 3 ? (
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(3, s + 1))}
            className="inline-flex items-center gap-1.5 rounded-full border border-(--color-border) px-4 py-2 text-[13px] font-medium text-(--color-text) transition-colors hover:border-(--color-accent)/40"
          >
            {strings.next}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex items-center gap-1.5 rounded-full border border-(--color-border) px-4 py-2 text-[13px] font-medium text-(--color-text) transition-colors hover:border-(--color-accent)/40"
          >
            {strings.dismiss}
          </button>
        )}
        <span className="ml-auto inline-flex items-center gap-2" aria-hidden>
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={`h-1.5 w-1.5 rounded-full transition-colors ${step >= n ? "bg-(--color-accent)" : "bg-(--color-border)"}`}
            />
          ))}
        </span>
      </footer>

      <div aria-hidden className="pointer-events-none absolute -right-6 -bottom-6 opacity-[0.04]">
        {step === 2 ? (
          <Inbox className="h-32 w-32" strokeWidth={1.2} />
        ) : step === 3 ? (
          <Receipt className="h-32 w-32" strokeWidth={1.2} />
        ) : null}
      </div>
    </motion.section>
  );
}
