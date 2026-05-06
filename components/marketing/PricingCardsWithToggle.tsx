"use client";

import * as React from "react";
import NumberFlow from "@number-flow/react";
import { Check } from "lucide-react";
import { motion } from "motion/react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";

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
};

type Strings = {
  featuredLabel: string;
  monthlyLabel: string;
  annualLabel: string;
  annualHint: string;
  perMonth: string;
  perMonthBilledAnnually: string;
  ctaLabel: string;
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

  return (
    <>
      {/* Toggle */}
      <div className="mb-10 flex flex-col items-center gap-2">
        <div className="flex w-fit items-center gap-1 rounded-full border border-(--color-border) bg-(--color-surface) p-1.5">
          <ToggleButton active={cycle === "monthly"} onClick={() => setCycle("monthly")}>
            {strings.monthlyLabel}
          </ToggleButton>
          <ToggleButton active={cycle === "annual"} onClick={() => setCycle("annual")}>
            {strings.annualLabel}
            <span className="ml-1.5 rounded-full bg-(--color-accent-soft) px-1.5 py-0.5 font-mono text-[10px] tracking-wide text-(--color-accent)">
              −15%
            </span>
          </ToggleButton>
        </div>
        <p className="font-mono text-[11px] tracking-widest text-(--color-muted) uppercase">
          {cycle === "annual" ? strings.annualHint : " "}
        </p>
      </div>

      {/* Cards */}
      <div className="grid items-stretch gap-5 md:grid-cols-3">
        {items.map((item) => {
          const featured = item.id === "studio";
          const value = cycle === "annual" ? item.annual : item.monthly;
          const period = cycle === "annual" ? strings.perMonthBilledAnnually : strings.perMonth;
          const sizeClass =
            item.id === "care"
              ? "lg:scale-[0.97]"
              : item.id === "atelier"
                ? "lg:ring-1 lg:ring-(--color-text)/10"
                : "";
          return (
            <article
              key={item.id}
              className={`group relative flex h-full flex-col overflow-hidden rounded-[28px] p-7 transition-all duration-300 sm:p-10 ${sizeClass} ${
                featured
                  ? "scale-[1.02] border border-(--color-text) bg-(--color-text) text-(--color-bg) hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-[0_24px_48px_-12px_rgba(31,27,22,0.3)]"
                  : "border border-(--color-border) bg-(--color-surface) hover:-translate-y-1.5 hover:border-(--color-accent)/40 hover:shadow-[0_24px_48px_-12px_rgba(201,97,79,0.18),0_8px_16px_-4px_rgba(31,27,22,0.06)]"
              }`}
            >
              {item.orderIndicator ? (
                <p
                  className={`mb-3 font-mono text-[11px] tracking-widest uppercase md:hidden ${
                    featured ? "text-(--color-bg)/60" : "text-(--color-muted)"
                  }`}
                >
                  {item.orderIndicator}
                </p>
              ) : null}
              {item.subEyebrow ? (
                <p
                  className={`mb-3 font-serif text-[15px] leading-snug italic ${
                    featured ? "text-(--color-bg)/85" : "text-(--color-text)"
                  }`}
                >
                  {item.subEyebrow}
                </p>
              ) : null}
              {/* Soft accent halo — verschijnt op hover, top-right */}
              <span
                aria-hidden
                className={`pointer-events-none absolute -top-24 -right-20 h-56 w-56 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-60 ${
                  featured ? "bg-(--color-accent)" : "bg-(--color-accent-soft)"
                }`}
              />
              {featured ? (
                <span className="absolute -top-2.5 right-6 inline-flex items-center gap-1.5 rounded-full bg-(--color-accent) px-3 py-1 text-[11px] font-medium text-white">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                  </span>
                  {strings.featuredLabel}
                </span>
              ) : null}
              <h3 className={`mb-1.5 text-[24px] ${featured ? "text-(--color-bg)" : ""}`}>
                {item.name}
              </h3>
              {item.humanLabel ? (
                <p
                  className={`mb-3 inline-flex w-fit items-center rounded-full px-2.5 py-1 font-mono text-[10px] tracking-widest uppercase ${
                    featured
                      ? "bg-(--color-bg)/15 text-(--color-bg)/85"
                      : "bg-(--color-bg-warm) text-(--color-accent)"
                  }`}
                >
                  {item.humanLabel}
                </p>
              ) : null}
              <p
                className={`mb-7 text-[14px] ${
                  featured ? "text-(--color-bg)/75" : "text-(--color-muted)"
                }`}
              >
                {item.body}
              </p>
              <div className="flex items-baseline gap-1">
                <span
                  className={`font-serif text-[36px] leading-none sm:text-[48px] ${
                    featured ? "text-(--color-bg)" : ""
                  }`}
                >
                  €
                  <NumberFlow
                    value={value}
                    transformTiming={{ duration: 600, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }}
                  />
                </span>
              </div>
              <motion.span
                key={cycle}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`mt-1 mb-7 block text-[13px] ${
                  featured ? "text-(--color-bg)/60" : "text-(--color-muted)"
                }`}
              >
                {period}
              </motion.span>
              <ul className="mb-8 flex-grow space-y-2">
                {item.features.map((f) => (
                  <li
                    key={f}
                    className={`flex items-start gap-2.5 text-[14px] ${
                      featured ? "text-(--color-bg)/75" : "text-(--color-muted)"
                    }`}
                  >
                    <Check
                      className={`mt-1 h-3.5 w-3.5 shrink-0 ${
                        featured ? "text-(--color-accent-soft)" : "text-(--color-accent)"
                      }`}
                      strokeWidth={2.5}
                    />
                    {f}
                  </li>
                ))}
              </ul>
              {authMode ? (
                authMode.isOwner ? (
                  authMode.currentPlan === item.id ? (
                    <span
                      className={`inline-flex w-full items-center justify-center rounded-full border px-4 py-2.5 font-mono text-[11px] tracking-widest uppercase ${
                        featured
                          ? "border-(--color-bg)/30 text-(--color-bg)/80"
                          : "border-(--color-border) text-(--color-muted)"
                      }`}
                    >
                      {authMode.currentPlanLabel}
                    </span>
                  ) : (
                    <form action={authMode.subscribeAction} className="w-full">
                      <input type="hidden" name="plan" value={item.id} />
                      <Button
                        type="submit"
                        variant={featured ? "ghost" : "accent"}
                        className={`w-full justify-center ${
                          featured
                            ? "bg-(--color-bg) text-(--color-text) hover:bg-(--color-accent-soft) hover:text-(--color-text)"
                            : ""
                        }`}
                      >
                        {authMode.subscribeLabel}
                      </Button>
                    </form>
                  )
                ) : (
                  <form action={authMode.anonSubscribeAction} className="w-full">
                    <input type="hidden" name="plan" value={item.id} />
                    <Button
                      type="submit"
                      variant={featured ? "ghost" : "accent"}
                      className={`w-full justify-center ${
                        featured
                          ? "bg-(--color-bg) text-(--color-text) hover:bg-(--color-accent-soft) hover:text-(--color-text)"
                          : ""
                      }`}
                    >
                      {authMode.subscribeLabel}
                    </Button>
                  </form>
                )
              ) : (
                <Button
                  asChild
                  variant={featured ? "ghost" : "outline"}
                  className={`w-full justify-center ${
                    featured
                      ? "bg-(--color-bg) text-(--color-text) hover:bg-(--color-accent-soft) hover:text-(--color-text)"
                      : ""
                  }`}
                >
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
