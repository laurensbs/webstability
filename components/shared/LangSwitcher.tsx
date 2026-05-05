"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";

export function LangSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const t = useTranslations("common");

  const otherLocale: Locale = locale === "nl" ? "es" : "nl";

  // `pathname` is the unlocalized internal path (e.g. "/over").
  // <Link locale="es"> emits the translated slug for the target locale.
  return (
    <Link
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      href={pathname as any}
      locale={otherLocale}
      className="font-mono text-xs tracking-widest text-(--color-muted) uppercase underline-offset-4 hover:text-(--color-accent) hover:underline"
    >
      {t("switchToOther")}
    </Link>
  );
}
