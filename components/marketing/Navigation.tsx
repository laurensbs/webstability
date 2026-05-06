import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LangSwitcher } from "@/components/shared/LangSwitcher";
import { NavScroll } from "@/components/marketing/NavScroll";
import { NavLink } from "@/components/marketing/NavLink";

export async function Navigation() {
  const t = await getTranslations("nav");

  const links = [
    { href: "/diensten", label: t("services") },
    { href: "/cases", label: t("cases") },
    { href: "/prijzen", label: t("pricing") },
    { href: "/over", label: t("about") },
    { href: "/contact", label: t("contact") },
  ] as const;

  return (
    <NavScroll>
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        {/* Wordmark */}
        <Link
          href="/"
          className="text-[20px] font-extrabold tracking-[-0.045em] text-(--color-text)"
        >
          webstability<span className="text-(--color-accent)">.</span>
        </Link>

        {/* Center nav links */}
        <div className="hidden items-center gap-8 text-[14.5px] font-medium md:flex">
          {links.map((l) => (
            <NavLink key={l.href} href={l.href}>
              {l.label}
            </NavLink>
          ))}
        </div>

        {/* Right side: live badge, lang switcher, primary CTA */}
        <div className="flex items-center gap-3">
          <Link
            href="/status"
            className="hidden items-center gap-2 rounded-full border border-(--color-border) bg-(--color-surface) px-3 py-1.5 text-[12px] font-medium text-(--color-muted) transition-colors hover:border-(--color-success)/40 hover:text-(--color-text) lg:inline-flex"
          >
            <span
              className="h-1.5 w-1.5 rounded-full bg-(--color-success)"
              style={{ boxShadow: "0 0 0 3px rgba(90, 122, 74, 0.18)" }}
            />
            {t("liveBadge")}
          </Link>
          <LangSwitcher />
          <Link
            href="/contact"
            className="group inline-flex items-center gap-1.5 rounded-full bg-(--color-accent) px-4 py-2 text-[13px] font-medium text-white transition-all hover:bg-(--color-accent)/90 hover:shadow-[0_8px_20px_-8px_rgba(201,97,79,0.5)]"
          >
            {t("planCall")}
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="transition-transform group-hover:translate-x-0.5"
              aria-hidden
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </nav>
    </NavScroll>
  );
}
