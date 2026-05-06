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
 * Auth-aware CTA mode for /prijzen. When provided, logged-in owners
 * see "Abonneer" submitting `subscribeAction` (a Next.js server action
 * — server-action refs are serialisable across the boundary) or a
 * "Huidig plan" pill if their org already runs that plan. Anonymous
 * users still see the default contact link.
 */
export type AuthMode = {
  isOwner: boolean;
  currentPlan: "care" | "studio" | "atelier" | null;
  /**
   * Server action that takes a FormData with `plan` and starts a
   * Stripe Checkout flow. Passed straight to <form action={...}>.
   */
  subscribeAction: (formData: FormData) => Promise<void>;
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
      <div className="grid gap-5 md:grid-cols-3">
        {items.map((item) => {
          const featured = item.id === "studio";
          const value = cycle === "annual" ? item.annual : item.monthly;
          const period = cycle === "annual" ? strings.perMonthBilledAnnually : strings.perMonth;
          return (
            <article
              key={item.id}
              className={`relative flex h-full flex-col rounded-[28px] p-10 transition-all duration-300 ${
                featured
                  ? "scale-[1.02] border border-(--color-text) bg-(--color-text) text-(--color-bg) hover:-translate-y-1.5 hover:scale-[1.02] hover:shadow-[0_24px_48px_-12px_rgba(31,27,22,0.3)]"
                  : "border border-(--color-border) bg-(--color-surface) hover:-translate-y-1.5 hover:shadow-[0_24px_48px_-12px_rgba(31,27,22,0.12),0_8px_16px_-4px_rgba(31,27,22,0.06)]"
              }`}
            >
              {featured ? (
                <span className="absolute -top-2.5 right-6 rounded-full bg-(--color-accent) px-3 py-1 text-[11px] font-medium text-white">
                  {strings.featuredLabel}
                </span>
              ) : null}
              <h3 className={`mb-1.5 text-[24px] ${featured ? "text-(--color-bg)" : ""}`}>
                {item.name}
              </h3>
              <p
                className={`mb-7 text-[14px] ${
                  featured ? "text-(--color-bg)/75" : "text-(--color-muted)"
                }`}
              >
                {item.body}
              </p>
              <div className="flex items-baseline gap-1">
                <span
                  className={`font-serif text-[48px] leading-none ${
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
      className={`relative inline-flex items-center rounded-full px-4 py-2 text-[13px] font-medium transition-colors ${
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
