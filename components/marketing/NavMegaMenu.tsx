"use client";

import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import {
  ChevronDown,
  CalendarClock,
  UserSquare,
  Globe,
  ShoppingBag,
  LayoutGrid,
  Wrench,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { Link } from "@/i18n/navigation";

type VerticalItem = { title: string; blurb: string };
type CaseItem = { title: string; blurb: string };

export type MegaMenuStrings = {
  servicesEyebrow: string;
  servicesTitle: string;
  servicesFooter: string;
  configuratorLabel: string;
  items: {
    "verhuur-boekingssysteem": VerticalItem;
    "klantportaal-laten-bouwen": VerticalItem;
    "website-laten-maken": VerticalItem;
    "webshop-laten-maken": VerticalItem;
    "admin-systeem-op-maat": VerticalItem;
    "reparatie-portaal": VerticalItem;
  };
  casesEyebrow: string;
  casesTitle: string;
  casesFooter: string;
  caseItems: {
    caravanverhuur: CaseItem;
    caravanreparatie: CaseItem;
  };
};

type Panel = "services" | "cases";

type VerticalSlug = keyof MegaMenuStrings["items"];

const VERTICAL_ORDER: { slug: VerticalSlug; icon: LucideIcon }[] = [
  { slug: "verhuur-boekingssysteem", icon: CalendarClock },
  { slug: "klantportaal-laten-bouwen", icon: UserSquare },
  { slug: "website-laten-maken", icon: Globe },
  { slug: "webshop-laten-maken", icon: ShoppingBag },
  { slug: "admin-systeem-op-maat", icon: LayoutGrid },
  { slug: "reparatie-portaal", icon: Wrench },
];

/**
 * Hover-driven mega-menu voor de marketing-nav. Eén shared panel-state
 * voor alle triggers zodat het menu blijft staan terwijl je horizontaal
 * tussen triggers swipe't (Linear-style). Sluit op pointer-leave met
 * een 120ms grace-period, op Esc, en op click-outside.
 *
 * Diensten-panel = de zes echte verticals (3×2) + "vraag je website
 * aan"-tegel + "alle diensten". Werk-panel = de twee echte cases met
 * mini-screen-previews + "alle cases".
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
  const reduce = useReducedMotion();
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

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

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
      <div className="flex items-center gap-7 text-[14.5px] font-medium">
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
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
            className={`absolute top-full left-1/2 z-40 mt-3 -translate-x-1/2 ${
              open === "services" ? "w-[680px]" : "w-[520px]"
            } max-w-[calc(100vw-3rem)]`}
          >
            {/* Hover-bridge — vult de gap tussen trigger en panel */}
            <div aria-hidden className="absolute -top-3 right-0 left-0 h-3" />

            <div
              className="relative overflow-hidden rounded-[18px] border border-t-2 border-(--color-bg)/15 border-t-(--color-wine) bg-(--color-text) text-(--color-bg) shadow-[0_24px_60px_-16px_rgba(31,27,22,0.45),0_8px_20px_-4px_rgba(31,27,22,0.25)]"
              role="menu"
            >
              <span
                aria-hidden
                className="wb-soft-halo pointer-events-none absolute -top-24 -left-24 h-[280px] w-[280px] rounded-full bg-(--color-wine) opacity-30 blur-3xl"
              />
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
  return (
    <div className="relative">
      {/* Header strip */}
      <div className="flex items-center justify-between border-b border-(--color-bg)/10 bg-(--color-bg)/[0.03] px-6 py-3.5">
        <div>
          <p className="font-mono text-[10px] tracking-widest text-(--color-accent) uppercase">
            {"// "}
            {strings.servicesEyebrow}
          </p>
          <p className="mt-0.5 text-[15px] font-medium text-(--color-bg)">
            {strings.servicesTitle}
          </p>
        </div>
        {/* Quick-action: configurator */}
        <Link
          href={{ pathname: "/aanvragen" }}
          onClick={onSelect}
          className="hidden items-center gap-1.5 rounded-full bg-(--color-accent)/15 px-3 py-1.5 font-mono text-[10px] tracking-wide text-(--color-accent) uppercase transition-colors hover:bg-(--color-accent) hover:text-white sm:inline-flex"
        >
          {strings.configuratorLabel}
          <ArrowRight className="h-2.5 w-2.5" />
        </Link>
      </div>

      {/* 3×2 grid van de zes verticals */}
      <ul className="grid grid-cols-3 gap-1 p-2">
        {VERTICAL_ORDER.map(({ slug, icon: Icon }) => {
          const item = strings.items[slug];
          return (
            <li key={slug}>
              <Link
                href={{ pathname: "/diensten/[vertical]", params: { vertical: slug } }}
                onClick={onSelect}
                role="menuitem"
                className="group flex h-full flex-col gap-2 rounded-[12px] p-3.5 transition-colors hover:bg-(--color-bg)/[0.06] focus-visible:bg-(--color-bg)/[0.06] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-(--color-accent)"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-(--color-accent)/15 text-(--color-accent) transition-colors group-hover:bg-(--color-accent) group-hover:text-white">
                  <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
                <div>
                  <p className="text-[13px] leading-tight font-medium text-(--color-bg)">
                    {item.title}
                  </p>
                  <p className="mt-1 text-[11.5px] leading-snug text-(--color-bg)/60">
                    {item.blurb}
                  </p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Footer-strip */}
      <Link
        href={{ pathname: "/diensten" }}
        onClick={onSelect}
        className="flex items-center justify-between border-t border-(--color-bg)/10 bg-(--color-bg)/[0.03] px-6 py-3 text-[12.5px] font-medium text-(--color-bg) transition-colors hover:bg-(--color-bg)/[0.06]"
      >
        <span>{strings.servicesFooter}</span>
        <ArrowRight className="h-3.5 w-3.5 text-(--color-accent)" />
      </Link>
    </div>
  );
}

function CasesPanel({ strings, onSelect }: { strings: MegaMenuStrings; onSelect: () => void }) {
  const items = [
    {
      key: "caravanverhuur" as const,
      pathname: "/cases/caravanverhuurspanje" as const,
      color: "#C9614F",
    },
    {
      key: "caravanreparatie" as const,
      pathname: "/cases/caravanreparatiespanje" as const,
      color: "#5A7A4A",
    },
  ];

  return (
    <div className="relative">
      <div className="border-b border-(--color-bg)/10 bg-(--color-bg)/[0.03] px-6 py-3.5">
        <p className="font-mono text-[10px] tracking-widest text-(--color-accent) uppercase">
          {"// "}
          {strings.casesEyebrow}
        </p>
        <p className="mt-0.5 text-[15px] font-medium text-(--color-bg)">{strings.casesTitle}</p>
      </div>

      <ul className="grid grid-cols-2 gap-1 p-2">
        {items.map(({ key, pathname, color }) => {
          const item = strings.caseItems[key];
          return (
            <li key={key}>
              <Link
                href={{ pathname }}
                onClick={onSelect}
                role="menuitem"
                className="group flex h-full flex-col rounded-[12px] p-3 transition-colors hover:bg-(--color-bg)/[0.06] focus-visible:bg-(--color-bg)/[0.06] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-(--color-accent)"
              >
                {/* Mini "screen" preview met accent-strepen */}
                <div className="relative mb-2.5 aspect-[16/10] overflow-hidden rounded-[8px] border border-(--color-bg)/10 bg-(--color-bg)/[0.05]">
                  <div
                    className="absolute top-0 right-0 left-0 h-1.5"
                    style={{ background: color }}
                  />
                  <div className="absolute inset-x-3 top-3 space-y-1">
                    <span className="block h-1.5 w-2/3 rounded-full bg-(--color-bg)/25" />
                    <span className="block h-1.5 w-1/2 rounded-full bg-(--color-bg)/15" />
                  </div>
                  <div className="absolute right-3 bottom-3 left-3 grid grid-cols-3 gap-1">
                    <span className="h-2.5 rounded-sm bg-(--color-bg)/15" />
                    <span className="h-2.5 rounded-sm" style={{ background: color }} />
                    <span className="h-2.5 rounded-sm bg-(--color-bg)/15" />
                  </div>
                  <span className="absolute top-2.5 right-2.5 flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-(--color-success) opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-(--color-success)" />
                  </span>
                </div>
                <p className="text-[13px] leading-tight font-medium text-(--color-bg) transition-colors group-hover:text-(--color-accent)">
                  {item.title}
                </p>
                <p className="mt-1 font-mono text-[10.5px] leading-snug text-(--color-bg)/60">
                  {item.blurb}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>

      <Link
        href={{ pathname: "/cases" }}
        onClick={onSelect}
        className="flex items-center justify-between border-t border-(--color-bg)/10 bg-(--color-bg)/[0.03] px-6 py-3 text-[12.5px] font-medium text-(--color-bg) transition-colors hover:bg-(--color-bg)/[0.06]"
      >
        <span>{strings.casesFooter}</span>
        <ArrowRight className="h-3.5 w-3.5 text-(--color-accent)" />
      </Link>
    </div>
  );
}
