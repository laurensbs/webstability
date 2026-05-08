"use client";

import { useLocale } from "next-intl";
import { Globe } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

/**
 * Compact language toggle. Globe-icoon dat langzaam draait op hover,
 * met de andere locale-code ernaast als kleine pill. Klik switcht naar
 * de andere taal. `variant="dark"` keert de styling om voor donkere
 * achtergrond (header, login-panel, footer-zone-1).
 */
export function LangSwitcher({ variant = "light" }: { variant?: "light" | "dark" }) {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const otherLocale: Locale = locale === "nl" ? "es" : "nl";

  const styling =
    variant === "dark"
      ? "border-(--color-bg)/25 bg-transparent text-(--color-bg)/75 hover:border-(--color-bg)/60 hover:text-(--color-bg)"
      : "border-(--color-border) bg-(--color-surface) text-(--color-muted) hover:border-(--color-text) hover:text-(--color-text)";

  return (
    <Link
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      href={pathname as any}
      locale={otherLocale}
      aria-label={`Switch to ${otherLocale.toUpperCase()}`}
      title={`Switch to ${otherLocale.toUpperCase()}`}
      className={`group inline-flex h-10 items-center gap-1.5 rounded-full border px-3 text-[11px] font-medium tracking-wide uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent) ${styling}`}
    >
      <Globe
        className="h-3.5 w-3.5 transition-transform duration-1000 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] group-hover:rotate-180"
        strokeWidth={2}
        aria-hidden
      />
      <span>{otherLocale}</span>
    </Link>
  );
}
