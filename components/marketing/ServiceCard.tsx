"use client";

import { motion, useReducedMotion } from "motion/react";
import {
  Database,
  Globe,
  BarChart3,
  Layers,
  ShieldCheck,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { ServicePreview } from "@/components/marketing/ServicePreview";

const ICONS: Record<string, LucideIcon> = {
  // legacy keys retained so the old asymmetric layout still compiles
  admin: Database,
  websites: Globe,
  webshops: BarChart3,
  // new keys for the 4-solution grid
  platform: Layers,
  webshop: BarChart3,
  care: ShieldCheck,
  growth: TrendingUp,
};

type PreviewId = "platform" | "webshop" | "care" | "growth";
const PREVIEW_KEYS = new Set<PreviewId>(["platform", "webshop", "care", "growth"]);
function hasPreview(k: string): k is PreviewId {
  return PREVIEW_KEYS.has(k as PreviewId);
}

export function ServiceCard({
  index,
  iconKey,
  title,
  body,
  bullets,
  ctaHref,
  ctaLabel,
  pricePill,
  large = false,
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
  large?: boolean;
}) {
  const reduce = useReducedMotion();
  const Icon = ICONS[iconKey];

  return (
    <motion.article
      initial={reduce ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      whileHover={reduce ? undefined : { y: -6 }}
      className={`group relative flex h-full flex-col overflow-hidden rounded-[20px] border border-(--color-border) bg-(--color-surface) shadow-[0_1px_2px_rgba(31,27,22,0.04),0_4px_12px_-4px_rgba(31,27,22,0.06),0_24px_48px_-16px_rgba(31,27,22,0.04)] transition-all duration-300 hover:border-(--color-accent)/40 hover:shadow-[0_2px_4px_rgba(31,27,22,0.06),0_8px_24px_-6px_rgba(201,97,79,0.18),0_32px_64px_-16px_rgba(31,27,22,0.12)] ${
        large ? "p-7 sm:p-11 md:row-span-2" : "p-7 sm:p-9"
      }`}
    >
      {/* Soft accent halo — verschijnt op hover, rechtsboven */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-20 -right-16 h-44 w-44 rounded-full bg-(--color-accent-soft) opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-70"
      />

      {/* Per-service mini-preview rechtsboven — decorative anker */}
      {hasPreview(iconKey as string) ? (
        <span
          aria-hidden
          className="pointer-events-none absolute top-5 right-5 hidden opacity-90 transition-all duration-500 group-hover:scale-[1.03] group-hover:opacity-100 sm:block"
        >
          <ServicePreview id={iconKey as PreviewId} />
        </span>
      ) : null}

      {/* Icon — rotates and fills on hover, per mockup */}
      <div className="relative mb-6 grid h-12 w-12 place-items-center rounded-[14px] bg-(--color-accent-soft) text-(--color-accent) transition-all duration-300 group-hover:scale-105 group-hover:rotate-[-6deg] group-hover:bg-(--color-accent) group-hover:text-white group-hover:shadow-[0_8px_20px_-4px_rgba(201,97,79,0.5)]">
        <Icon className="h-[22px] w-[22px]" strokeWidth={2} />
      </div>

      <h3
        className={`relative ${large ? "mb-2 text-[32px] leading-[1.1]" : "mb-2 text-[24px] leading-[1.1]"}`}
      >
        {title}
      </h3>
      {pricePill ? (
        <p className="mb-3 inline-flex w-fit items-center rounded-full border border-(--color-border) bg-(--color-bg-warm) px-2.5 py-1 font-mono text-[11px] tracking-wide text-(--color-accent)">
          {pricePill}
        </p>
      ) : null}
      <p className="text-[15px] leading-[1.6] text-(--color-muted)">{body}</p>

      {bullets ? (
        <ul className="mt-[22px] space-y-0 border-t border-(--color-border) pt-[22px]">
          {bullets.map((b) => (
            <li
              key={b}
              className="flex items-center gap-2.5 py-[5px] text-[14px] text-(--color-muted)"
            >
              <span className="h-1 w-1 shrink-0 rounded-full bg-(--color-accent)" aria-hidden />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {ctaHref && ctaLabel ? (
        <div className="mt-auto pt-6">
          <a
            href={ctaHref}
            className="inline-flex items-center gap-1 text-[14px] font-medium text-(--color-accent) hover:underline"
          >
            {ctaLabel} <span className="transition-transform group-hover:translate-x-0.5">→</span>
          </a>
        </div>
      ) : null}
    </motion.article>
  );
}
