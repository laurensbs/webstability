"use client";

import * as React from "react";
import { motion } from "motion/react";
import { CalendarClock, LayoutDashboard, LayoutGrid, Wrench, Check } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";

/**
 * Hoofdtabel op /prijzen — vier panelen op vaste maandprijs.
 *
 * Pas de prijzen niet hier aan; ze komen uit lib/verticals.ts
 * (PANEL_MONTHLY_PRICE) en worden door de pagina als prop
 * doorgegeven. Eén plek, hele site volgt.
 */

type PanelKey = "verhuur" | "klantportaal" | "reparatie" | "admin";

const ICONS: Record<PanelKey, LucideIcon> = {
  verhuur: CalendarClock,
  klantportaal: LayoutDashboard,
  reparatie: Wrench,
  admin: LayoutGrid,
};

export type Panel = {
  key: PanelKey;
  label: string;
  blurb: string;
  monthly: number;
  features: string[];
  /** Markeert de meest-gekozen / aanbevolen kaart. */
  featured?: boolean;
  /** Label dat in de featured-pill verschijnt. */
  featuredLabel?: string;
};

export function PanelPricingTable({
  panels,
  ctaLabel,
  perMonthLabel,
  allInclusiveLabel,
}: {
  panels: Panel[];
  ctaLabel: string;
  perMonthLabel: string;
  allInclusiveLabel: string;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {panels.map((p, i) => {
        const Icon = ICONS[p.key];
        return (
          <motion.div
            key={p.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + i * 0.05, duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -3 }}
            className={`rounded-modal relative flex flex-col gap-5 border border-t-2 bg-(--color-surface) p-7 transition-shadow hover:shadow-lg md:p-8 ${
              p.featured
                ? "border-(--color-accent)/30 border-t-(--color-accent)"
                : "border-(--color-border) border-t-(--color-wine)"
            }`}
          >
            {p.featured && p.featuredLabel ? (
              <span className="absolute -top-3 right-7 rounded-full bg-(--color-accent) px-3 py-0.5 font-mono text-[10px] tracking-widest text-white uppercase">
                {p.featuredLabel}
              </span>
            ) : null}

            {/* Icon + naam */}
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex h-11 w-11 items-center justify-center rounded-full ${
                  p.featured
                    ? "bg-(--color-accent)/10 text-(--color-accent)"
                    : "bg-(--color-wine)/10 text-(--color-wine)"
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[18px] font-medium text-(--color-text)">{p.label}</p>
                <p className="text-[13px] text-(--color-muted)">{p.blurb}</p>
              </div>
            </div>

            {/* Prijs */}
            <div>
              <p className="font-serif text-[40px] leading-none text-(--color-text)">
                €{p.monthly}
                <span className="ml-1 text-[14px] font-normal text-(--color-muted)">
                  / {perMonthLabel}
                </span>
              </p>
              <p className="mt-1 font-mono text-[10.5px] tracking-widest text-(--color-muted) uppercase">
                {allInclusiveLabel}
              </p>
            </div>

            {/* Features */}
            <ul className="flex flex-col gap-2 border-t border-(--color-border) pt-5">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[14px]">
                  <Check
                    className={`mt-0.5 h-4 w-4 shrink-0 ${p.featured ? "text-(--color-accent)" : "text-(--color-wine)"}`}
                  />
                  <span className="text-(--color-text)">{f}</span>
                </li>
              ))}
            </ul>

            {/* CTA — naar /aanvragen met paneel-anker */}
            <Link
              href={{ pathname: "/aanvragen" } as never}
              className={`mt-auto inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-[13px] font-medium transition-opacity hover:opacity-90 ${
                p.featured
                  ? "bg-(--color-accent) text-white"
                  : "bg-(--color-wine) text-(--color-bg)"
              }`}
            >
              {ctaLabel}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
