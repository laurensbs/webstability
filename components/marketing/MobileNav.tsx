"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X, ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { ComponentProps } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { LogoMark } from "@/components/shared/LogoMark";
import { LangSwitcher } from "@/components/shared/LangSwitcher";

type Href = ComponentProps<typeof Link>["href"];

type NavItem = {
  href: Href;
  label: string;
};

/**
 * Mobile nav drawer. Hamburger right of the wordmark on mobile, opens
 * a full-height Radix Dialog with the brand panel on top, the route
 * list below it, and the primary CTA + lang switcher in the footer.
 *
 * Auto-closes on route navigation by listening to pathname changes —
 * the open prop is uncontrolled but reset via a key + state hook.
 */
export function MobileNav({
  links,
  ctaLabel,
  ctaHref,
  liveBadge,
  tagline,
}: {
  links: NavItem[];
  ctaLabel: string;
  ctaHref: Href;
  liveBadge: string;
  tagline: string;
}) {
  const reduce = useReducedMotion();
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();
  const handleNavigate = React.useCallback(() => setOpen(false), []);

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
            <span className="inline-flex items-center gap-2.5 text-[18px] font-extrabold tracking-[-0.045em] text-(--color-text)">
              <LogoMark size={22} animate={!reduce} />
              <span>
                webstability<span className="text-(--color-accent)">.</span>
              </span>
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
            <p className="mt-2 text-[17px] leading-[1.4]">{tagline}</p>
          </div>

          {/* Route list */}
          <nav className="flex-1 overflow-y-auto px-6 py-6">
            <ul className="space-y-1">
              {links.map((link, i) => {
                const target =
                  typeof link.href === "string"
                    ? link.href
                    : ((link.href as { pathname?: string }).pathname ?? "");
                const active = target === "/" ? pathname === "/" : pathname.startsWith(target);
                return (
                  <li key={target}>
                    <motion.div
                      initial={reduce ? false : { opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <Link
                        href={link.href}
                        onClick={handleNavigate}
                        className={`flex items-center justify-between rounded-md px-3 py-3 text-[18px] font-medium transition-colors ${
                          active
                            ? "bg-(--color-bg-warm) text-(--color-accent)"
                            : "text-(--color-text) hover:bg-(--color-bg-warm)"
                        }`}
                      >
                        <span>{link.label}</span>
                        <ArrowRight
                          className={`h-4 w-4 transition-transform ${
                            active ? "translate-x-0 text-(--color-accent)" : "text-(--color-muted)"
                          }`}
                          strokeWidth={2}
                        />
                      </Link>
                    </motion.div>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Footer — lang + primary CTA */}
          <div className="space-y-4 border-t border-(--color-border) px-6 py-5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
                hello@webstability.eu
              </span>
              <LangSwitcher />
            </div>
            <Link
              href={ctaHref}
              onClick={handleNavigate}
              className="group inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-(--color-accent) px-4 py-3 text-[14px] font-medium text-white transition-all hover:bg-(--color-accent)/90 hover:shadow-[0_8px_20px_-8px_rgba(201,97,79,0.5)]"
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
