import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LangSwitcher } from "@/components/shared/LangSwitcher";

export async function Navigation() {
  const t = await getTranslations("nav");

  const links = [
    { href: "/verhuur", label: t("services") },
    { href: "/prijzen", label: t("pricing") },
    { href: "/over", label: t("about") },
    { href: "/blog", label: t("blog") },
    { href: "/contact", label: t("contact") },
  ] as const;

  return (
    <header className="sticky top-0 z-30 border-b border-(--color-border) bg-(--color-bg)/80 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5">
        <Link href="/" className="text-xl font-extrabold tracking-tight">
          webstability<span className="text-(--color-accent)">.</span>
        </Link>

        <div className="hidden items-center gap-8 text-sm md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-(--color-muted) transition-colors hover:text-(--color-text)"
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3 md:gap-6">
          <Link
            href="/status"
            className="hidden items-center gap-2 rounded-full border border-(--color-border) bg-(--color-surface) px-3 py-1.5 font-mono text-xs tracking-wide text-(--color-muted) transition-colors hover:border-(--color-accent)/40 hover:text-(--color-text) md:inline-flex"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--color-success) opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-(--color-success)" />
            </span>
            {t("liveBadge")}
          </Link>
          <LangSwitcher />
          <Link
            href="/login"
            className="rounded-md bg-(--color-text) px-4 py-2 text-sm font-medium text-(--color-bg) transition-opacity hover:opacity-90"
          >
            {t("login")}
          </Link>
        </div>
      </nav>
    </header>
  );
}
