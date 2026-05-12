import { getTranslations } from "next-intl/server";
import { headers } from "next/headers";
import { KeyRound, ArrowRight } from "lucide-react";
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

  // Huidige pad uit de proxy-header — zo kan de server-component de mega-menu-
  // triggers ("Diensten"/"Werk") als actief markeren wanneer je op een
  // diensten-/cases-pagina zit (NavLink doet dit al voor de plain links).
  const pathname = (await headers()).get("x-pathname") ?? "";
  const onDiensten = /\/(diensten|servicios)(\/|$)/.test(pathname);
  const onCases = /\/(cases|trabajo)(\/|$)/.test(pathname);

  // Midden-nav (desktop): twee mega-menu's (Diensten + Werk) + twee plain
  // links (Prijzen + Over). Verhuur + de configurator zitten ín het Diensten-
  // menu; de primaire CTA rechts is "Vraag aan" → /aanvragen (de bredere
  // instap met directe richtprijs). "Plan een gesprek" is de secundaire link.
  const simpleLinks = [
    { href: "/prijzen", label: t("pricing") },
    { href: "/over", label: t("about") },
  ] as const;

  return (
    <NavScroll>
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 pt-3.5 pb-5">
        {/* Wordmark — alleen tekst, geen symbool (rust, à la Linear/Vercel) */}
        <Link
          href="/"
          aria-label="Webstability — home"
          className="inline-flex items-center text-[18px] font-extrabold tracking-[-0.045em] text-(--color-bg) transition-opacity hover:opacity-90"
        >
          webstability<span className="text-(--color-accent)">.</span>
        </Link>

        {/* Center nav — desktop only. */}
        <div className="hidden items-center gap-6 text-[14px] font-medium md:flex">
          <NavMegaMenu
            strings={menuStrings}
            servicesLabel={t("services")}
            casesLabel={t("cases")}
            servicesActive={onDiensten}
            casesActive={onCases}
          />
          {simpleLinks.map((l) => (
            <NavLink key={l.href} href={l.href}>
              {l.label}
            </NavLink>
          ))}
        </div>

        {/* Right side — lang · login · "plan een gesprek" (secundair) · CTA.
            CTA = "Vraag aan" → /aanvragen (primaire instap). Mobile: alleen
            de compacte CTA + hamburger; de rest zit in de drawer. */}
        <div className="flex items-center gap-3 md:gap-4">
          <span className="hidden md:inline-flex">
            <LangSwitcher variant="dark" />
          </span>
          <Link
            href="/login"
            aria-label={t("login")}
            title={t("login")}
            className="group hidden h-10 w-10 items-center justify-center rounded-full border border-(--color-bg)/25 text-(--color-bg)/75 transition-colors hover:border-(--color-bg)/55 hover:text-(--color-bg) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent) md:inline-flex"
          >
            <KeyRound className="h-4 w-4 transition-colors" strokeWidth={2} aria-hidden />
          </Link>
          {/* Secundaire actie — "of plan een gesprek" (Cal-popup), alleen md+ */}
          <CalPopupTrigger
            locale={locale}
            className="hidden text-[13px] font-medium text-(--color-bg)/65 underline decoration-(--color-bg)/25 underline-offset-4 transition-colors hover:text-(--color-bg) hover:decoration-(--color-accent) focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--color-accent) lg:inline-flex"
          >
            {t("planCallSecondary")}
          </CalPopupTrigger>
          {/* Primaire CTA — terracotta, → /aanvragen. */}
          <Link
            href={{ pathname: "/aanvragen" }}
            className="group hover:shadow-glow inline-flex min-h-10 items-center gap-1.5 rounded-full bg-(--color-accent) px-4 py-2.5 text-[13px] font-medium text-white transition-all hover:bg-(--color-accent)/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent) md:px-5"
          >
            <span className="hidden sm:inline">{t("requestCta")}</span>
            <span className="sm:hidden">{t("requestCtaShort")}</span>
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
              strokeWidth={2}
              aria-hidden
            />
          </Link>

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
