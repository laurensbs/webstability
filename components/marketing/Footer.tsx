import { getTranslations, getLocale } from "next-intl/server";
import { Mail, ArrowUpRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { LivePulse } from "@/components/animate/LivePulse";
import { LogoMark } from "@/components/shared/LogoMark";
import { MarkupText } from "@/components/animate/MarkupText";
import { LangSwitcher } from "@/components/shared/LangSwitcher";
import { CalPopupTrigger } from "@/components/marketing/CalPopupTrigger";

/**
 * Premium "studio"-footer. Drie zones:
 *  1. Tagline-block — grote serif statement links, brand-block + email
 *     rechts. Establish-shot zoals Linear/Stripe.
 *  2. Vier link-kolommen + "Werken met ons"-card (CTA + response-tijd).
 *  3. Meta-strip onderaan — KvK + BTW + last-deploy + GitHub + lang.
 *
 * Build- en deploy-info komt uit env-vars die Vercel automatisch
 * exposeert. We tonen alleen de eerste 7 chars van de SHA — vergelijk-
 * baar met `git rev-parse --short`.
 */
export async function Footer() {
  const t = await getTranslations("footer");
  const tNav = await getTranslations("nav");
  const locale = await getLocale();
  const year = new Date().getFullYear();

  // Vercel-exposed env-vars — bestaan in productie, fallbacken in dev.
  const sha =
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ??
    process.env.NEXT_PUBLIC_BUILD_SHA?.slice(0, 7) ??
    "dev";
  const deployedAt = process.env.VERCEL_GIT_COMMIT_AUTHOR_DATE
    ? new Date(process.env.VERCEL_GIT_COMMIT_AUTHOR_DATE)
    : new Date();
  // Fallback "vandaag"-formaat voor dev / lokale builds. In productie
  // toont 'ie de echte commit-datum.
  const deployedLabel = new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
  }).format(deployedAt);

  const services = [
    { href: "/diensten", label: tNav("services") },
    { href: "/verhuur", label: t("forRentals") },
    { href: "/prijzen", label: tNav("pricing") },
    { href: "/garanties", label: t("guarantees") },
  ] as const;

  const company = [
    { href: "/over", label: tNav("about") },
    { href: "/cases", label: t("cases") },
    { href: "/blog", label: tNav("blog") },
    { href: "/status", label: t("status") },
  ] as const;

  const resources = [
    { href: "/contact", label: tNav("contact") },
    { href: "/login", label: tNav("login") },
  ] as const;

  const legal = [
    { href: "/privacy", label: t("privacy") },
    { href: "/aviso-legal", label: t("legal") },
  ] as const;

  return (
    <footer className="relative z-[1] mt-auto">
      {/* ---- Zone 1: Donker tagline-block met conic-mesh hint ---- */}
      <div className="relative isolate overflow-hidden bg-(--color-text) text-(--color-bg)">
        {/* Halo-blobs */}
        <div
          aria-hidden
          className="wb-soft-halo pointer-events-none absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full bg-(--color-accent) opacity-35 blur-3xl"
        />
        <div
          aria-hidden
          className="wb-soft-halo pointer-events-none absolute -right-32 -bottom-32 h-[420px] w-[420px] rounded-full bg-(--color-wine) opacity-45 blur-3xl"
        />

        <div className="relative mx-auto max-w-6xl px-6 py-16 md:py-20">
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr]">
            <div className="space-y-4">
              <p className="font-mono text-[11px] tracking-widest text-(--color-accent) uppercase">
                {t("contactRegion")}
              </p>
              <h2 className="max-w-none font-serif text-[clamp(28px,4vw,44px)] leading-[1.1] text-(--color-bg) sm:max-w-[18ch]">
                <MarkupText>{t("studioTagline")}</MarkupText>
              </h2>
              <p className="max-w-[52ch] text-[15px] leading-[1.6] text-(--color-bg)/70">
                {t("studioSub")}
              </p>
            </div>

            {/* Werken-met-ons card — cream surface op donker */}
            <div className="flex flex-col justify-between gap-5 rounded-[18px] border border-t-2 border-(--color-bg)/15 border-t-(--color-accent) bg-(--color-bg)/5 p-6 backdrop-blur-sm">
              <div>
                <p className="font-mono text-[10px] tracking-widest text-(--color-bg)/55 uppercase">
                  {t("responseLabel")}
                </p>
                <p className="mt-1 font-serif text-[28px] leading-none">{t("responseValue")}</p>
                <a
                  href="mailto:hello@webstability.eu"
                  className="mt-4 inline-flex items-center gap-2 text-[14px] font-medium text-(--color-bg) transition-colors hover:text-(--color-accent) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)"
                >
                  <Mail className="h-3.5 w-3.5" />
                  hello@webstability.eu
                </a>
              </div>
              <CalPopupTrigger
                locale={locale}
                className="inline-flex w-full items-center justify-between gap-2 rounded-full bg-(--color-accent) px-4 py-3 text-[13px] font-medium text-white transition-all hover:bg-(--color-accent)/90 hover:shadow-[0_8px_20px_-8px_rgba(201,97,79,0.5)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent) sm:w-auto sm:py-2.5"
              >
                <span>{tNav("planCall")}</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </CalPopupTrigger>
            </div>
          </div>
        </div>
      </div>

      {/* ---- Zone 2 + 3: Cream-warm met wijn-rood top-hairline ---- */}
      <div className="relative overflow-hidden border-t-2 border-(--color-wine)/70 bg-(--color-bg-warm)">
        <div className="relative mx-auto max-w-6xl px-6 py-14 md:py-16">
          {/* ---- Zone 2: Brand + 3 link-kolommen ---- */}
          <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="space-y-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-[18px] font-extrabold tracking-[-0.045em] text-(--color-text)"
              >
                <span className="text-(--color-accent)">
                  <LogoMark size={20} />
                </span>
                <span>
                  webstability<span className="text-(--color-accent)">.</span>
                </span>
              </Link>
              <p className="text-sm leading-relaxed text-(--color-muted)">{t("tagline")}</p>
              <div className="flex items-center gap-2 pt-1">
                <Link
                  href="/status"
                  className="inline-flex items-center gap-2 rounded-full border border-(--color-border) bg-(--color-surface) px-3 py-1 text-[11px] font-medium tracking-[0.08em] text-(--color-muted) transition-colors hover:border-(--color-accent)/40 hover:text-(--color-text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)"
                >
                  <LivePulse />
                  {t("liveBadge")}
                </Link>
              </div>
            </div>

            {/* Services */}
            <FooterColumn title={t("cols.services")} items={services} />
            {/* Company */}
            <FooterColumn title={t("cols.company")} items={company} />
            {/* Resources / Contact */}
            <FooterColumn title={t("cols.contact")} items={resources}>
              <li className="text-sm text-(--color-muted)">{t("contactRegion")}</li>
              <li>
                <a
                  href="mailto:hello@webstability.eu"
                  className="text-sm text-(--color-text) transition-colors hover:text-(--color-accent)"
                >
                  hello@webstability.eu
                </a>
              </li>
            </FooterColumn>
          </div>

          {/* ---- Zone 3: Meta-strip ---- */}
          <div className="grid gap-6 border-t border-(--color-border) pt-6 md:grid-cols-[1fr_auto] md:items-center">
            {/* Links: copyright + last-deploy + (KvK/BTW achter details
              op mobile, inline vanaf sm:) */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[10.5px] tracking-[0.06em] text-(--color-muted) uppercase">
              <span>© {year} Webstability</span>

              {/* KvK + BTW: alleen inline vanaf sm: */}
              <span className="hidden text-(--color-border) sm:inline" aria-hidden>
                ·
              </span>
              <span className="hidden sm:inline">
                {t("kvkLabel")} <span className="text-(--color-text)">91186307</span>
              </span>
              <span className="hidden text-(--color-border) sm:inline" aria-hidden>
                ·
              </span>
              <span className="hidden sm:inline">
                {t("vatLabel")} <span className="text-(--color-text)">NL004875371B72</span>
              </span>

              <span className="text-(--color-border)" aria-hidden>
                ·
              </span>
              <span>
                {t("lastDeployLabel")} <span className="text-(--color-text)">{deployedLabel}</span>
                <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-(--color-bg)/60 px-1.5 py-0.5 text-(--color-accent)">
                  {sha}
                </span>
              </span>

              {/* Disclosure voor KvK + BTW op mobile — vanaf sm: verstopt */}
              <details className="basis-full sm:hidden">
                <summary className="cursor-pointer list-none text-[10.5px] tracking-[0.06em] text-(--color-muted) uppercase transition-colors hover:text-(--color-text)">
                  Bedrijfsgegevens ▾
                </summary>
                <div className="mt-2 space-y-1 pl-1 text-[10.5px] normal-case">
                  <p>
                    {t("kvkLabel")} <span className="text-(--color-text)">91186307</span>
                  </p>
                  <p>
                    {t("vatLabel")} <span className="text-(--color-text)">NL004875371B72</span>
                  </p>
                </div>
              </details>
            </div>

            {/* Rechts: legal-links + GitHub + lang-switcher */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {legal.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="rounded font-mono text-[10.5px] tracking-[0.06em] text-(--color-muted) uppercase transition-colors hover:text-(--color-text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)"
                >
                  {l.label}
                </Link>
              ))}
              <a
                href="https://github.com/laurensbos"
                target="_blank"
                rel="noopener"
                aria-label="GitHub"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-(--color-border) bg-(--color-surface) text-(--color-muted) transition-colors hover:border-(--color-accent)/40 hover:text-(--color-text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.2 1.9 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.5.4.9 1.2.9 2.3v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3" />
                </svg>
              </a>
              <span className="inline-flex items-center">
                <LangSwitcher />
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  items,
  children,
}: {
  title: string;
  items: ReadonlyArray<{ readonly href: string; readonly label: string }>;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <h4 className="font-mono text-[11px] font-medium tracking-[0.08em] text-(--color-muted) uppercase">
        {title}
      </h4>
      <ul className="mt-4 space-y-2.5 text-sm">
        {items.map((s) => (
          <li key={s.href}>
            <Link
              href={s.href as never}
              className="group inline-flex items-center gap-1.5 text-(--color-text) transition-colors hover:text-(--color-accent)"
            >
              {s.label}
              <span className="inline-block translate-x-0 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100">
                →
              </span>
            </Link>
          </li>
        ))}
        {children}
      </ul>
    </div>
  );
}
