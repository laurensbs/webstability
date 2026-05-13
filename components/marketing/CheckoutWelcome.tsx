"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { Mail, KeyRound, LayoutDashboard, Sparkles } from "lucide-react";
import { ConfettiBurst } from "@/components/animate/ConfettiBurst";
import { Eyebrow } from "@/components/animate/Eyebrow";

/**
 * Celebration-scherm na een geslaagde Stripe-checkout (anon-flow). De
 * org + user zijn server-side al aangemaakt; dit is het "je bent binnen"-
 * moment vóór de klant naar /login gaat om z'n wachtwoord in te stellen.
 *
 * Bewust géén auto-redirect (de mail-link is de echte volgende stap; de
 * klant mag hier blijven lezen). Wel: 3 concrete stappen + persoonlijk
 * berichtje, want dit is *het* trust-moment direct na betalen.
 */
export function CheckoutWelcome({
  email,
  redirectTo,
  plan,
  strings,
}: {
  email: string;
  redirectTo: string;
  plan: "care" | "studio" | "atelier" | null;
  strings: {
    eyebrow: string;
    title: string;
    body: string;
    planLineCare: string;
    planLineStudio: string;
    planLineAtelier: string;
    stepsTitle: string;
    step1Title: string;
    step1Body: string;
    step2Title: string;
    step2Body: string;
    step3Title: string;
    step3Body: string;
    noteEyebrow: string;
    note: string;
    noteSig: string;
    cta: string;
    ctaHint: string;
  };
}) {
  const reduce = useReducedMotion();
  const [fire, setFire] = React.useState(false);

  // Twee bursts: één direct, één na ~1,8s — zoals een echte "tweede klap"
  // bij een feestje. Reduced motion → geen confetti.
  React.useEffect(() => {
    if (reduce) return;
    const t1 = window.setTimeout(() => setFire(true), 250);
    const t2 = window.setTimeout(() => setFire(false), 1900);
    const t3 = window.setTimeout(() => setFire(true), 2100);
    const t4 = window.setTimeout(() => setFire(false), 3500);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      window.clearTimeout(t4);
    };
  }, [reduce]);

  const planLine =
    plan === "care"
      ? strings.planLineCare
      : plan === "studio"
        ? strings.planLineStudio
        : plan === "atelier"
          ? strings.planLineAtelier
          : null;

  const steps = [
    { icon: Mail, title: strings.step1Title, body: strings.step1Body.replace("{email}", email) },
    { icon: LayoutDashboard, title: strings.step2Title, body: strings.step2Body },
    { icon: Sparkles, title: strings.step3Title, body: strings.step3Body },
  ];

  return (
    <main className="dotted-bg flex min-h-screen items-start justify-center px-6 py-16 md:py-24">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-xl"
      >
        <ConfettiBurst fire={fire} anchor="top" variant="success" />

        <div className="text-center">
          <Eyebrow className="inline-block">{strings.eyebrow}</Eyebrow>
          <h1 className="mt-4 font-serif text-[clamp(32px,5vw,46px)] leading-tight">
            {strings.title}
          </h1>
          <p className="mt-4 text-[15px] leading-[1.65] text-(--color-muted)">{strings.body}</p>
          {planLine ? (
            <p
              className="mt-3 inline-block rounded-full border border-(--color-border) bg-(--color-surface) px-3.5 py-1.5 text-[13px] text-(--color-text)/80"
              dangerouslySetInnerHTML={{
                __html: planLine.replace(
                  /\*\*(.+?)\*\*/g,
                  '<strong class="font-medium text-(--color-accent)">$1</strong>',
                ),
              }}
            />
          ) : null}
        </div>

        {/* 3 concrete next-step kaarten — zo weet de klant *exact* wat er
            de komende minuten + dag gebeurt. */}
        <section className="mt-10 rounded-xl border border-(--color-border) bg-(--color-surface) p-6">
          <h2 className="mb-4 font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
            {strings.stepsTitle}
          </h2>
          <ol className="space-y-4">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.li
                  key={step.title}
                  initial={reduce ? false : { opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-start gap-4"
                >
                  <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-(--color-border) bg-(--color-bg)">
                    <Icon className="h-4 w-4 text-(--color-accent)" strokeWidth={2} />
                    <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-(--color-text) font-mono text-[10px] text-(--color-bg)">
                      {i + 1}
                    </span>
                  </span>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-[14px] font-medium text-(--color-text)">{step.title}</p>
                    <p className="mt-1 text-[13.5px] leading-[1.55] text-(--color-muted)">
                      {step.body}
                    </p>
                  </div>
                </motion.li>
              );
            })}
          </ol>
        </section>

        {/* Persoonlijk berichtje — dit is het verschil tussen "een SaaS"
            en "een mens die je site doet". */}
        <motion.aside
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 rounded-xl border border-(--color-accent)/20 bg-(--color-accent)/[0.04] p-5"
        >
          <p className="mb-1.5 font-mono text-[10px] tracking-widest text-(--color-accent) uppercase">
            {strings.noteEyebrow}
          </p>
          <p className="text-[14px] leading-[1.6] text-(--color-text)/90">{strings.note}</p>
          <p className="mt-2 font-serif text-[14px] text-(--color-text)/80 italic">
            {strings.noteSig}
          </p>
        </motion.aside>

        <div className="mt-8 flex flex-col items-center gap-2">
          {/* Plain <a> i.p.v. next-intl Link omdat redirectTo een
              query-string bevat — typed routes accepteren dat niet,
              en de URL is server-side al locale-prefixed via /login. */}
          <a
            href={redirectTo}
            className="hover:shadow-card inline-flex items-center gap-2 rounded-full bg-(--color-text) px-5 py-2.5 text-[14px] font-medium text-(--color-bg) transition-all hover:-translate-y-0.5 hover:bg-(--color-accent) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)"
          >
            <KeyRound className="h-4 w-4" strokeWidth={2} />
            {strings.cta}
          </a>
          <p className="mt-1 text-center font-mono text-[11px] tracking-wide text-(--color-muted)/70">
            {strings.ctaHint}
          </p>
        </div>
      </motion.div>
    </main>
  );
}
