import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { Check } from "lucide-react";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { LangSwitcher } from "@/components/shared/LangSwitcher";
import { MarkupText } from "@/components/animate/MarkupText";
import { LoginAmbientMount } from "@/components/r3f/LoginAmbientMount";
import { AdminLoginTagline } from "@/components/admin/AdminLoginTagline";
import { getStudioStats, getRevenueStats } from "@/lib/db/queries/admin";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ email?: string; from?: string }>;
}) {
  const { locale } = await params;
  const { email: emailParam, from } = await searchParams;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const fromCheckout = from === "checkout";

  // The same /login route serves both the customer portal and the
  // staff admin (mounted at admin.webstability.eu via the proxy).
  // The host header determines which copy and side-affordances we
  // show — admin variant has no "no account" link, different eyebrow,
  // and admin-flavoured panel copy.
  const host = (await headers()).get("host") ?? "";
  const isAdminHost = host.toLowerCase().startsWith("admin.");

  const tNamespace = isAdminHost ? "auth.adminLogin" : "auth.login";
  const t = await getTranslations(tNamespace);
  const tFooter = await getTranslations("footer");
  const bullets = (await getTranslations()).raw(`${tNamespace}.panelBullets`) as string[];
  // Customer login still has its noAccount/contactCta strings under auth.login.
  const tCustomer = await getTranslations("auth.login");
  const year = new Date().getFullYear();

  // Op de admin-host fetchen we live studio-stats voor de rotating
  // tagline boven de login-form. Gracefully fallback naar één statisch
  // bericht als de DB faalt — login mag nooit blokkeren door telemetry.
  let adminTaglineMessages: string[] = ["studio online"];
  if (isAdminHost) {
    try {
      const [stats, revenue] = await Promise.all([getStudioStats(), getRevenueStats()]);
      const eurFmt = new Intl.NumberFormat(locale, {
        style: "currency",
        currency: "EUR",
        maximumFractionDigits: 0,
      });
      const totalActiveOrgs =
        revenue.distribution.care + revenue.distribution.studio + revenue.distribution.atelier;
      adminTaglineMessages = [
        `${totalActiveOrgs} ${totalActiveOrgs === 1 ? "klant" : "klanten"} actief`,
        `${eurFmt.format(revenue.mrr)}/m MRR`,
        Number(stats.openTickets) === 0
          ? "geen open tickets"
          : `${stats.openTickets} ${stats.openTickets === 1 ? "open ticket" : "open tickets"}`,
      ];
    } catch {
      // SSR-fail tolerant: blijf op default.
    }
  }

  return (
    <main className="grid min-h-screen md:grid-cols-2">
      {/* LEFT — branded panel */}
      <section className="relative hidden overflow-hidden bg-(--color-text) p-12 text-(--color-bg) md:flex md:flex-col md:justify-between">
        {/* Ambient blobs */}
        <div
          aria-hidden
          className="wb-soft-halo pointer-events-none absolute -top-40 -left-32 h-[420px] w-[420px] rounded-full bg-(--color-accent) opacity-40 blur-3xl"
        />
        <div
          aria-hidden
          className="wb-soft-halo pointer-events-none absolute -right-32 -bottom-40 h-[420px] w-[420px] rounded-full bg-(--color-teal) opacity-50 blur-3xl"
        />

        {/* 3D distorted blob — sits over the static blobs at low opacity
            so it adds motion without competing with the panel copy. */}
        <LoginAmbientMount className="pointer-events-none absolute inset-0 opacity-60" />

        <Link
          href="/"
          className="relative z-10 inline-flex items-baseline gap-3 text-[20px] font-extrabold tracking-[-0.045em] text-(--color-bg)"
        >
          <span>
            webstability<span className="text-(--color-accent)">.</span>
          </span>
          <span
            className="font-mono text-[10px] font-normal tracking-widest uppercase"
            style={{ color: "rgba(245, 240, 232, 0.6)" }}
          >
            Eén plek voor je
          </span>
        </Link>

        <div className="relative z-10 max-w-md space-y-8">
          <h2 className="text-3xl leading-[1.15] md:text-4xl">
            {<MarkupText>{t("panelTitle")}</MarkupText>}
          </h2>
          <p className="text-(--color-bg)/70">{t("panelLede")}</p>
          <ul className="space-y-3">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-3 text-sm text-(--color-bg)/85">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-(--color-accent)/20 text-(--color-accent)">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 font-mono text-xs tracking-widest text-(--color-bg)/45 uppercase">
          {"// "}
          {tFooter("tagline")}
        </p>
      </section>

      {/* RIGHT — login form. On admin host the panel goes dark too so
          'webstability.' + tagline read white-on-text everywhere. */}
      <section
        className={`relative flex flex-col justify-between p-8 md:p-12 ${
          isAdminHost
            ? "bg-(--color-text) text-(--color-bg)"
            : "dotted-bg bg-(--color-bg) text-(--color-text)"
        }`}
      >
        <header className="flex items-center justify-between">
          {isAdminHost ? (
            <AdminLoginTagline messages={adminTaglineMessages} />
          ) : (
            <p className="text-sm text-(--color-muted)">
              {tCustomer("noAccount")}{" "}
              <Link href="/contact" className="text-(--color-text) hover:text-(--color-accent)">
                {tCustomer("contactCta")}
              </Link>
            </p>
          )}
          <LangSwitcher />
        </header>

        <div className="mx-auto w-full max-w-[min(384px,100%)] py-12">
          <p
            className={`font-mono text-xs tracking-widest uppercase ${
              isAdminHost ? "text-(--color-accent)" : "text-(--color-accent)"
            }`}
          >
            {"// "}
            {t("eyebrow")}
          </p>
          <h1 className="mt-4 text-4xl md:text-5xl">{<MarkupText>{t("title")}</MarkupText>}</h1>
          <p className={`mt-3 ${isAdminHost ? "text-(--color-bg)/70" : "text-(--color-muted)"}`}>
            {t("subtitle")}
          </p>
          {fromCheckout ? (
            <div className="mt-5 rounded-lg border border-(--color-success)/40 bg-(--color-success)/10 px-4 py-3 text-[14px] text-(--color-text)">
              {tCustomer("checkoutWelcome")}
            </div>
          ) : null}
          <div className="mt-8">
            <LoginForm
              variant={isAdminHost ? "dark" : "light"}
              defaultEmail={emailParam ?? ""}
              stateCopy={
                isAdminHost
                  ? undefined
                  : {
                      returning: tCustomer("stateReturning"),
                      fresh: tCustomer("stateNew"),
                    }
              }
            />
          </div>
        </div>

        <footer
          className={`flex items-center justify-between font-mono text-xs tracking-widest uppercase ${
            isAdminHost ? "text-(--color-bg)/55" : "text-(--color-muted)"
          }`}
        >
          <span>© {year} Webstability</span>
          <span className="inline-flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--color-success) opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-(--color-success)" />
            </span>
            all systems go
          </span>
        </footer>
      </section>
    </main>
  );
}
