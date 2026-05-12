"use client";

import * as React from "react";
import NumberFlow from "@number-flow/react";
import { TrendingUp } from "lucide-react";

export type RoiCalculatorStrings = {
  eyebrow: string;
  title: string;
  lede: string;
  hoursLabel: string; // "Uren per week die je nu kwijt bent"
  hoursUnit: string; // "u/week"
  rateLabel: string; // "Wat is een uur van jou waard?"
  rateUnit: string; // "€/uur"
  monthlyLabel: string; // "bespaard per maand"
  yearlyLabel: string; // "bespaard per jaar"
  paybackLabel: string; // "tot een build van €8.000 terugverdiend is"
  paybackUnit: string; // "maanden"
  paybackMonthsName: string; // "maanden" (voor de zin)
  disclaimer: string; // "Indicatief — jouw situatie bepaalt het echte getal."
  /** Het build-bedrag waar de payback tegen afgezet wordt (default 8000). */
  buildAmount?: number;
};

/**
 * ROI / besparings-calculator voor /verhuur. Twee sliders: uren per
 * week die de bezoeker nu kwijt is aan admin/dubbele-boekingen, en hun
 * uurtarief. Outputs: €/maand bespaard, €/jaar, en hoeveel maanden tot
 * een typische build van €8k terugverdiend is. Maakt het abstracte
 * ("scheelt je tijd") concreet ("€960/maand, build terugverdiend in
 * ~8 maanden").
 *
 * Bewust geen lead-capture hier — het is een vertrouwens-tool, geen
 * formulier. De CTA staat elders op de pagina.
 */
export function RoiCalculator({ strings }: { strings: RoiCalculatorStrings }) {
  const [hoursPerWeek, setHoursPerWeek] = React.useState(5);
  const [hourlyRate, setHourlyRate] = React.useState(45);

  const buildAmount = strings.buildAmount ?? 8000;
  // ~4.33 weken per maand
  const monthlySaved = Math.round(hoursPerWeek * 4.33 * hourlyRate);
  const yearlySaved = monthlySaved * 12;
  const paybackMonths = monthlySaved > 0 ? Math.ceil(buildAmount / monthlySaved) : 0;

  const eurFmt = new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });

  return (
    <div className="rounded-modal border border-t-2 border-(--color-border) border-t-(--color-accent) bg-(--color-surface) p-7 md:p-10">
      <p className="inline-flex items-center gap-2 font-mono text-[10px] tracking-widest text-(--color-accent) uppercase">
        <TrendingUp className="h-3 w-3" strokeWidth={2.2} aria-hidden />
        {strings.eyebrow}
      </p>
      <h3 className="mt-2 font-serif text-[24px] leading-tight text-(--color-text) md:text-[28px]">
        {strings.title}
      </h3>
      <p className="mt-2 max-w-[60ch] text-[15px] leading-[1.6] text-(--color-muted)">
        {strings.lede}
      </p>

      <div className="mt-7 grid gap-6 md:grid-cols-2">
        <SliderField
          label={strings.hoursLabel}
          value={hoursPerWeek}
          min={1}
          max={20}
          step={1}
          unit={`${hoursPerWeek} ${strings.hoursUnit}`}
          onChange={setHoursPerWeek}
        />
        <SliderField
          label={strings.rateLabel}
          value={hourlyRate}
          min={20}
          max={120}
          step={5}
          unit={`€${hourlyRate} ${strings.rateUnit}`}
          onChange={setHourlyRate}
        />
      </div>

      <div className="mt-8 grid gap-4 border-t border-(--color-border) pt-8 sm:grid-cols-3">
        <Stat label={strings.monthlyLabel}>
          <NumberFlow
            value={monthlySaved}
            format={{ style: "currency", currency: "EUR", maximumFractionDigits: 0 }}
            locales="nl-NL"
          />
        </Stat>
        <Stat label={strings.yearlyLabel}>
          <NumberFlow
            value={yearlySaved}
            format={{ style: "currency", currency: "EUR", maximumFractionDigits: 0 }}
            locales="nl-NL"
          />
        </Stat>
        <Stat label={strings.paybackLabel.replace("{build}", eurFmt.format(buildAmount))}>
          <span>
            <NumberFlow value={paybackMonths} locales="nl-NL" />{" "}
            <span className="text-[18px] text-(--color-muted)">{strings.paybackUnit}</span>
          </span>
        </Stat>
      </div>

      <p className="mt-5 font-mono text-[11px] leading-[1.5] text-(--color-muted)">
        {strings.disclaimer.replace("{build}", eurFmt.format(buildAmount))}
      </p>
    </div>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-[13px] font-medium text-(--color-text)">{label}</label>
        <span className="font-mono text-[12px] text-(--color-accent)">{unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 w-full accent-(--color-accent)"
        aria-label={label}
      />
    </div>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="font-serif text-[32px] leading-none text-(--color-wine) md:text-[36px]">
        {children}
      </p>
      <p className="mt-2 max-w-[24ch] font-mono text-[10px] tracking-wide text-(--color-muted) uppercase">
        {label}
      </p>
    </div>
  );
}
