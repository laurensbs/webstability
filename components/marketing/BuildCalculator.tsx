"use client";

import * as React from "react";
import NumberFlow from "@number-flow/react";
import { Sparkles, Clock, Check } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import {
  TIER_PRICES,
  BUILD_PRICES,
  ENTRY_TIER,
  isLegacyTier,
  type TierId,
  type BuildId,
} from "@/lib/pricing";

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
  /** Korte intro-claim boven de calculator: "vaste prijs · 4 weken
   * levering · €5–8k". Centraal verhaal van de build-fee. */
  fixedPriceClaim: string;
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
  const [tier, setTier] = React.useState<TierId>(ENTRY_TIER);
  const [build, setBuild] = React.useState<BuildId>("standard");
  const [months, setMonths] = React.useState(4);

  const tierMonthly = TIER_PRICES[tier];
  const buildMonthly = BUILD_PRICES[build];
  const duringBuild = tierMonthly + buildMonthly;
  const afterBuild = tierMonthly;
  const totalBuild = buildMonthly * months;

  return (
    <div className="rounded-modal border border-(--color-border) bg-(--color-surface) p-8 md:p-10">
      {/* Build-claim — vaste prijs, 4 weken levering. Strategie-keuze:
          niet "AI-versneld" verkopen maar voorspelbaarheid. */}
      <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-(--color-wine)/20 bg-(--color-wine)/5 px-3 py-1 font-mono text-[11px] tracking-widest text-(--color-wine) uppercase">
        <Clock className="h-3 w-3" strokeWidth={2.2} aria-hidden />
        {strings.fixedPriceClaim}
      </p>
      <div className="grid gap-6 md:grid-cols-3">
        <Field label={strings.tierLabel}>
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value as TierId)}
            className="block min-h-11 w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-[15px]"
          >
            {strings.tierOptions
              .filter((o) => !isLegacyTier(o.id))
              .map((o) => (
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
            className="block min-h-11 w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-[15px]"
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
            className="h-3 w-full accent-(--color-wine) disabled:opacity-40 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:w-6"
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
          een herkenbaar projecttype zodat een leek weet wat hij koopt.
          Wijn-rode top-border claimt de "premium-insight"-status. */}
      <div className="rounded-card mt-6 flex items-start gap-3 border border-t-2 border-(--color-border) border-t-(--color-wine) bg-(--color-bg-warm) p-4 text-[14px] leading-[1.6] text-(--color-text)">
        <Sparkles
          className="mt-[3px] h-4 w-4 shrink-0 text-(--color-wine)"
          strokeWidth={2}
          aria-hidden
        />
        {build === "none" ? (
          <p className="min-w-0 break-words text-(--color-muted)">{strings.interpretationNone}</p>
        ) : (
          <p className="min-w-0 break-words">
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
  const duringPct = Math.min(80, Math.max(20, (months / VISUAL_MAX) * 100));
  return (
    <div role="img" aria-label={`${duringLabel} → ${afterLabel}`} className="space-y-3">
      {/* Maand-markers boven de bar — min-w voorkomt clipping op 320px */}
      <div className="relative h-4">
        <div className="absolute inset-x-0 top-0 flex items-start font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
          <span style={{ width: `${duringPct}%` }} className="flex min-w-[24px] justify-start">
            <span className="pl-1">M1</span>
          </span>
          <span className="flex min-w-[28px] flex-1 justify-start pl-2">
            <span>M{months + 1}+</span>
          </span>
        </div>
      </div>

      {/* Hoofd-balk — wijn-rood "tijdens" + accent-cream "doorlopend".
          Op mobile alleen icoon; vanaf sm: voluit. */}
      <div className="relative flex h-11 w-full overflow-hidden rounded-full border border-(--color-border) bg-(--color-bg)">
        <div
          className="relative flex h-full items-center justify-center gap-1.5 bg-(--color-wine) text-[12px] font-medium text-white transition-[width] duration-300"
          style={{ width: `${duringPct}%` }}
        >
          <Clock className="h-3.5 w-3.5 shrink-0" strokeWidth={2.2} aria-hidden />
          <span className="hidden truncate px-1 sm:inline">{duringLabel}</span>
          {/* Subtiele lichtflits voor "premium" feel */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 to-transparent"
          />
        </div>
        <div className="relative flex h-full flex-1 items-center justify-center gap-1.5 bg-(--color-accent-soft) text-[12px] font-medium text-(--color-text)">
          <Check
            className="h-3.5 w-3.5 shrink-0 text-(--color-success)"
            strokeWidth={2.5}
            aria-hidden
          />
          <span className="hidden truncate px-1 sm:inline">{afterLabel}</span>
        </div>
        <span
          aria-hidden
          className="pointer-events-none absolute top-0 bottom-0 w-px bg-(--color-text)/20"
          style={{ left: `${duringPct}%` }}
        />
      </div>

      {/* Bedragen — op mobile gestapeld, vanaf sm: naast elkaar */}
      <div className="flex flex-col gap-1 font-mono text-[11px] tracking-widest text-(--color-muted) uppercase sm:flex-row">
        <span className="text-(--color-wine) sm:flex sm:justify-start" style={{ width: `100%` }}>
          <span className="sm:block" style={{ width: `${duringPct}%` }}>
            €{duringMonthly}
            {perMonth} × {months}
          </span>
        </span>
        <span className="sm:flex sm:flex-1 sm:justify-start sm:pl-1">
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
