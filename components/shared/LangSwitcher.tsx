"use client";

import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

/**
 * Compact language toggle. Shows the *other* locale as a single pill
 * button — clicking jumps to the same path in that locale. The current
 * locale is implicit (you're on it), so we don't repeat it in the UI.
 */
export function LangSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const otherLocale: Locale = locale === "nl" ? "es" : "nl";

  return (
    <Link
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      href={pathname as any}
      locale={otherLocale}
      aria-label={`Switch to ${otherLocale.toUpperCase()}`}
      className="inline-flex h-11 min-w-[44px] items-center justify-center rounded-full border border-(--color-border) bg-(--color-surface) px-3 text-[12px] font-medium tracking-wide text-(--color-muted) uppercase transition-colors hover:border-(--color-text) hover:text-(--color-text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent) md:h-10"
    >
      {otherLocale}
    </Link>
  );
}
