"use client";

import * as React from "react";
import NumberFlow from "@number-flow/react";
import { Check } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { isLegacyTier } from "@/lib/pricing";

type Cycle = "monthly" | "annual";

export type PricingItem = {
  id: "care" | "studio" | "atelier";
  name: string;
  /** 2-3 woorden mens-vertaling, e.g. "voor stabiel houden". Shown
   * direct onder de tier-naam in een mono-pill zodat een leek meteen
   * snapt waar de tier voor is voordat hij de volle body leest. */
  humanLabel?: string;
  /** One-liner in eerste persoon — staat boven de tier-naam in serif
   * cursief, helpt een leek zich te identificeren met de tier. */
  subEyebrow?: string;
  /** "1 van 3", "2 van 3 · populairst", etc. — alleen zichtbaar op
   * mobile waar cards verticaal stapelen. */
  orderIndicator?: string;
  /** Short audience tagline, shown under the tier name. */
  body: string;
  monthly: number;
  annual: number;
  /** Bulleted feature list shown beneath the price. */
  features: string[];
  /** Cijfer-anchor onderaan de card: "1 uur" / "3 uur" / "8 uur" met
   * mono-label "per maand". Vervangt de oude TierPreview-mini-widget
   * met één leesbare statistic — past bij de cijfer-trio op /over en
   * /diensten hero. */
  anchorValue?: string;
  anchorLabel?: string;
};

type Strings = {
  featuredLabel: string;
  monthlyLabel: string;
  annualLabel: string;
  annualHint: string;
  perMonth: string;
  perMonthBilledAnnually: string;
  ctaLabel: string;
  /** Badge die verschijnt op legacy-tiers (Care): "alleen voor
   * bestaande klanten". Strategie-keuze: anker laten staan, geen aanbod. */
  legacyBadgeLabel: string;
  /** CTA-tekst op legacy-tier in plaats van "Abonneer". */
  legacyCtaLabel: string;
};

/**
 * Auth-aware CTA mode for /prijzen. Logged-in owners see "Abonneer"
 * submitting `subscribeAction`, of een "Huidig plan" pill als hun org
 * al die tier runt. Anonieme bezoekers zien ook "Abonneer" maar dan
 * via `anonSubscribeAction` — een Stripe Checkout in de modus waar
 * Stripe zelf de email + naam verzamelt. Pas na betaling wordt de
 * user + org aangemaakt door /checkout/done.
 */
export type AuthMode = {
  isOwner: boolean;
  currentPlan: "care" | "studio" | "atelier" | null;
  /**
   * Server action voor ingelogde owners. Krijgt FormData met `plan`,
   * start Stripe Checkout met de bestaande customer.
   */
  subscribeAction: (formData: FormData) => Promise<void>;
  /**
   * Server action voor anonieme bezoekers. Krijgt FormData met `plan`,
   * start Stripe Checkout in customer_creation: 'always' modus.
   */
  anonSubscribeAction: (formData: FormData) => Promise<void>;
  subscribeLabel: string;
  currentPlanLabel: string;
};

/**
 * Drie tier-kaarten + cycle-toggle. Studio-rust-versie: alle cards
 * cream-styling, featured Studio krijgt visueel signaal via dunne
 * wijn-rode top-border + "Meest gekozen"-pill — geen donkere bg, geen
 * mesh, geen particle-glints. Past bij /diensten + /verhuur stijl-
 * discipline (één accent, rustig).
 */
export function PricingCardsWithToggle({
  items,
  strings,
  authMode,
}: {
  items: PricingItem[];
  strings: Strings;
  authMode?: AuthMode;
}) {
  const [cycle, setCycle] = React.useState<Cycle>("monthly");
  const reduce = useReducedMotion();

  return (
    <>
      {/* Toggle — spring-pill blijft (Linear/Stripe-pattern). De "−15%"
          inline-badge is eruit; "annualHint" eronder is voldoende. */}
      <div className="mb-10 flex flex-col items-center gap-2">
        <div className="flex w-fit items-center gap-1 rounded-full border border-(--color-border) bg-(--color-surface) p-1.5">
          <ToggleButton active={cycle === "monthly"} onClick={() => setCycle("monthly")}>
            {strings.monthlyLabel}
          </ToggleButton>
          <ToggleButton active={cycle === "annual"} onClick={() => setCycle("annual")}>
            {strings.annualLabel}
          </ToggleButton>
        </div>
        <p className="font-mono text-[11px] tracking-widest text-(--color-muted) uppercase">
          {cycle === "annual" ? strings.annualHint : " "}
        </p>
      </div>

      {/* Cards */}
      <div className="grid items-stretch gap-5 md:grid-cols-3">
        {items.map((item) => {
          const featured = item.id === "studio";
          const legacy = isLegacyTier(item.id);
          const value = cycle === "annual" ? item.annual : item.monthly;
          const period = cycle === "annual" ? strings.perMonthBilledAnnually : strings.perMonth;

          // Featured signaleert via dunne wijn-rode top-border + pill.
          // Atelier krijgt subtiele ring. Care wordt gedimd (legacy).
          const cardClass = legacy
            ? "border border-(--color-border) bg-(--color-surface) opacity-75 saturate-[0.7]"
            : featured
              ? "border border-(--color-border) border-t-2 border-t-(--color-wine) bg-(--color-surface) shadow-[0_2px_4px_rgba(31,27,22,0.04),0_8px_24px_-8px_rgba(107,30,44,0.12),0_24px_48px_-16px_rgba(31,27,22,0.06)]"
              : "border border-(--color-border) bg-(--color-surface) shadow-card";

          return (
            <article
              key={item.id}
              className={`group rounded-modal relative flex h-full flex-col overflow-hidden p-7 transition-all duration-300 hover:-translate-y-1 hover:border-(--color-accent)/40 hover:shadow-[0_2px_4px_rgba(31,27,22,0.06),0_8px_24px_-6px_rgba(201,97,79,0.16),0_24px_48px_-16px_rgba(31,27,22,0.08)] sm:p-9 ${cardClass}`}
            >
              {/* Featured-pill (Meest gekozen) — discreet rechtsboven */}
              {featured ? (
                <span className="absolute top-4 right-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-(--color-wine) px-3 py-1 text-[11px] font-medium text-white">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                  </span>
                  {strings.featuredLabel}
                </span>
              ) : null}

              {/* Legacy-badge (Care: alleen bestaande klanten) */}
              {legacy ? (
                <span className="absolute top-4 right-4 z-10 inline-flex items-center gap-1.5 rounded-full border border-(--color-border) bg-(--color-bg-warm) px-3 py-1 font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
                  {strings.legacyBadgeLabel}
                </span>
              ) : null}

              {item.orderIndicator ? (
                <p className="mb-3 font-mono text-[11px] tracking-widest text-(--color-muted) uppercase md:hidden">
                  {item.orderIndicator}
                </p>
              ) : null}
              {item.subEyebrow ? (
                <p className="mb-3 font-serif text-[15px] leading-snug text-(--color-text) italic">
                  {item.subEyebrow}
                </p>
              ) : null}

              <h3 className="relative mb-1.5 text-[24px]">{item.name}</h3>
              {item.humanLabel ? (
                <p className="mb-3 inline-flex w-fit items-center rounded-full bg-(--color-bg-warm) px-2.5 py-1 font-mono text-[10px] tracking-widest text-(--color-accent) uppercase">
                  {item.humanLabel}
                </p>
              ) : null}
              <p className="mb-7 text-[14px] text-(--color-muted)">{item.body}</p>

              <div className="flex items-baseline gap-1">
                <span className="font-serif text-[36px] leading-none sm:text-[48px]">
                  €
                  <NumberFlow
                    value={value}
                    transformTiming={{ duration: 600, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }}
                  />
                </span>
              </div>
              <motion.span
                key={cycle}
                initial={reduce ? false : { opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-1 mb-7 block text-[13px] text-(--color-muted)"
              >
                {period}
              </motion.span>

              <ul className="mb-6 flex-grow space-y-2">
                {item.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[14px] text-(--color-muted)">
                    <Check
                      className="mt-1 h-3.5 w-3.5 shrink-0 text-(--color-accent)"
                      strokeWidth={2.5}
                    />
                    {f}
                  </li>
                ))}
              </ul>

              {/* Cijfer-anchor — vervangt de oude TierPreview. Eén
                  rustig getal dat tier-onderscheid ondersteunt. */}
              {item.anchorValue && item.anchorLabel ? (
                <div className="mb-6 border-t border-(--color-border) pt-5">
                  <p className="font-serif text-[40px] leading-none text-(--color-wine)">
                    {item.anchorValue}
                  </p>
                  <p className="mt-2 font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
                    {item.anchorLabel}
                  </p>
                </div>
              ) : null}

              {legacy ? (
                <Button asChild variant="outline" className="relative w-full justify-center">
                  <Link href="/contact">{strings.legacyCtaLabel}</Link>
                </Button>
              ) : authMode ? (
                authMode.isOwner ? (
                  authMode.currentPlan === item.id ? (
                    <span className="relative inline-flex w-full items-center justify-center rounded-full border border-(--color-border) px-4 py-2.5 font-mono text-[11px] tracking-widest text-(--color-muted) uppercase">
                      {authMode.currentPlanLabel}
                    </span>
                  ) : (
                    <form action={authMode.subscribeAction} className="relative w-full">
                      <input type="hidden" name="plan" value={item.id} />
                      <Button type="submit" variant="accent" className="w-full justify-center">
                        {authMode.subscribeLabel}
                      </Button>
                    </form>
                  )
                ) : (
                  <form action={authMode.anonSubscribeAction} className="relative w-full">
                    <input type="hidden" name="plan" value={item.id} />
                    <Button type="submit" variant="accent" className="w-full justify-center">
                      {authMode.subscribeLabel}
                    </Button>
                  </form>
                )
              ) : (
                <Button asChild variant="outline" className="relative w-full justify-center">
                  <Link href="/contact">{strings.ctaLabel}</Link>
                </Button>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex min-h-11 items-center rounded-full px-4 py-2.5 text-[13px] font-medium transition-colors ${
        active ? "text-(--color-bg)" : "text-(--color-muted) hover:text-(--color-text)"
      }`}
    >
      {active ? (
        <motion.span
          layoutId="billing-toggle-pill"
          className="absolute inset-0 rounded-full bg-(--color-text)"
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      ) : null}
      <span className="relative flex items-center">{children}</span>
    </button>
  );
}
