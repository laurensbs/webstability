"use client";

import { motion, useReducedMotion } from "motion/react";
import {
  Database,
  Globe,
  BarChart3,
  Layers,
  ShieldCheck,
  TrendingUp,
  Caravan,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  // legacy keys retained so the old asymmetric layout still compiles
  admin: Database,
  websites: Globe,
  webshops: BarChart3,
  // 4-solution grid
  verhuurplatform: Caravan,
  platform: Layers,
  webshop: BarChart3,
  care: ShieldCheck,
  growth: TrendingUp,
};

/**
 * Service-card in studio-stijl. Donkere bg, cream tekst, terracotta
 * icoon-tegel + accent prijs-pill. Geen mini-illustraties — schoon,
 * één visuele anker per card. Past bij StudioStatement / footer-zone-1
 * / NavMegaMenu palette.
 */
export function ServiceCard({
  index,
  iconKey,
  title,
  body,
  bullets,
  ctaHref,
  ctaLabel,
  pricePill,
}: {
  index: number;
  iconKey: keyof typeof ICONS;
  title: string;
  body: string;
  bullets?: string[];
  ctaHref?: string;
  ctaLabel?: string;
  /**
   * Short price + duration line shown right below the title, e.g.
   * "vanaf €6k · 6 mnd build" or "€95/m · doorlopend". Set when the
   * card represents a concrete pakket so visitors get the cost in the
   * same scan as the title.
   */
  pricePill?: string;
}) {
  const reduce = useReducedMotion();
  const Icon = ICONS[iconKey];

  return (
    <motion.article
      data-reveal-on-scroll=""
      initial={reduce ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      whileHover={reduce ? undefined : { y: -4 }}
      className="group relative flex h-full flex-col overflow-hidden rounded-[20px] border border-(--color-bg)/15 bg-(--color-text) p-7 text-(--color-bg) shadow-[0_1px_2px_rgba(31,27,22,0.04),0_8px_24px_-8px_rgba(31,27,22,0.18)] transition-all duration-300 hover:shadow-[0_2px_4px_rgba(31,27,22,0.08),0_24px_48px_-12px_rgba(107,30,44,0.32)] sm:p-9"
    >
      {/* Wijn-rode halo top-right voor depth — fade'd in op hover */}
      <span
        aria-hidden
        className="wb-soft-halo pointer-events-none absolute -top-24 -right-20 h-56 w-56 rounded-full bg-(--color-wine) opacity-25 blur-3xl transition-opacity duration-500 group-hover:opacity-50"
      />

      {/* Icon-tegel */}
      <div className="relative mb-6 grid h-12 w-12 place-items-center rounded-[14px] bg-(--color-accent)/15 text-(--color-accent) transition-all duration-300 group-hover:rotate-[-6deg] group-hover:bg-(--color-accent) group-hover:text-white group-hover:shadow-[0_8px_20px_-4px_rgba(201,97,79,0.5)]">
        <Icon className="h-[22px] w-[22px]" strokeWidth={2} />
      </div>

      <h3 className="relative mb-2 font-serif text-[26px] leading-[1.1] text-(--color-bg)">
        {title}
      </h3>
      {pricePill ? (
        <p className="relative mb-3 inline-flex w-fit items-center rounded-full border border-(--color-bg)/15 bg-(--color-bg)/[0.05] px-2.5 py-1 font-mono text-[11px] tracking-wide text-(--color-accent)">
          {pricePill}
        </p>
      ) : null}
      <p className="relative text-[15px] leading-[1.6] text-(--color-bg)/70">{body}</p>

      {bullets ? (
        <ul className="relative mt-[22px] space-y-0 border-t border-(--color-bg)/15 pt-[22px]">
          {bullets.map((b) => (
            <li
              key={b}
              className="flex items-center gap-2.5 py-[5px] text-[14px] text-(--color-bg)/70"
            >
              <span className="h-1 w-1 shrink-0 rounded-full bg-(--color-accent)" aria-hidden />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {ctaHref && ctaLabel ? (
        <div className="relative mt-auto pt-6">
          <a
            href={ctaHref}
            className="group/cta inline-flex items-center gap-1.5 rounded text-[14px] font-medium text-(--color-accent) transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)"
          >
            {ctaLabel}
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/cta:translate-x-0.5" />
          </a>
        </div>
      ) : null}
    </motion.article>
  );
}
