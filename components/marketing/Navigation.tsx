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
    <header className="border-b border-(--color-border) bg-(--color-bg)/80 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
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

        <div className="flex items-center gap-6">
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
