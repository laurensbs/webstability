"use client";

import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ArrowRight, X, Building2, MessageSquare } from "lucide-react";
import { Link } from "@/i18n/navigation";

const STORAGE_KEY = "wb:admin-onboarded";

type Strings = {
  step1Title: string; // "Hi {firstName}, dit is je studio-cockpit"
  step1Body: string;
  step2Title: string; // "{n} klanten wachten op je"
  step2Cta: string; // "Bekijk klanten"
  step3Title: string; // "{n} tickets in de queue"
  step3Cta: string; // "Open ticket-queue"
  next: string;
  dismiss: string;
  step: string; // "Stap {n} van 3"
};

/**
 * Welcome-onboarding card voor allereerste-keer staff. Bevat 3
 * stappen die de cockpit introduceren. Verschijnt alleen als
 * localStorage('wb:admin-onboarded') !== 'true'. Dismissable via X
 * of via voltooien van stap 3.
 *
 * Server-component fetcht zelf of de user nog nooit eerder inlogde
 * (users.lastLoginAt vergelijking) en mount alleen dán deze client-
 * component — zo blijven returning staff niet onnodig hydration-
 * cost betalen.
 */
export function AdminWelcomeOnboarding({
  firstName,
  orgsCount,
  openTicketsCount,
  strings,
}: {
  firstName: string;
  orgsCount: number;
  openTicketsCount: number;
  strings: Strings;
}) {
  const reduce = useReducedMotion();
  const [step, setStep] = React.useState(1);
  // Lazy-init zodat we localStorage al op de eerste client-render kunnen
  // lezen — geen flash-of-onboarding voordat de useEffect de boel opruimt.
  // Tijdens SSR is window undefined → default visible (server-component
  // mount voorwaarde was al "is-first-time-staff", dus dat is OK).
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
      // private mode — onboarding zal volgende sessie opnieuw verschijnen.
    }
    setDismissed(true);
  }

  if (dismissed) return null;

  const stepContent = (() => {
    if (step === 1) {
      return {
        title: strings.step1Title.replace("{firstName}", firstName),
        body: strings.step1Body,
        cta: null,
      };
    }
    if (step === 2) {
      return {
        title: strings.step2Title.replace("{n}", String(orgsCount)),
        body: null,
        cta: { label: strings.step2Cta, href: "/admin/orgs" as const },
      };
    }
    return {
      title: strings.step3Title.replace("{n}", String(openTicketsCount)),
      body: null,
      cta: { label: strings.step3Cta, href: "/admin/tickets" as const },
    };
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
        className="absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-(--color-muted) transition-colors hover:bg-(--color-bg-warm) hover:text-(--color-text)"
        aria-label={strings.dismiss}
      >
        <X className="h-4 w-4" />
      </button>

      <p className="text-[11px] font-medium tracking-[0.08em] text-(--color-wine)">
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
            <h2 className="font-serif text-2xl leading-tight md:text-3xl">{stepContent.title}</h2>
            {stepContent.body ? (
              <p className="mt-3 max-w-prose text-[15px] leading-[1.6] text-(--color-muted)">
                {stepContent.body}
              </p>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>

      <footer className="mt-6 flex items-center gap-3">
        {stepContent.cta ? (
          <Link
            href={stepContent.cta.href}
            className="inline-flex items-center gap-1.5 rounded-full bg-(--color-text) px-4 py-2 text-[13px] font-medium text-(--color-bg) transition-opacity hover:opacity-90"
          >
            {stepContent.cta.label}
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

        <span className="ml-auto inline-flex items-center gap-2 text-(--color-muted)" aria-hidden>
          <span
            className={`h-1.5 w-1.5 rounded-full transition-colors ${step >= 1 ? "bg-(--color-wine)" : "bg-(--color-border)"}`}
          />
          <span
            className={`h-1.5 w-1.5 rounded-full transition-colors ${step >= 2 ? "bg-(--color-wine)" : "bg-(--color-border)"}`}
          />
          <span
            className={`h-1.5 w-1.5 rounded-full transition-colors ${step >= 3 ? "bg-(--color-wine)" : "bg-(--color-border)"}`}
          />
        </span>
      </footer>

      {/* Decoratieve achtergrond-iconen, fade out per stap */}
      <div aria-hidden className="pointer-events-none absolute -right-6 -bottom-6 opacity-[0.04]">
        {step === 2 ? (
          <Building2 className="h-32 w-32" strokeWidth={1.2} />
        ) : step === 3 ? (
          <MessageSquare className="h-32 w-32" strokeWidth={1.2} />
        ) : null}
      </div>
    </motion.section>
  );
}
