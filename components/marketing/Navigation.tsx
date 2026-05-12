import { getTranslations } from "next-intl/server";
import { KeyRound } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { LogoMark } from "@/components/shared/LogoMark";
import { LangSwitcher } from "@/components/shared/LangSwitcher";
import { NavScroll } from "@/components/marketing/NavScroll";
import { NavLink } from "@/components/marketing/NavLink";
import { NavLiveBadge } from "@/components/marketing/NavLiveBadge";
import { NavMegaMenu, type MegaMenuStrings } from "@/components/marketing/NavMegaMenu";
import { CalPopupTrigger } from "@/components/marketing/CalPopupTrigger";
import { MobileNav } from "@/components/marketing/MobileNav";

export async function Navigation({ locale }: { locale: string }) {
  const t = await getTranslations("nav");
  const tFooter = await getTranslations("footer");
  const tRaw = await getTranslations();
  const menuStrings = tRaw.raw("nav.menu") as MegaMenuStrings;

  // Midden-nav (desktop): twee mega-menu's (Diensten + Werk) + twee plain
  // links (Prijzen + Over). Verhuur zit nu als prominente eerste tegel ín
  // het Diensten-menu (was dubbel als losse link). Vijf items i.p.v.
  // zeven = rustiger. Contact is de secundaire actie rechts.
  const simpleLinks = [
    { href: "/prijzen", label: t("pricing") },
    { href: "/over", label: t("about") },
  ] as const;

  // Live-badge: cyclet door status + zachte schaarste. Linkt naar /status.
  const liveMessages = [t("liveBadge"), t("liveBadgeUptime"), t("liveBadgeAvailable")];

  return (
    <NavScroll>
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 pt-3.5 pb-5">
        {/* Wordmark — LogoMark-symbool + tekst, cream op donker */}
        <Link
          href="/"
          aria-label="Webstability — home"
          className="group inline-flex items-center gap-2.5 text-[18px] font-extrabold tracking-[-0.045em] text-(--color-bg) transition-opacity hover:opacity-90"
        >
          <span className="hidden lg:inline-flex">
            <LogoMark size={22} />
          </span>
          <span>
            webstability<span className="text-(--color-accent)">.</span>
          </span>
        </Link>

        {/* Center nav — desktop only. */}
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

        {/* Right side — live badge · lang · contact · login · CTA.
            Mobile: compacte CTA + hamburger. */}
        <div className="flex items-center gap-2.5 md:gap-3">
          <NavLiveBadge messages={liveMessages} />
          <span className="hidden md:inline-flex">
            <LangSwitcher variant="dark" />
          </span>
          <span className="hidden text-[14px] font-medium md:inline-flex">
            <NavLink href="/contact">{t("contact")}</NavLink>
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
          {/* CTA — terracotta op donker. Desktop: vol label; mobiel:
              compacte "Boek"-knop naast de hamburger. */}
          <CalPopupTrigger
            locale={locale}
            className="group inline-flex items-center gap-1.5 rounded-full bg-(--color-accent) px-3.5 py-2 text-[13px] font-medium text-white transition-all hover:bg-(--color-accent)/90 hover:shadow-[0_8px_20px_-8px_rgba(201,97,79,0.5)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent) md:px-4"
          >
            <span className="hidden sm:inline">{t("planCall")}</span>
            <span className="sm:hidden">{t("planCallShort")}</span>
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

          {/* Mobile hamburger */}
          <MobileNav
            servicesLabel={t("services")}
            casesLabel={t("cases")}
            menuStrings={menuStrings}
            otherLinks={[
              { href: "/prijzen", label: t("pricing") },
              { href: "/over", label: t("about") },
              { href: "/contact", label: t("contact") },
            ]}
            aanvragenLabel={menuStrings.configuratorLabel}
            ctaLabel={t("planCall")}
            loginLabel={t("login")}
            liveBadge={t("liveBadge")}
            tagline={tFooter("tagline")}
          />
        </div>
      </nav>
    </NavScroll>
  );
}
