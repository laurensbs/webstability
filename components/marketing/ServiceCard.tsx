"use client";

import { motion, useReducedMotion } from "motion/react";
import { Database, Globe, BarChart3, Check, type LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  admin: Database,
  websites: Globe,
  webshops: BarChart3,
};

export function ServiceCard({
  index,
  iconKey,
  title,
  body,
  bullets,
  ctaHref,
  ctaLabel,
  large = false,
}: {
  index: number;
  iconKey: keyof typeof ICONS;
  title: string;
  body: string;
  bullets?: string[];
  ctaHref?: string;
  ctaLabel?: string;
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
      className={`group relative flex h-full flex-col overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface) p-8 transition-shadow duration-300 hover:shadow-[0_12px_32px_-16px_rgba(31,27,22,0.16)] ${
        large ? "md:row-span-2" : ""
      }`}
    >
      {/* Soft accent halo behind the icon, only visible on hover. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-(--color-accent-soft) opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-70"
      />
      <div className="relative flex flex-1 flex-col">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-md border border-(--color-border) bg-(--color-bg-warm) text-(--color-accent) transition-colors duration-300 group-hover:border-(--color-accent) group-hover:bg-(--color-accent-soft)">
          <Icon className="h-5 w-5" />
        </div>
        <h3 className={large ? "mt-6 text-3xl" : "mt-6 text-2xl"}>{title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-(--color-muted)">{body}</p>

        {bullets ? (
          <ul className="mt-5 space-y-2.5">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-sm">
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0 text-(--color-accent)"
                  strokeWidth={2.5}
                />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {ctaHref && ctaLabel ? (
          <a
            href={ctaHref}
            className="mt-auto inline-flex items-center gap-1.5 pt-6 font-mono text-xs tracking-wide text-(--color-accent) hover:underline"
          >
            {ctaLabel}
            <span className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
          </a>
        ) : null}
      </div>
    </motion.article>
  );
}
