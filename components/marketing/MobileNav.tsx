"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { motion, useReducedMotion } from "motion/react";
import { Menu, X, ArrowRight, KeyRound } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { LangSwitcher } from "@/components/shared/LangSwitcher";
import type { MegaMenuStrings } from "@/components/marketing/NavMegaMenu";
import { VERTICAL_SLUGS } from "@/lib/verticals";
import { VERTICAL_ICONS } from "@/lib/vertical-icons";
import { CalPopupTrigger } from "@/components/marketing/CalPopupTrigger";

type PlainLink = { href: string; label: string };

/**
 * Mobile nav drawer. Hamburger rechts van de wordmark op mobiel, opent
 * een full-height Radix Dialog: brand-paneel bovenaan, tagline op donker,
 * een prominente "vraag je website aan"-knop, dan de zes verticals als
 * sub-lijst onder "Diensten", de twee cases, en de plain links — footer
 * met login + lang + de Cal-popup-CTA (consistent met desktop).
 *
 * Auto-sluit op route-navigatie via een onClick-handler. De Cal-CTA en
 * de verticals-links sluiten de drawer voordat ze navigeren.
 */
export function MobileNav({
  servicesLabel,
  casesLabel,
  menuStrings,
  otherLinks,
  aanvragenLabel,
  ctaLabel,
  loginLabel,
  liveBadge,
  tagline,
  locale,
}: {
  servicesLabel: string;
  casesLabel: string;
  menuStrings: MegaMenuStrings;
  otherLinks: PlainLink[];
  aanvragenLabel: string;
  ctaLabel: string;
  loginLabel: string;
  liveBadge: string;
  tagline: string;
  locale?: string;
}) {
  const [open, setOpen] = React.useState(false);
  // Cal-popup leeft als sibling — wordt deferred geopend nadat de drawer
  // dicht is, anders krijgen Radix' twee dialogs een focus-trap-conflict
  // op mobiel (zie comment bij de CTA hieronder).
  const [calOpen, setCalOpen] = React.useState(false);
  const pathname = usePathname();
  const reduce = useReducedMotion() ?? false;
  const close = React.useCallback(() => setOpen(false), []);

  const isActive = (target: string) =>
    target === "/" ? pathname === "/" : pathname.startsWith(target);

  // Eén gestaggerde drawer-sectie: ~50ms na de vorige, vanaf 80ms nadat het
  // paneel binnenschuift. Reduced motion → meteen zichtbaar, geen y-offset.
  const sectionAnim = (index: number) => ({
    initial: reduce ? false : ({ opacity: 0, y: 10 } as const),
    animate: { opacity: 1, y: 0 },
    transition: { delay: 0.08 + index * 0.05, duration: 0.3, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          aria-label="Open menu"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-(--color-bg)/40 bg-(--color-bg)/10 text-(--color-bg) transition-colors hover:border-(--color-bg)/70 hover:bg-(--color-bg)/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent) md:hidden"
        >
          <Menu className="h-5 w-5" strokeWidth={2} aria-hidden />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out fixed inset-0 z-40 bg-(--color-text)/40 backdrop-blur-sm md:hidden" />

        <Dialog.Content
          aria-describedby={undefined}
          className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right fixed top-0 right-0 z-50 flex h-full w-full max-w-md flex-col border-t-2 border-(--color-wine) bg-(--color-bg) shadow-2xl md:hidden"
        >
          <Dialog.Title className="sr-only">Navigatie</Dialog.Title>

          {/* Top bar — wordmark + close */}
          <div className="flex items-center justify-between border-b border-(--color-border) px-6 py-4">
            <span className="inline-flex items-center text-[18px] font-extrabold tracking-[-0.045em] text-(--color-text)">
              webstability<span className="text-(--color-accent)">.</span>
            </span>
            <Dialog.Close asChild>
              <button
                aria-label="Sluit menu"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-(--color-border) bg-(--color-surface) text-(--color-text) transition-colors hover:border-(--color-accent)/50"
              >
                <X className="h-5 w-5" strokeWidth={2} aria-hidden />
              </button>
            </Dialog.Close>
          </div>

          {/* Tagline op donker */}
          <div className="border-b border-(--color-border) bg-(--color-text) px-6 py-5 text-(--color-bg)">
            <p className="font-mono text-[10px] tracking-widest text-(--color-bg)/55 uppercase">
              {liveBadge}
            </p>
            <p className="mt-2 text-[16px] leading-[1.4]">{tagline}</p>
          </div>

          <nav className="flex-1 overflow-y-auto px-6 py-6">
            {/* Prominente configurator-knop */}
            <motion.div {...sectionAnim(0)}>
              <Link
                href={{ pathname: "/aanvragen" }}
                onClick={close}
                className="group mb-6 flex items-center justify-between rounded-xl bg-(--color-accent) px-4 py-3 text-[15px] font-medium text-white transition-all hover:bg-(--color-accent)/90"
              >
                {aanvragenLabel}
                <ArrowRight
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  strokeWidth={2}
                  aria-hidden
                />
              </Link>
            </motion.div>

            {/* Diensten + de zes verticals */}
            <motion.div {...sectionAnim(1)}>
              <p className="mb-2 font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
                {servicesLabel}
              </p>
              <ul className="mb-5 space-y-0.5">
                <li>
                  <Link
                    href={{ pathname: "/diensten" }}
                    onClick={close}
                    className={`flex items-center justify-between rounded-md px-3 py-2.5 text-[15px] font-medium transition-colors ${
                      pathname === "/diensten"
                        ? "bg-(--color-bg-warm) text-(--color-accent)"
                        : "text-(--color-text) hover:bg-(--color-bg-warm)"
                    }`}
                  >
                    {menuStrings.servicesFooter.replace(" →", "")}
                    <ArrowRight
                      className="h-3.5 w-3.5 text-(--color-muted)"
                      strokeWidth={2}
                      aria-hidden
                    />
                  </Link>
                </li>
                {VERTICAL_SLUGS.map((slug) => {
                  const Icon = VERTICAL_ICONS[slug];
                  return (
                    <li key={slug}>
                      <Link
                        href={{ pathname: "/diensten/[vertical]", params: { vertical: slug } }}
                        onClick={close}
                        className="group flex items-center gap-2.5 rounded-md py-2 pr-3 pl-6 text-[14px] text-(--color-muted) transition-colors hover:bg-(--color-bg-warm) hover:text-(--color-text)"
                      >
                        <Icon
                          className="h-3.5 w-3.5 shrink-0 text-(--color-accent)/70 transition-colors group-hover:text-(--color-accent)"
                          strokeWidth={2}
                          aria-hidden
                        />
                        {menuStrings.items[slug].title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </motion.div>

            {/* Werk / cases */}
            <motion.div {...sectionAnim(2)}>
              <p className="mb-2 font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
                {casesLabel}
              </p>
              <ul className="mb-5 space-y-0.5">
                <li>
                  <Link
                    href={{ pathname: "/cases/caravanverhuurspanje" }}
                    onClick={close}
                    className="block rounded-md px-3 py-2.5 text-[15px] text-(--color-text) transition-colors hover:bg-(--color-bg-warm)"
                  >
                    {menuStrings.caseItems.caravanverhuur.title}
                  </Link>
                </li>
                <li>
                  <Link
                    href={{ pathname: "/cases/caravanreparatiespanje" }}
                    onClick={close}
                    className="block rounded-md px-3 py-2.5 text-[15px] text-(--color-text) transition-colors hover:bg-(--color-bg-warm)"
                  >
                    {menuStrings.caseItems.caravanreparatie.title}
                  </Link>
                </li>
                <li>
                  <Link
                    href={{ pathname: "/cases" }}
                    onClick={close}
                    className="flex items-center justify-between rounded-md px-3 py-2.5 text-[14px] text-(--color-muted) transition-colors hover:bg-(--color-bg-warm) hover:text-(--color-text)"
                  >
                    {menuStrings.casesFooter.replace(" →", "")}
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                  </Link>
                </li>
              </ul>
            </motion.div>

            {/* Overige plain links */}
            <motion.div {...sectionAnim(3)}>
              <ul className="space-y-0.5 border-t border-(--color-border) pt-4">
                {otherLinks.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href as never}
                      onClick={close}
                      className={`flex items-center justify-between rounded-md px-3 py-2.5 text-[15px] font-medium transition-colors ${
                        isActive(l.href)
                          ? "bg-(--color-bg-warm) text-(--color-accent)"
                          : "text-(--color-text) hover:bg-(--color-bg-warm)"
                      }`}
                    >
                      {l.label}
                      <ArrowRight
                        className="h-3.5 w-3.5 text-(--color-muted)"
                        strokeWidth={2}
                        aria-hidden
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          </nav>

          {/* Footer — login + lang + CTA. CTA opent dezelfde Cal-popup als
              op desktop, maar via een deferred handoff: drawer eerst dicht,
              ~250ms later popup open. Twee gestapelde Radix Dialogs geven
              anders focus-trap- en scroll-lock-conflicten op mobiel. */}
          <div className="space-y-4 border-t border-(--color-border) px-6 py-5">
            <div className="flex items-center justify-between">
              <Link
                href={{ pathname: "/login" }}
                onClick={close}
                className="inline-flex items-center gap-2 font-mono text-[11px] tracking-widest text-(--color-muted) uppercase transition-colors hover:text-(--color-text)"
              >
                <KeyRound className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                {loginLabel}
              </Link>
              <LangSwitcher />
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                window.setTimeout(() => setCalOpen(true), 250);
              }}
              className="group hover:shadow-glow inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-(--color-accent) px-4 py-3 text-[14px] font-medium text-white transition-all hover:bg-(--color-accent)/90"
            >
              {ctaLabel}
              <ArrowRight
                className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
                strokeWidth={2}
                aria-hidden
              />
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>

      {/* Sibling-popup — controlled door de mobile-nav state. hideTrigger=true
          zodat alleen de Dialog rendert, geen extra knop. */}
      <CalPopupTrigger locale={locale} open={calOpen} onOpenChange={setCalOpen} hideTrigger />
    </Dialog.Root>
  );
}
