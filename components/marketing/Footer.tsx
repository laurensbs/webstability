import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { LivePulse } from "@/components/animate/LivePulse";

export async function Footer() {
  const t = await getTranslations("footer");
  const tNav = await getTranslations("nav");
  const year = new Date().getFullYear();

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

  const legal = [
    { href: "/privacy", label: t("privacy") },
    { href: "/aviso-legal", label: t("legal") },
  ] as const;

  return (
    <footer className="relative z-[1] mt-auto border-t border-(--color-border) bg-(--color-bg-warm)">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-3 lg:col-span-1">
            <Link
              href="/"
              className="text-[18px] font-extrabold tracking-[-0.045em] text-(--color-text)"
            >
              webstability<span className="text-(--color-accent)">.</span>
            </Link>
            <p className="text-sm leading-relaxed text-(--color-muted)">{t("tagline")}</p>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-[11px] font-medium tracking-[0.08em] text-(--color-muted)">
              {t("cols.services")}
            </h4>
            <ul className="mt-4 space-y-2 text-sm">
              {services.map((s) => (
                <li key={s.href}>
                  <Link
                    href={s.href}
                    className="text-(--color-text) transition-colors hover:text-(--color-accent)"
                  >
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-[11px] font-medium tracking-[0.08em] text-(--color-muted)">
              {t("cols.company")}
            </h4>
            <ul className="mt-4 space-y-2 text-sm">
              {company.map((c) => (
                <li key={c.href}>
                  <Link
                    href={c.href}
                    className="text-(--color-text) transition-colors hover:text-(--color-accent)"
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-[11px] font-medium tracking-[0.08em] text-(--color-muted)">
              {t("cols.contact")}
            </h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <a
                  href="mailto:hello@webstability.eu"
                  className="text-(--color-text) transition-colors hover:text-(--color-accent)"
                >
                  hello@webstability.eu
                </a>
              </li>
              <li className="text-(--color-muted)">{t("contactRegion")}</li>
              <li>
                <Link
                  href="/contact"
                  className="text-(--color-accent) transition-colors hover:underline"
                >
                  {tNav("contact")} →
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-12 flex flex-col gap-4 border-t border-(--color-border) pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] font-medium tracking-[0.06em] text-(--color-muted)">
            © {year} Webstability · {t("rights")}
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {legal.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-[12px] font-medium tracking-[0.06em] text-(--color-muted) transition-colors hover:text-(--color-text)"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/status"
              className="inline-flex items-center gap-2 rounded-full border border-(--color-border) bg-(--color-surface) px-3 py-1 text-[11px] font-medium tracking-[0.08em] text-(--color-muted) transition-colors hover:border-(--color-accent)/40 hover:text-(--color-text)"
            >
              <LivePulse />
              {t("liveBadge")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
