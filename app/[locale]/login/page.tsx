import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { Check, MailCheck } from "lucide-react";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { LangSwitcher } from "@/components/shared/LangSwitcher";
import { MarkupText } from "@/components/animate/MarkupText";
import { AmbientHalos } from "@/components/shared/AmbientHalos";
import { MountReveal } from "@/components/animate/MountReveal";
import { LoginAmbientMount } from "@/components/r3f/LoginAmbientMount";
import { AdminLoginTagline } from "@/components/admin/AdminLoginTagline";
import { getStudioStats, getRevenueStats } from "@/lib/db/queries/admin";

const PLAN_KEYS = new Set(["care", "studio", "atelier"]);

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ email?: string; from?: string; plan?: string }>;
}) {
  const { locale } = await params;
  const { email: emailParam, from, plan: planParam } = await searchParams;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const fromCheckout = from === "checkout";
  const plan = planParam && PLAN_KEYS.has(planParam) ? planParam : null;

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
  const tRaw = await getTranslations();
  // Customer login still has its noAccount/contactCta strings under auth.login.
  const tCustomer = await getTranslations("auth.login");
  const year = new Date().getFullYear();

  // Pakket-context (klant-host, ?plan=…): andere eyebrow + panel-bullets +
  // checkout-banner. Onbekend pakket of admin-host → de generieke set.
  const planCtx =
    !isAdminHost && plan
      ? ((tRaw.raw(`auth.login.byPlan.${plan}`) as {
          eyebrow?: string;
          panelTitle?: string;
          panelBullets?: string[];
          checkoutWelcome?: string;
        }) ?? null)
      : null;
  const bullets = planCtx?.panelBullets ?? (tRaw.raw(`${tNamespace}.panelBullets`) as string[]);
  const panelTitle = planCtx?.panelTitle ?? t("panelTitle");
  const eyebrow = planCtx?.eyebrow ?? t("eyebrow");
  const checkoutWelcome = planCtx?.checkoutWelcome ?? tCustomer("checkoutWelcome");

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
        <AmbientHalos variant="accent-teal" />

        {/* 3D distorted blob — sits over the static blobs at low opacity
            so it adds motion without competing with the panel copy. */}
        <LoginAmbientMount className="pointer-events-none absolute inset-0 opacity-60" />

        <MountReveal delay={0}>
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
        </MountReveal>

        <div className="relative z-10 max-w-md space-y-8">
          <MountReveal delay={0.15}>
            <h2 className="text-3xl leading-[1.15] text-(--color-bg) md:text-4xl">
              {<MarkupText>{panelTitle}</MarkupText>}
            </h2>
          </MountReveal>
          <MountReveal delay={0.25}>
            <p className="text-(--color-bg)/70">{t("panelLede")}</p>
          </MountReveal>
          <ul className="space-y-3">
            {bullets.map((b, i) => (
              <MountReveal key={b} delay={0.35 + i * 0.08} as="li">
                <span className="flex items-start gap-3 text-sm text-(--color-bg)/85">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-(--color-accent)/20 text-(--color-accent)">
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  {b}
                </span>
              </MountReveal>
            ))}
          </ul>
        </div>

        <MountReveal delay={0.6}>
          <p className="relative z-10 font-mono text-xs tracking-widest text-(--color-bg)/45 uppercase">
            {"// "}
            {tFooter("tagline")}
          </p>
        </MountReveal>
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
          {/* Direct na een checkout: de klant heeft net een "stel je wachtwoord
              in"-mail gekregen. Een login-formulier dat 'ie nog niet kan
              gebruiken is verwarrend — toon een "check je mail"-staat. Wie z'n
              wachtwoord al heeft ingesteld kan via de link onderaan alsnog
              inloggen. (Niet op admin-host.) */}
          {fromCheckout && !isAdminHost ? (
            <>
              <MountReveal delay={0.1}>
                <p className="font-mono text-xs tracking-widest text-(--color-accent) uppercase">
                  {"// "}
                  {tCustomer("checkoutEyebrow")}
                </p>
              </MountReveal>
              <MountReveal delay={0.2}>
                <h1 className="mt-4 text-4xl text-(--color-text) md:text-5xl">
                  {<MarkupText>{tCustomer("checkoutTitle")}</MarkupText>}
                </h1>
              </MountReveal>
              <MountReveal delay={0.3}>
                <div className="mt-5 flex items-start gap-3 rounded-lg border border-(--color-success)/40 bg-(--color-success)/10 px-4 py-3 text-[14px] text-(--color-text)">
                  <MailCheck
                    className="mt-0.5 h-4 w-4 shrink-0 text-(--color-success)"
                    strokeWidth={2.2}
                    aria-hidden
                  />
                  <span>{checkoutWelcome}</span>
                </div>
              </MountReveal>
              <MountReveal delay={0.4}>
                <div className="mt-6 space-y-2 text-[13px] text-(--color-muted)">
                  <p>
                    {tCustomer("checkoutNoMail")}{" "}
                    <Link
                      href={{
                        pathname: "/forgot-password",
                        query: emailParam ? { email: emailParam } : undefined,
                      }}
                      className="text-(--color-text) underline decoration-(--color-border) underline-offset-2 hover:decoration-(--color-accent)"
                    >
                      {tCustomer("checkoutResendCta")}
                    </Link>
                  </p>
                  <p>
                    {tCustomer("checkoutAlready")}{" "}
                    <Link
                      href="/login"
                      className="text-(--color-text) underline decoration-(--color-border) underline-offset-2 hover:decoration-(--color-accent)"
                    >
                      {tCustomer("checkoutLoginLink")}
                    </Link>
                  </p>
                </div>
              </MountReveal>
            </>
          ) : (
            <>
              <MountReveal delay={0.1}>
                <p className="font-mono text-xs tracking-widest text-(--color-accent) uppercase">
                  {"// "}
                  {eyebrow}
                </p>
              </MountReveal>
              <MountReveal delay={0.2}>
                <h1
                  className={`mt-4 text-4xl md:text-5xl ${
                    isAdminHost ? "text-(--color-bg)" : "text-(--color-text)"
                  }`}
                >
                  {<MarkupText>{t("title")}</MarkupText>}
                </h1>
              </MountReveal>
              <MountReveal delay={0.3}>
                <p
                  className={`mt-3 ${isAdminHost ? "text-(--color-bg)/70" : "text-(--color-muted)"}`}
                >
                  {t("subtitle")}
                </p>
              </MountReveal>
              <MountReveal delay={0.45}>
                <div className="mt-8">
                  <LoginForm
                    variant={isAdminHost ? "dark" : "light"}
                    defaultEmail={emailParam ?? ""}
                    redirectTo={isAdminHost ? "/admin" : "/portal/dashboard"}
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
              </MountReveal>
            </>
          )}
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
