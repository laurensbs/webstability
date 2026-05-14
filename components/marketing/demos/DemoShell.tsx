"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, ExternalLink, ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Gedeelde "browser-frame" voor de drie demo's onder /demo/[case].
 *
 * Bevat de top-bar met webstability-attributie + terug-link, het sidebar/
 * main-grid en een eenvoudig view-switcher mechanisme. Echte data zit
 * in de individuele case-pagina's; deze shell levert alleen de chrome.
 *
 * Doel is "voelt als een echt admin-paneel" zonder afhankelijkheden op
 * de productie-portal/admin layouts (auth, db, sessions). Statisch,
 * client-side, geanonimiseerd — geschikt om buiten in te demonstreren.
 */

export type DemoView = {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Optionele badge-count voor in de sidebar (rode pill). */
  badge?: number;
};

export type DemoShellProps = {
  /** Tekst-logo links bovenin de sidebar (bv. "Studio Stalling"). */
  brandName: string;
  /** Sub-tagline onder de brand. */
  brandSub: string;
  /** Achtergrondkleur van de sidebar — geeft elke demo een eigen sfeer. */
  accentColor: string;
  /** Tekstkleur op de sidebar (meestal lichte tint). */
  accentTextColor?: string;
  views: DemoView[];
  /** Render-prop: krijgt de actieve view-id, geeft het content-paneel terug. */
  children: (activeViewId: string) => React.ReactNode;
  /** Optionele link naar de klant-portaal versie (bv. /demo/stalling/portaal).
   * Toont een tweede knop in de top-banner zodat bezoekers tussen admin- en
   * klant-kant kunnen wisselen. */
  portalHref?: string;
};

export function DemoShell({
  brandName,
  brandSub,
  accentColor,
  accentTextColor = "#fff",
  views,
  children,
  portalHref,
}: DemoShellProps) {
  const [active, setActive] = React.useState(views[0]?.id ?? "");

  return (
    <div className="dotted-bg min-h-screen px-4 py-8 md:px-6 md:py-10">
      {/* Top demo-banner: maakt duidelijk dat dit een demo is, geeft een
          weg terug naar de marketing-site. */}
      <div className="mx-auto mb-4 flex max-w-6xl items-center justify-between gap-3 rounded-full border border-(--color-border) bg-(--color-surface) px-4 py-2 text-[12px]">
        <div className="flex items-center gap-2">
          <span className="rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-neutral-900 uppercase">
            Demo
          </span>
          <span className="text-(--color-muted)">
            <span className="hidden sm:inline">
              Geanonimiseerde demo van een productie-systeem.
            </span>{" "}
            Klikken werkt, niets wordt opgeslagen.
          </span>
        </div>
        <div className="flex items-center gap-3">
          {portalHref ? (
            <Link
              href={portalHref as never}
              className="inline-flex items-center gap-1 font-medium text-(--color-wine) hover:underline"
            >
              <span className="hidden sm:inline">Bekijk klantkant</span>
              <span className="sm:hidden">Klant</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : null}
          <Link
            href="/cases"
            className="inline-flex items-center gap-1 font-medium text-(--color-text) hover:text-(--color-accent)"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Cases</span>
            <span className="sm:hidden">Terug</span>
          </Link>
        </div>
      </div>

      {/* Het admin-frame */}
      <div className="rounded-modal shadow-floating mx-auto flex h-[min(820px,80vh)] max-w-6xl overflow-hidden border border-(--color-border) bg-(--color-surface)">
        {/* Sidebar */}
        <aside
          className="hidden w-[230px] shrink-0 flex-col p-4 md:flex"
          style={{ background: accentColor, color: accentTextColor }}
        >
          <div className="mb-6">
            <p className="text-[15px] leading-tight font-semibold">{brandName}</p>
            <p className="mt-1 text-[11px] opacity-70">{brandSub}</p>
          </div>

          <nav className="flex flex-1 flex-col gap-0.5">
            {views.map((v) => {
              const Icon = v.icon;
              const isActive = v.id === active;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setActive(v.id)}
                  className={`group flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-[13.5px] font-medium transition-colors ${
                    isActive ? "bg-white/15" : "hover:bg-white/8"
                  }`}
                  style={{
                    color: accentTextColor,
                    opacity: isActive ? 1 : 0.78,
                  }}
                >
                  <span className="inline-flex items-center gap-2.5">
                    <Icon className="h-4 w-4 shrink-0" />
                    {v.label}
                  </span>
                  {v.badge !== undefined && v.badge > 0 ? (
                    <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white/25 px-1.5 text-[10px] font-bold">
                      {v.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>

          <div className="mt-4 border-t border-white/15 pt-3">
            <a
              href="https://webstability.nl"
              className="flex items-center gap-1.5 text-[10.5px] font-medium tracking-widest uppercase opacity-60 hover:opacity-90"
            >
              Gebouwd door Webstability
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </aside>

        {/* Mobile view tabs */}
        <div className="flex w-full flex-col">
          <div
            className="flex shrink-0 overflow-x-auto border-b border-(--color-border) md:hidden"
            style={{ background: accentColor }}
          >
            {views.map((v) => {
              const isActive = v.id === active;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setActive(v.id)}
                  className="shrink-0 px-4 py-3 text-[12px] font-medium transition-opacity"
                  style={{
                    color: accentTextColor,
                    opacity: isActive ? 1 : 0.65,
                    borderBottom: isActive
                      ? `2px solid ${accentTextColor}`
                      : "2px solid transparent",
                  }}
                >
                  {v.label}
                </button>
              );
            })}
          </div>

          {/* Content — fade + subtiele upward-y bij view-switch.
              Zelfde easing als de rest van de site (RevealOnScroll). */}
          <main className="flex-1 overflow-y-auto bg-(--color-bg) p-6 md:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                {children(active)}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}

/**
 * Helper: kleine card met titel + waarde voor stats-row bovenin een dashboard.
 */
export function StatCard({
  label,
  value,
  hint,
  index = 0,
}: {
  label: string;
  value: string;
  hint?: string;
  /** Index in de rij — bepaalt stagger-delay voor mount-fade. */
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 + index * 0.05, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2 }}
      className="rounded-card border border-(--color-border) bg-(--color-surface) p-4 transition-shadow hover:shadow-sm"
    >
      <p className="font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
        {label}
      </p>
      <p className="mt-1 text-[24px] leading-tight font-semibold text-(--color-text)">{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-(--color-muted)">{hint}</p> : null}
    </motion.div>
  );
}

/**
 * Helper: simpele tabel-row met 3-4 cellen voor de demo-lijsten.
 */
export function DemoTable<T>({
  headers,
  rows,
  render,
}: {
  headers: string[];
  rows: T[];
  render: (row: T, index: number) => React.ReactNode[];
}) {
  return (
    <div className="rounded-card overflow-hidden border border-(--color-border) bg-(--color-surface)">
      <div
        className="grid border-b border-(--color-border) bg-(--color-bg-warm) px-4 py-2.5"
        style={{ gridTemplateColumns: `repeat(${headers.length}, minmax(0, 1fr))` }}
      >
        {headers.map((h) => (
          <p
            key={h}
            className="font-mono text-[10px] tracking-widest text-(--color-muted) uppercase"
          >
            {h}
          </p>
        ))}
      </div>
      <div className="divide-y divide-(--color-border)">
        {rows.map((row, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: 0.04 + Math.min(i, 8) * 0.025,
              duration: 0.22,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="grid cursor-pointer items-center px-4 py-3 text-[13px] text-(--color-text) transition-colors hover:bg-(--color-bg)"
            style={{ gridTemplateColumns: `repeat(${headers.length}, minmax(0, 1fr))` }}
          >
            {render(row, i).map((cell, ci) => (
              <div key={ci} className="truncate pr-2">
                {cell}
              </div>
            ))}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/**
 * Helper: status-badge voor in tabellen (success/warning/neutral).
 */
export function StatusBadge({
  variant,
  children,
}: {
  variant: "success" | "warning" | "neutral" | "danger";
  children: React.ReactNode;
}) {
  const styles: Record<typeof variant, string> = {
    success: "bg-emerald-100 text-emerald-800",
    warning: "bg-amber-100 text-amber-800",
    danger: "bg-rose-100 text-rose-800",
    neutral: "bg-neutral-100 text-neutral-700",
  };
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-[11px] font-medium ${styles[variant]}`}>
      {children}
    </span>
  );
}
