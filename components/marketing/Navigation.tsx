import { getTranslations } from "next-intl/server";
import { KeyRound } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { LangSwitcher } from "@/components/shared/LangSwitcher";
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
  // /verhuur is de scherpe deur voor het primaire segment — directe
  // top-level link, geen panel (Linear-patroon: speciale segmenten zijn
  // directe links). Komt na de mega-menu's, vóór prijzen.
  const simpleLinks = [
    { href: "/verhuur", label: t("verhuur") },
    { href: "/prijzen", label: t("pricing") },
    { href: "/over", label: t("about") },
    { href: "/contact", label: t("contact") },
  ] as const;

  // Mobile drawer toont alle routes plat — geen mega-menu op touch.
  const allMobileLinks = [
    { href: "/diensten", label: t("services") },
    { href: "/cases", label: t("cases") },
    { href: "/verhuur", label: t("verhuur") },
    { href: "/prijzen", label: t("pricing") },
    { href: "/over", label: t("about") },
    { href: "/contact", label: t("contact") },
  ] as const;

  return (
    <NavScroll>
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 pt-3.5 pb-5">
        {/* Wordmark — cream op donker, terracotta accent-punt */}
        <Link
          href="/"
          className="inline-flex items-center text-[18px] font-extrabold tracking-[-0.045em] text-(--color-bg) transition-opacity hover:opacity-90"
        >
          webstability<span className="text-(--color-accent)">.</span>
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
            <LangSwitcher variant="dark" />
          </span>
          <Link
            href="/login"
            aria-label={t("login")}
            title={t("login")}
            className="group hidden h-10 w-10 items-center justify-center rounded-full border border-(--color-bg)/25 text-(--color-bg)/75 transition-colors hover:border-(--color-bg)/60 hover:text-(--color-bg) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent) md:inline-flex"
          >
            <KeyRound
              className="h-4 w-4 transition-transform duration-500 [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110 group-hover:rotate-[-12deg]"
              strokeWidth={2}
              aria-hidden
            />
          </Link>
          {/* CTA — terracotta op donker; komt nu pas tot zijn recht */}
          <CalPopupTrigger
            locale={locale}
            className="group hidden items-center gap-1.5 rounded-full bg-(--color-accent) px-4 py-2 text-[13px] font-medium text-white transition-all hover:bg-(--color-accent)/90 hover:shadow-[0_8px_20px_-8px_rgba(201,97,79,0.5)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent) md:inline-flex"
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
