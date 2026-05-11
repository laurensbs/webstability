import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { intakeResponses } from "@/lib/db/schema";
import { routing } from "@/i18n/routing";
import { getUserWithOrg } from "@/lib/db/queries/portal";
import { IntakeForm } from "@/components/portal/intake/IntakeForm";

/**
 * Onboarding-pagina die nieuwe owners als eerste zien na hun magic-link
 * login. Acht-stappen-form, tussentijds opslaan kan, submit triggert
 * project-spawn + welcome-call booking + staff-notify.
 *
 * Server-component haalt de draft op (als die bestaat) en geeft de
 * client-component IntakeForm een initial-state mee zodat de klant
 * verder kan vullen waar 'ie was.
 */
export default async function IntakePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await getUserWithOrg(session.user.id);
  if (!user?.organizationId) redirect("/login");

  // Als intake al is afgerond, geen reden om hier te zijn — naar
  // dashboard. (De layout-redirect doet dit ook, maar een directe
  // /portal/intake-bezoek na completion is mogelijk.)
  if (user.organization?.intakeCompletedAt != null) {
    redirect("/portal/dashboard");
  }

  const t = await getTranslations("portal.intake");
  const tRaw = await getTranslations();
  const steps = tRaw.raw("portal.intake.steps") as Array<{
    key: string;
    label: string;
    title: string;
    lede: string;
    fields: Record<string, unknown>;
  }>;
  const validation = tRaw.raw("portal.intake.validation") as {
    required: string;
    tooLong: string;
    fileTooLarge: string;
    tooManyChecked: string;
  };

  // Bestaande draft ophalen (als die er is)
  const draft = await db.query.intakeResponses.findFirst({
    where: eq(intakeResponses.organizationId, user.organizationId),
  });

  // Geen draft, maar wel een configurator-aanvraag-cookie? Gebruik die als
  // start zodat de klant niet opnieuw hoeft te tikken wat 'ie net invulde.
  let prefillFromCookie: Record<string, unknown> | null = null;
  if (!draft) {
    try {
      const raw = (await cookies()).get("wb_proj_request")?.value;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object")
          prefillFromCookie = parsed as Record<string, unknown>;
      }
    } catch {
      /* corrupte cookie — negeren */
    }
  }

  const initialAnswers = (draft?.answers ?? prefillFromCookie ?? {}) as Record<string, unknown>;
  const initialStep = draft?.currentStep ?? 1;

  return (
    <main className="dotted-bg min-h-screen px-6 py-12 md:py-20">
      <div className="mx-auto max-w-3xl">
        <header className="mb-12">
          <p className="font-mono text-[11px] tracking-widest text-(--color-wine) uppercase">
            {"// "}
            {t("eyebrow")}
          </p>
          <h1 className="mt-3 font-serif text-[clamp(28px,4vw,40px)] leading-tight">
            {t("title")
              .split("*")
              .map((segment, i) =>
                i % 2 === 1 ? (
                  <em key={i} className="text-(--color-accent) not-italic">
                    {segment}
                  </em>
                ) : (
                  <span key={i}>{segment}</span>
                ),
              )}
          </h1>
          <p className="mt-4 max-w-[60ch] text-(--color-muted)">{t("lede")}</p>
        </header>

        <IntakeForm
          strings={{
            eyebrow: t("eyebrow"),
            title: t("title"),
            lede: t("lede"),
            progressLabel: t("progressLabel"),
            saveAndClose: t("saveAndClose"),
            next: t("next"),
            back: t("back"),
            submit: t("submit"),
            submitting: t("submitting"),
            savedDraft: t("savedDraft"),
            submittedTitle: t("submittedTitle"),
            submittedBody: t("submittedBody"),
            submittedCta: t("submittedCta"),
            steps: steps as never,
            validation,
          }}
          initialAnswers={initialAnswers}
          initialStep={initialStep}
          dashboardHref={locale === "nl" ? "/portal/dashboard" : `/${locale}/portal/dashboard`}
        />
      </div>
    </main>
  );
}
