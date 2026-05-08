"use client";

import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

/**
 * Compact language toggle. Shows the *other* locale as a single pill
 * button — clicking jumps to the same path in that locale. The current
 * locale is implicit (you're on it), so we don't repeat it in the UI.
 *
 * `variant="dark"` keert de pill om voor gebruik op donkere achtergrond
 * (header, login-panel, footer-zone-1).
 */
export function LangSwitcher({ variant = "light" }: { variant?: "light" | "dark" }) {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const otherLocale: Locale = locale === "nl" ? "es" : "nl";

  const styling =
    variant === "dark"
      ? "border-(--color-bg)/20 bg-(--color-bg)/5 text-(--color-bg)/65 hover:border-(--color-bg)/50 hover:text-(--color-bg)"
      : "border-(--color-border) bg-(--color-surface) text-(--color-muted) hover:border-(--color-text) hover:text-(--color-text)";

  return (
    <Link
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      href={pathname as any}
      locale={otherLocale}
      aria-label={`Switch to ${otherLocale.toUpperCase()}`}
      className={`inline-flex h-11 min-w-[44px] items-center justify-center rounded-full border px-3 text-[12px] font-medium tracking-wide uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent) md:h-10 ${styling}`}
    >
      {otherLocale}
    </Link>
  );
}
