import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LangSwitcher } from "@/components/shared/LangSwitcher";
import { LogoMark } from "@/components/shared/LogoMark";
import { NavScroll } from "@/components/marketing/NavScroll";
import { NavLink } from "@/components/marketing/NavLink";
import { NavMegaMenu, type MegaMenuStrings } from "@/components/marketing/NavMegaMenu";
import { CalPopupTrigger } from "@/components/marketing/CalPopupTrigger";
import { MobileNav } from "@/components/marketing/MobileNav";

export async function Navigation({ locale }: { locale: string }) {
  const t = await getTranslations("nav");
  const tFooter = await getTranslations("footer");
  const tRaw = await getTranslations();
  const menuStrings = tRaw.raw("nav.menu") as MegaMenuStrings;

  // Diensten + Cases via NavMegaMenu, de rest via simpele NavLinks.
  const simpleLinks = [
    { href: "/prijzen", label: t("pricing") },
    { href: "/over", label: t("about") },
    { href: "/contact", label: t("contact") },
  ] as const;

  // Mobile drawer toont alle routes plat — geen mega-menu op touch.
  const allMobileLinks = [
    { href: "/diensten", label: t("services") },
    { href: "/cases", label: t("cases") },
    { href: "/prijzen", label: t("pricing") },
    { href: "/over", label: t("about") },
    { href: "/contact", label: t("contact") },
  ] as const;

  return (
    <NavScroll>
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-3.5">
        {/* Wordmark — strak, subtiele hover op de mark */}
        <Link
          href="/"
          className="group inline-flex items-center gap-2.5 text-[18px] font-extrabold tracking-[-0.045em] text-(--color-text) transition-opacity hover:opacity-90"
        >
          <span className="text-(--color-accent) transition-transform duration-300 group-hover:rotate-[-6deg]">
            <LogoMark size={20} animate />
          </span>
          <span>
            webstability<span className="text-(--color-accent)">.</span>
          </span>
        </Link>

        {/* Center nav — desktop only. Mega-menu voor diensten + cases,
            de rest plain NavLinks. */}
        <div className="hidden items-center gap-7 text-[14px] font-medium md:flex">
          <NavMegaMenu
            strings={menuStrings}
            servicesLabel={t("services")}
            casesLabel={t("cases")}
            servicesActive={false}
            casesActive={false}
          />
          {simpleLinks.map((l) => (
            <NavLink key={l.href} href={l.href}>
              {l.label}
            </NavLink>
          ))}
        </div>

        {/* Right side — lang + login + CTA. Mobile: hamburger. */}
        <div className="flex items-center gap-3">
          <span className="hidden md:inline-flex">
            <LangSwitcher />
          </span>
          <Link
            href="/login"
            className="hidden rounded text-[13.5px] font-medium text-(--color-muted) transition-colors hover:text-(--color-text) focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--color-accent) md:inline-flex"
          >
            {t("login")}
          </Link>
          <CalPopupTrigger
            locale={locale}
            className="group hidden items-center gap-1.5 rounded-full bg-(--color-text) px-4 py-2 text-[13px] font-medium text-(--color-bg) transition-all hover:bg-(--color-text)/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent) md:inline-flex"
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
          </CalPopupTrigger>

          {/* Mobile hamburger — only on small */}
          <MobileNav
            links={allMobileLinks.map((l) => ({ href: l.href, label: l.label }))}
            ctaLabel={t("planCall")}
            ctaHref="/contact"
            liveBadge={t("liveBadge")}
            tagline={tFooter("tagline")}
          />
        </div>
      </nav>
    </NavScroll>
  );
}
