"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronDown,
  Layers,
  ShoppingBag,
  ShieldCheck,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { Link } from "@/i18n/navigation";

type ServiceItem = {
  title: string;
  blurb: string;
  price: string;
};

type CaseItem = {
  title: string;
  blurb: string;
};

export type MegaMenuStrings = {
  servicesEyebrow: string;
  servicesTitle: string;
  servicesFooter: string;
  items: {
    platform: ServiceItem;
    webshop: ServiceItem;
    care: ServiceItem;
    growth: ServiceItem;
  };
  casesEyebrow: string;
  casesTitle: string;
  casesFooter: string;
  caseItems: {
    caravan: CaseItem;
    marbella: CaseItem;
    voltauto: CaseItem;
  };
};

type Panel = "services" | "cases";

/**
 * Hover-driven mega-menu voor de marketing-nav. Eén shared panel-state
 * voor alle triggers zodat het menu blijft staan terwijl je horizontaal
 * tussen triggers swipe't (Linear-style). Sluit op pointer-leave van
 * een trigger of het panel met een 120ms grace-period zodat snelle
 * mouse-jumps niet flickeren. Sluit ook op Esc + click-outside.
 */
export function NavMegaMenu({
  strings,
  servicesLabel,
  casesLabel,
  servicesActive,
  casesActive,
}: {
  strings: MegaMenuStrings;
  servicesLabel: string;
  casesLabel: string;
  servicesActive: boolean;
  casesActive: boolean;
}) {
  const [open, setOpen] = React.useState<Panel | null>(null);
  const closeTimer = React.useRef<number | null>(null);
  const wrapperRef = React.useRef<HTMLDivElement>(null);

  const cancelClose = () => {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = window.setTimeout(() => setOpen(null), 120);
  };

  const openPanel = (p: Panel) => {
    cancelClose();
    setOpen(p);
  };

  // Esc sluit het menu
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Click-outside sluit het menu
  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative" onMouseLeave={scheduleClose}>
      <div className="flex items-center gap-8 text-[14.5px] font-medium">
        <Trigger
          label={servicesLabel}
          active={servicesActive}
          isOpen={open === "services"}
          onEnter={() => openPanel("services")}
          onClick={() => setOpen(open === "services" ? null : "services")}
        />
        <Trigger
          label={casesLabel}
          active={casesActive}
          isOpen={open === "cases"}
          onEnter={() => openPanel("cases")}
          onClick={() => setOpen(open === "cases" ? null : "cases")}
        />
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            key={open}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
            className="absolute top-full left-1/2 z-40 mt-3 w-[640px] max-w-[calc(100vw-3rem)] -translate-x-1/2"
          >
            {/* Hover-bridge — vult de gap tussen trigger en panel zodat
                de muis niet door 'lucht' hoeft. */}
            <div aria-hidden className="absolute -top-3 right-0 left-0 h-3" />

            <div
              className="overflow-hidden rounded-[18px] border border-t-2 border-(--color-border) border-t-(--color-wine)/70 bg-(--color-surface) text-(--color-text) shadow-[0_24px_60px_-16px_rgba(31,27,22,0.18),0_8px_20px_-4px_rgba(31,27,22,0.08)]"
              role="menu"
            >
              {open === "services" ? (
                <ServicesPanel strings={strings} onSelect={() => setOpen(null)} />
              ) : (
                <CasesPanel strings={strings} onSelect={() => setOpen(null)} />
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function Trigger({
  label,
  active,
  isOpen,
  onEnter,
  onClick,
}: {
  label: string;
  active: boolean;
  isOpen: boolean;
  onEnter: () => void;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onMouseEnter={onEnter}
      onFocus={onEnter}
      onClick={onClick}
      aria-expanded={isOpen}
      className={`inline-flex items-center gap-1 rounded transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--color-accent) ${
        active || isOpen ? "text-(--color-bg)" : "text-(--color-bg)/65 hover:text-(--color-bg)"
      }`}
    >
      {label}
      <ChevronDown
        className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
        strokeWidth={2.5}
      />
    </button>
  );
}

function ServicesPanel({ strings, onSelect }: { strings: MegaMenuStrings; onSelect: () => void }) {
  const items = [
    { key: "platform" as const, icon: Layers, href: "/diensten#platform" },
    { key: "webshop" as const, icon: ShoppingBag, href: "/diensten#webshop" },
    { key: "care" as const, icon: ShieldCheck, href: "/diensten#care" },
    { key: "growth" as const, icon: TrendingUp, href: "/diensten#growth" },
  ];

  return (
    <div>
      {/* Header strip met eyebrow + featured illustratie rechts */}
      <div className="flex items-center justify-between border-b border-(--color-border) bg-(--color-bg-warm)/40 px-6 py-3.5">
        <div>
          <p className="font-mono text-[10px] tracking-widest text-(--color-accent) uppercase">
            {strings.servicesEyebrow}
          </p>
          <p className="mt-0.5 text-[15px] font-medium">{strings.servicesTitle}</p>
        </div>
      </div>

      {/* 2x2 grid */}
      <ul className="grid grid-cols-2 gap-1 p-2">
        {items.map(({ key, icon: Icon, href }) => {
          const item = strings.items[key];
          return (
            <li key={key}>
              <Link
                href={href as never}
                onClick={onSelect}
                role="menuitem"
                className="group relative flex h-full flex-col gap-2 rounded-[12px] p-4 transition-colors hover:bg-(--color-bg-warm)/60 focus-visible:bg-(--color-bg-warm)/60 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-(--color-accent)"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-(--color-accent-soft) text-(--color-accent) transition-colors group-hover:bg-(--color-accent) group-hover:text-white">
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </span>
                <div>
                  <p className="text-[13.5px] leading-tight font-medium">{item.title}</p>
                  <p className="mt-1 text-[12px] leading-snug text-(--color-muted)">{item.blurb}</p>
                </div>
                <span className="mt-auto inline-flex items-center gap-1.5 font-mono text-[10px] tracking-wide text-(--color-wine) uppercase">
                  {item.price}
                  <ArrowRight className="h-2.5 w-2.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Footer-strip met "alle diensten" link */}
      <Link
        href="/diensten"
        onClick={onSelect}
        className="flex items-center justify-between border-t border-(--color-border) bg-(--color-bg-warm)/40 px-6 py-3 text-[12.5px] font-medium text-(--color-text) transition-colors hover:bg-(--color-bg-warm)"
      >
        <span>{strings.servicesFooter}</span>
        <ArrowRight className="h-3.5 w-3.5 text-(--color-accent)" />
      </Link>
    </div>
  );
}

function CasesPanel({ strings, onSelect }: { strings: MegaMenuStrings; onSelect: () => void }) {
  const items = [
    { key: "caravan" as const, href: "/cases#caravanstallingspanje", color: "#C9614F" },
    { key: "marbella" as const, href: "/cases#marbella-stays", color: "#6B1E2C" },
    { key: "voltauto" as const, href: "/cases#voltauto", color: "#5A7A4A" },
  ];

  return (
    <div>
      <div className="border-b border-(--color-border) bg-(--color-bg-warm)/40 px-6 py-3.5">
        <p className="font-mono text-[10px] tracking-widest text-(--color-accent) uppercase">
          {strings.casesEyebrow}
        </p>
        <p className="mt-0.5 text-[15px] font-medium">{strings.casesTitle}</p>
      </div>

      <ul className="grid grid-cols-3 gap-1 p-2">
        {items.map(({ key, href, color }) => {
          const item = strings.caseItems[key];
          return (
            <li key={key}>
              <Link
                href={href as never}
                onClick={onSelect}
                role="menuitem"
                className="group flex h-full flex-col rounded-[12px] p-3 transition-colors hover:bg-(--color-bg-warm)/60 focus-visible:bg-(--color-bg-warm)/60 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-(--color-accent)"
              >
                {/* Mini "screen" preview met accent-strepen */}
                <div className="relative mb-2.5 aspect-[16/10] overflow-hidden rounded-[8px] border border-(--color-border) bg-(--color-bg-warm)">
                  <div
                    className="absolute top-0 right-0 left-0 h-1.5"
                    style={{ background: color }}
                  />
                  <div className="absolute inset-x-3 top-3 space-y-1">
                    <span className="block h-1.5 w-2/3 rounded-full bg-(--color-text)/15" />
                    <span className="block h-1.5 w-1/2 rounded-full bg-(--color-text)/10" />
                  </div>
                  <div className="absolute right-3 bottom-3 left-3 grid grid-cols-3 gap-1">
                    <span className="h-2.5 rounded-sm bg-(--color-text)/10" />
                    <span className="h-2.5 rounded-sm" style={{ background: `${color}50` }} />
                    <span className="h-2.5 rounded-sm bg-(--color-text)/10" />
                  </div>
                  {/* Live-dot rechtsboven */}
                  <span className="absolute top-2.5 right-2.5 flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-(--color-success) opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-(--color-success)" />
                  </span>
                </div>
                <p className="text-[12.5px] leading-tight font-medium transition-colors group-hover:text-(--color-accent)">
                  {item.title}
                </p>
                <p className="mt-1 font-mono text-[10px] leading-snug text-(--color-muted)">
                  {item.blurb}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>

      <Link
        href="/cases"
        onClick={onSelect}
        className="flex items-center justify-between border-t border-(--color-border) bg-(--color-bg-warm)/40 px-6 py-3 text-[12.5px] font-medium text-(--color-text) transition-colors hover:bg-(--color-bg-warm)"
      >
        <span>{strings.casesFooter}</span>
        <ArrowRight className="h-3.5 w-3.5 text-(--color-accent)" />
      </Link>
    </div>
  );
}
