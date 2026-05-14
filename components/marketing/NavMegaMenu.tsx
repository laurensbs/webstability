"use client";

import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { ChevronDown, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { VERTICAL_SLUGS } from "@/lib/verticals";
import { VERTICAL_ICONS } from "@/lib/vertical-icons";

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

/**
 * Hover-driven mega-menu voor de marketing-nav. Eén shared panel-state
 * voor alle triggers zodat het menu blijft staan terwijl je horizontaal
 * tussen triggers swipe't (Linear-style). Sluit op pointer-leave met een
 * 120ms grace-period, op Esc, en op click-outside.
 *
 * Toetsenbord: triggers openen op focus; binnen een open panel verplaatsen
 * pijltjes de focus tussen de menu-items, Home/End springen naar eerste/
 * laatste, Esc sluit en zet focus terug op de trigger.
 *
 * Diensten-panel = de zes verticals (3×2, volgorde + iconen uit
 * lib/verticals.ts + lib/vertical-icons.ts) + "vraag aan"-chip + "alle
 * diensten". Werk-panel = de twee cases met mini-screen-previews + "alle
 * cases". `useReducedMotion`-safe.
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
  const panelRef = React.useRef<HTMLDivElement>(null);
  const servicesTriggerRef = React.useRef<HTMLButtonElement>(null);
  const casesTriggerRef = React.useRef<HTMLButtonElement>(null);

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
  const closeAndRefocus = React.useCallback(() => {
    const which = open;
    setOpen(null);
    (which === "services" ? servicesTriggerRef : casesTriggerRef).current?.focus();
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAndRefocus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeAndRefocus]);

  React.useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  // Pijltjes-navigatie binnen het open panel — werkt op alle role="menuitem"
  // anchors (de grid leest visueel als 3×2 maar lineair navigeren is voor
  // toetsenbord prima en eenvoudig robuust).
  const onPanelKeyDown = (e: React.KeyboardEvent) => {
    const nav = ["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft", "Home", "End"];
    if (!nav.includes(e.key)) return;
    const items = Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [],
    );
    if (items.length === 0) return;
    const idx = items.indexOf(document.activeElement as HTMLElement);
    e.preventDefault();
    let next = idx;
    if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    else if (e.key === "ArrowDown" || e.key === "ArrowRight")
      next = idx < 0 ? 0 : (idx + 1) % items.length;
    else next = idx <= 0 ? items.length - 1 : idx - 1;
    items[next]?.focus();
  };

  return (
    <div ref={wrapperRef} className="relative" onMouseLeave={scheduleClose}>
      <div className="flex items-center gap-7 text-[14.5px] font-medium">
        <Trigger
          ref={servicesTriggerRef}
          label={servicesLabel}
          active={servicesActive}
          isOpen={open === "services"}
          onEnter={() => openPanel("services")}
          onClick={() => setOpen(open === "services" ? null : "services")}
        />
        <Trigger
          ref={casesTriggerRef}
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
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
            className={`absolute top-full left-1/2 z-40 mt-3 -translate-x-1/2 ${
              open === "services" ? "w-[680px]" : "w-[520px]"
            } max-w-[calc(100vw-3rem)]`}
          >
            {/* Hover-bridge — vult de gap tussen trigger en panel */}
            <div aria-hidden className="absolute -top-3 right-0 left-0 h-3" />

            <div
              ref={panelRef}
              onKeyDown={onPanelKeyDown}
              className="shadow-modal rounded-panel relative overflow-hidden border border-t-2 border-(--color-bg)/15 border-t-(--color-wine) bg-(--color-text) text-(--color-bg)"
              role="menu"
            >
              <span
                aria-hidden
                className="wb-soft-halo pointer-events-none absolute -top-24 -left-24 h-[280px] w-[280px] rounded-full bg-(--color-wine) opacity-30 blur-3xl"
              />
              {open === "services" ? (
                <ServicesPanel strings={strings} onSelect={() => setOpen(null)} />
              ) : (
                <CasesPanel strings={strings} onSelect={() => setOpen(null)} reduce={reduce} />
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

const Trigger = React.forwardRef<
  HTMLButtonElement,
  {
    label: string;
    active: boolean;
    isOpen: boolean;
    onEnter: () => void;
    onClick: () => void;
  }
>(function Trigger({ label, active, isOpen, onEnter, onClick }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      onMouseEnter={onEnter}
      onFocus={onEnter}
      onClick={onClick}
      aria-expanded={isOpen}
      aria-haspopup="menu"
      className={`inline-flex items-center gap-1 rounded transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--color-accent) ${
        active || isOpen ? "text-(--color-bg)" : "text-(--color-bg)/65 hover:text-(--color-bg)"
      }`}
    >
      {label}
      <ChevronDown
        className={`h-3 w-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        strokeWidth={2}
        aria-hidden
      />
    </button>
  );
});

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
          className="group hidden items-center gap-1.5 rounded-full bg-(--color-accent)/15 px-3 py-1.5 font-mono text-[10px] tracking-wide text-(--color-accent) uppercase transition-colors hover:bg-(--color-accent) hover:text-white sm:inline-flex"
        >
          {strings.configuratorLabel}
          <ArrowRight
            className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
            strokeWidth={2}
            aria-hidden
          />
        </Link>
      </div>

      {/* 3×2 grid van de zes verticals — volgorde + iconen uit één bron */}
      <ul className="grid grid-cols-3 gap-1 p-2">
        {VERTICAL_SLUGS.map((slug) => {
          const Icon = VERTICAL_ICONS[slug];
          const item = strings.items[slug];
          return (
            <li key={slug}>
              <Link
                href={{ pathname: "/diensten/[vertical]", params: { vertical: slug } }}
                onClick={onSelect}
                role="menuitem"
                className="group rounded-card flex h-full flex-col gap-2 p-3.5 transition-colors hover:bg-(--color-bg)/[0.06] focus-visible:bg-(--color-bg)/[0.06] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-(--color-accent)"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-(--color-accent)/15 text-(--color-accent) transition-colors duration-150 group-hover:bg-(--color-accent) group-hover:text-white group-focus-visible:bg-(--color-accent) group-focus-visible:text-white">
                  <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
                </span>
                <div>
                  <p className="relative inline-block text-[13px] leading-tight font-medium text-(--color-bg) after:absolute after:-bottom-px after:left-0 after:h-px after:w-0 after:bg-(--color-accent) after:transition-[width] after:duration-200 group-hover:after:w-full group-focus-visible:after:w-full">
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
        className="group flex items-center justify-between border-t border-(--color-bg)/10 bg-(--color-bg)/[0.03] px-6 py-3 text-[12.5px] font-medium text-(--color-bg) transition-colors hover:bg-(--color-bg)/[0.06]"
      >
        <span>{strings.servicesFooter}</span>
        <ArrowRight
          className="h-3.5 w-3.5 text-(--color-accent) transition-transform group-hover:translate-x-0.5"
          strokeWidth={2}
          aria-hidden
        />
      </Link>
    </div>
  );
}

function CasesPanel({
  strings,
  onSelect,
  reduce,
}: {
  strings: MegaMenuStrings;
  onSelect: () => void;
  reduce: boolean | null;
}) {
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
              <Link href={{ pathname }} onClick={onSelect} role="menuitem" className="block">
                <motion.span
                  whileHover={reduce ? undefined : { y: -2 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="group rounded-card flex h-full flex-col p-3 transition-colors hover:bg-(--color-bg)/[0.06] focus-visible:bg-(--color-bg)/[0.06] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-(--color-accent)"
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
                </motion.span>
              </Link>
            </li>
          );
        })}
      </ul>

      <Link
        href={{ pathname: "/cases" }}
        onClick={onSelect}
        className="group flex items-center justify-between border-t border-(--color-bg)/10 bg-(--color-bg)/[0.03] px-6 py-3 text-[12.5px] font-medium text-(--color-bg) transition-colors hover:bg-(--color-bg)/[0.06]"
      >
        <span>{strings.casesFooter}</span>
        <ArrowRight
          className="h-3.5 w-3.5 text-(--color-accent) transition-transform group-hover:translate-x-0.5"
          strokeWidth={2}
          aria-hidden
        />
      </Link>
    </div>
  );
}
