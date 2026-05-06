"use client";

import * as React from "react";
import NumberFlow from "@number-flow/react";
import { Sparkles } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";

type TierId = "care" | "studio" | "atelier";
type BuildId = "none" | "light" | "standard" | "custom";

const TIER_PRICES: Record<TierId, number> = { care: 95, studio: 179, atelier: 399 };
const BUILD_PRICES: Record<BuildId, number> = { none: 0, light: 349, standard: 499, custom: 899 };

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
  /** Mapping from build choice → projecttype-label, used in the
   * interpretation line under the calculator outputs. e.g.
   * { custom: "verhuurplatform op maat", standard: "webshop", … } */
  interpretationLabels: Record<BuildId, string>;
  /** Template for the interpretation line — use {project} as
   * placeholder for the value from interpretationLabels[build]. */
  interpretationTemplate: string;
  /** Template for "no build chosen" state — explains the months
   * slider only kicks in when a build is selected. */
  interpretationNone: string;
  /** Label voor het tijdens-build segment van de timeline-bar. Gebruik
   * {months} als placeholder voor het aantal maanden. */
  timelineDuring: string;
  /** Label voor het na-build segment van de timeline-bar. */
  timelineAfter: string;
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

      {/* Timeline-bar boven de outputs — visualiseert waarom er twee
          maandbedragen zijn. Tijdens-build segment vult een deel van de
          balk evenredig met de gekozen looptijd; daarna komt het reguliere
          maandbedrag. Bij build === "none" tonen we niets. */}
      {build !== "none" ? (
        <div className="mt-10 border-t border-(--color-border) pt-8">
          <Timeline
            months={months}
            duringMonthly={duringBuild}
            afterMonthly={afterBuild}
            duringLabel={strings.timelineDuring.replace("{months}", String(months))}
            afterLabel={strings.timelineAfter}
            perMonth={strings.perMonth}
          />
        </div>
      ) : null}

      <div
        className={`grid gap-6 ${build !== "none" ? "mt-8" : "mt-10 border-t border-(--color-border) pt-8"} md:grid-cols-3`}
      >
        <Output label={strings.duringBuildLabel} value={duringBuild} suffix={strings.perMonth} />
        <Output label={strings.afterBuildLabel} value={afterBuild} suffix={strings.perMonth} />
        <Output
          label={strings.totalBuildLabel}
          value={totalBuild}
          muted={build === "none"}
          accent={build !== "none"}
        />
      </div>

      {/* Interpretatie-zin onder de outputs — vertaalt het getal naar
          een herkenbaar projecttype zodat een leek weet wat hij koopt. */}
      <div className="mt-6 rounded-[14px] border border-(--color-border) bg-(--color-bg-warm) p-4 text-[14px] leading-[1.6] text-(--color-text)">
        {build === "none" ? (
          <p className="text-(--color-muted)">{strings.interpretationNone}</p>
        ) : (
          <p>
            {strings.interpretationTemplate.replace(
              "{project}",
              strings.interpretationLabels[build] ?? "",
            )}
          </p>
        )}
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

function Timeline({
  months,
  duringMonthly,
  afterMonthly,
  duringLabel,
  afterLabel,
  perMonth,
}: {
  months: number;
  duringMonthly: number;
  afterMonthly: number;
  duringLabel: string;
  afterLabel: string;
  perMonth: string;
}) {
  // Schaal: maximum visuele looptijd is 12 maanden zodat 8-mnd builds
  // niet de hele balk vullen — zo blijft het na-build segment zichtbaar.
  const VISUAL_MAX = 12;
  const duringPct = Math.min(95, Math.max(20, (months / VISUAL_MAX) * 100));
  return (
    <div role="img" aria-label={`${duringLabel} → ${afterLabel}`} className="space-y-2">
      <div className="flex h-9 w-full overflow-hidden rounded-full border border-(--color-border) bg-(--color-bg)">
        <div
          className="flex h-full items-center justify-center bg-(--color-accent) text-[12px] font-medium text-white transition-[width] duration-300"
          style={{ width: `${duringPct}%` }}
        >
          <span className="truncate px-3">{duringLabel}</span>
        </div>
        <div className="relative flex h-full flex-1 items-center justify-center bg-[repeating-linear-gradient(45deg,var(--color-bg-warm)_0_8px,var(--color-bg)_8px_16px)] text-[12px] font-medium text-(--color-text)">
          <span className="truncate px-3">{afterLabel}</span>
        </div>
      </div>
      <div className="flex justify-between font-mono text-[11px] tracking-widest text-(--color-muted) uppercase">
        <span>
          €{duringMonthly}
          {perMonth} × {months}
        </span>
        <span>
          €{afterMonthly}
          {perMonth}
        </span>
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
  accent,
}: {
  label: string;
  value: number;
  suffix?: string;
  muted?: boolean;
  /** Accent-output (zoals 'totaal voor build') krijgt een sparkle-icon
   * naast het label zodat het belangrijkste getal eruit springt. */
  accent?: boolean;
}) {
  return (
    <div className={muted ? "opacity-50" : ""}>
      <span className="flex items-center gap-1.5 font-mono text-[11px] tracking-widest text-(--color-muted) uppercase">
        {label}
        {accent ? (
          <Sparkles className="h-3 w-3 text-(--color-accent)" aria-hidden strokeWidth={2} />
        ) : null}
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
