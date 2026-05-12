"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X, ArrowRight, KeyRound } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { LangSwitcher } from "@/components/shared/LangSwitcher";
import type { MegaMenuStrings } from "@/components/marketing/NavMegaMenu";

type PlainLink = { href: string; label: string };

const VERTICAL_SLUGS = [
  "verhuur-boekingssysteem",
  "klantportaal-laten-bouwen",
  "website-laten-maken",
  "webshop-laten-maken",
  "admin-systeem-op-maat",
  "reparatie-portaal",
] as const;

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
}) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const close = React.useCallback(() => setOpen(false), []);

  const isActive = (target: string) =>
    target === "/" ? pathname === "/" : pathname.startsWith(target);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          aria-label="Open menu"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-(--color-bg)/20 bg-(--color-bg)/5 text-(--color-bg) transition-colors hover:border-(--color-bg)/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent) md:hidden"
        >
          <Menu className="h-5 w-5" strokeWidth={2} />
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
                <X className="h-5 w-5" strokeWidth={2} />
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
            <Link
              href={{ pathname: "/aanvragen" }}
              onClick={close}
              className="group mb-6 flex items-center justify-between rounded-xl bg-(--color-accent) px-4 py-3 text-[15px] font-medium text-white transition-all hover:bg-(--color-accent)/90"
            >
              {aanvragenLabel}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>

            {/* Diensten + de zes verticals */}
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
                  <ArrowRight className="h-3.5 w-3.5 text-(--color-muted)" />
                </Link>
              </li>
              {VERTICAL_SLUGS.map((slug) => (
                <li key={slug}>
                  <Link
                    href={{ pathname: "/diensten/[vertical]", params: { vertical: slug } }}
                    onClick={close}
                    className="block rounded-md py-2 pr-3 pl-6 text-[14px] text-(--color-muted) transition-colors hover:bg-(--color-bg-warm) hover:text-(--color-text)"
                  >
                    {menuStrings.items[slug].title}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Werk / cases */}
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
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </li>
            </ul>

            {/* Overige plain links */}
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
                    <ArrowRight className="h-3.5 w-3.5 text-(--color-muted)" />
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Footer — login + lang + CTA. De CTA is hier bewust een gewone
              link naar /contact (waar de Cal-embed leeft), géén CalPopupTrigger:
              die opent een Radix Dialog ín deze al-open Radix Dialog, en twee
              gestapelde dialogs geven focus-trap- en scroll-lock-conflicten op
              mobiel. Op desktop blijft de popup-CTA wél staan. */}
          <div className="space-y-4 border-t border-(--color-border) px-6 py-5">
            <div className="flex items-center justify-between">
              <Link
                href={{ pathname: "/login" }}
                onClick={close}
                className="inline-flex items-center gap-2 font-mono text-[11px] tracking-widest text-(--color-muted) uppercase transition-colors hover:text-(--color-text)"
              >
                <KeyRound className="h-3.5 w-3.5" strokeWidth={2} />
                {loginLabel}
              </Link>
              <LangSwitcher />
            </div>
            <Link
              href={{ pathname: "/contact" }}
              onClick={close}
              className="group hover:shadow-glow inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-(--color-accent) px-4 py-3 text-[14px] font-medium text-white transition-all hover:bg-(--color-accent)/90"
            >
              {ctaLabel}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
