"use client";

import * as React from "react";
import NumberFlow from "@number-flow/react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";

type TierId = "care" | "studio" | "atelier";
type BuildId = "none" | "light" | "standard" | "custom";

const TIER_PRICES: Record<TierId, number> = { care: 69, studio: 179, atelier: 399 };
const BUILD_PRICES: Record<BuildId, number> = { none: 0, light: 199, standard: 499, custom: 899 };

export type BuildCalculatorStrings = {
  tierLabel: string;
  buildLabel: string;
  monthsLabel: string;
  duringBuildLabel: string;
  afterBuildLabel: string;
  totalBuildLabel: string;
  ctaAuthenticated: string;
  ctaAnonymous: string;
  perMonth: string;
  buildOptions: { id: BuildId; name: string }[];
  tierOptions: { id: TierId; name: string }[];
};

export type AuthMode = {
  isOwner: boolean;
  subscribeAction: (formData: FormData) => Promise<void>;
};

/**
 * Interactive pricing calculator for /prijzen. The user picks a base
 * tier, an optional build extension, and a duration in months. Outputs
 * the during/after monthly costs and total spend during the build.
 *
 * For owners, the CTA submits a server action that creates a Stripe
 * Checkout session for the base plan plus a parallel add-on
 * subscription with `cancel_at` set to the build duration. Anonymous
 * visitors get a "plan a kennismaking" link to /contact.
 */
export function BuildCalculator({
  strings,
  authMode,
}: {
  strings: BuildCalculatorStrings;
  authMode?: AuthMode;
}) {
  const [tier, setTier] = React.useState<TierId>("studio");
  const [build, setBuild] = React.useState<BuildId>("standard");
  const [months, setMonths] = React.useState(4);

  const tierMonthly = TIER_PRICES[tier];
  const buildMonthly = BUILD_PRICES[build];
  const duringBuild = tierMonthly + buildMonthly;
  const afterBuild = tierMonthly;
  const totalBuild = buildMonthly * months;

  return (
    <div className="rounded-[28px] border border-(--color-border) bg-(--color-surface) p-8 md:p-10">
      <div className="grid gap-6 md:grid-cols-3">
        <Field label={strings.tierLabel}>
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value as TierId)}
            className="w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-[15px]"
          >
            {strings.tierOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} · €{TIER_PRICES[o.id]}/m
              </option>
            ))}
          </select>
        </Field>

        <Field label={strings.buildLabel}>
          <select
            value={build}
            onChange={(e) => setBuild(e.target.value as BuildId)}
            className="w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-[15px]"
          >
            {strings.buildOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
                {BUILD_PRICES[o.id] > 0 ? ` · +€${BUILD_PRICES[o.id]}/m` : ""}
              </option>
            ))}
          </select>
        </Field>

        <Field label={`${strings.monthsLabel}: ${months}`}>
          <input
            type="range"
            min={2}
            max={8}
            step={1}
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="w-full accent-(--color-accent)"
            disabled={build === "none"}
          />
        </Field>
      </div>

      <div className="mt-10 grid gap-6 border-t border-(--color-border) pt-8 md:grid-cols-3">
        <Output label={strings.duringBuildLabel} value={duringBuild} suffix={strings.perMonth} />
        <Output label={strings.afterBuildLabel} value={afterBuild} suffix={strings.perMonth} />
        <Output label={strings.totalBuildLabel} value={totalBuild} muted={build === "none"} />
      </div>

      <div className="mt-8 flex justify-end">
        {authMode?.isOwner ? (
          <form action={authMode.subscribeAction}>
            <input type="hidden" name="plan" value={tier} />
            <input type="hidden" name="build" value={build === "none" ? "" : build} />
            <input type="hidden" name="months" value={String(months)} />
            <Button type="submit" variant="accent">
              {strings.ctaAuthenticated}
            </Button>
          </form>
        ) : (
          <Button asChild variant="accent">
            <Link href="/contact">{strings.ctaAnonymous}</Link>
          </Button>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-[11px] tracking-widest text-(--color-muted) uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}

function Output({
  label,
  value,
  suffix,
  muted,
}: {
  label: string;
  value: number;
  suffix?: string;
  muted?: boolean;
}) {
  return (
    <div className={muted ? "opacity-50" : ""}>
      <span className="block font-mono text-[11px] tracking-widest text-(--color-muted) uppercase">
        {label}
      </span>
      <span className="mt-2 block font-serif text-[36px] leading-none">
        €<NumberFlow value={value} />
        {suffix ? (
          <span className="ml-1 align-baseline font-sans text-[14px] text-(--color-muted)">
            {suffix}
          </span>
        ) : null}
      </span>
    </div>
  );
}
