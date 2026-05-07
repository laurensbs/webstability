import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LangSwitcher } from "@/components/shared/LangSwitcher";
import { LogoMark } from "@/components/shared/LogoMark";
import { NavScroll } from "@/components/marketing/NavScroll";
import { NavLink } from "@/components/marketing/NavLink";
import { CalPopupTrigger } from "@/components/marketing/CalPopupTrigger";
import { MobileNav } from "@/components/marketing/MobileNav";

export async function Navigation({ locale }: { locale: string }) {
  const t = await getTranslations("nav");
  const tFooter = await getTranslations("footer");

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
        {/* Wordmark + LogoMark — premium hover op de mark */}
        <Link
          href="/"
          className="group inline-flex items-center gap-2.5 text-[20px] font-extrabold tracking-[-0.045em] text-(--color-text)"
        >
          <span className="text-(--color-accent) transition-transform duration-300 group-hover:rotate-[-6deg]">
            <LogoMark size={22} animate />
          </span>
          <span>
            webstability<span className="text-(--color-accent)">.</span>
          </span>
        </Link>

        {/* Center nav links — desktop only */}
        <div className="hidden items-center gap-8 text-[14.5px] font-medium md:flex">
          {links.map((l) => (
            <NavLink key={l.href} href={l.href}>
              {l.label}
            </NavLink>
          ))}
        </div>

        {/* Right side — live-status + lang + login + CTA, mobile: hamburger */}
        <div className="flex items-center gap-3">
          {/* Live-status pulse — vervangt de losgesneden TopBar */}
          <Link
            href="/status"
            className="hidden items-center gap-1.5 text-[12px] font-medium text-(--color-muted) transition-colors hover:text-(--color-text) lg:inline-flex"
            aria-label={t("liveBadge")}
          >
            <span className="relative inline-flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--color-success) opacity-50" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-(--color-success)" />
            </span>
            <span className="tracking-[0.04em]">{t("liveBadge")}</span>
          </Link>
          <span className="hidden md:inline-flex">
            <LangSwitcher />
          </span>
          <Link
            href="/login"
            className="hidden text-[13px] font-medium text-(--color-muted) transition-colors hover:text-(--color-text) md:inline-flex"
          >
            {t("login")}
          </Link>
          <CalPopupTrigger
            locale={locale}
            className="group hidden items-center gap-1.5 rounded-full bg-(--color-accent) px-4 py-2 text-[13px] font-medium text-white transition-all hover:bg-(--color-accent)/90 hover:shadow-[0_8px_20px_-8px_rgba(201,97,79,0.5)] md:inline-flex"
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
            links={links.map((l) => ({ href: l.href, label: l.label }))}
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
