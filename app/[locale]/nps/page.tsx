import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { npsResponses, projects } from "@/lib/db/schema";
import { routing } from "@/i18n/routing";
import { NpsForm } from "@/components/portal/NpsForm";

/**
 * Publieke NPS-antwoord-page. Token komt mee in de mail-link en is
 * de enige auth — geen session vereist (klanten loggen niet altijd in
 * voor één klik). Token is one-shot: na submit wordt respondedAt
 * gezet en kan dezelfde URL alleen nog "bedankt" tonen.
 */
export default async function NpsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { locale } = await params;
  const { token } = await searchParams;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("nps");
  const lang = locale === "es" ? "es" : "nl";

  if (!token) {
    return (
      <main className="dotted-bg flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md text-center">
          <h1 className="font-serif text-[28px] leading-tight">{t("invalidTitle")}</h1>
          <p className="mt-3 text-[14px] text-(--color-muted)">{t("invalidBody")}</p>
        </div>
      </main>
    );
  }

  const row = await db.query.npsResponses.findFirst({
    where: eq(npsResponses.token, token),
    columns: {
      id: true,
      askedAfterDays: true,
      respondedAt: true,
      score: true,
      projectId: true,
    },
  });
  if (!row) {
    return (
      <main className="dotted-bg flex min-h-screen items-center justify-center px-6 py-12">
        <div className="w-full max-w-md text-center">
          <h1 className="font-serif text-[28px] leading-tight">{t("invalidTitle")}</h1>
          <p className="mt-3 text-[14px] text-(--color-muted)">{t("invalidBody")}</p>
        </div>
      </main>
    );
  }

  const project = await db.query.projects.findFirst({
    where: eq(projects.id, row.projectId),
    columns: { name: true },
  });
  const projectName = project?.name ?? "";

  const alreadyAnswered = row.respondedAt !== null;

  return (
    <main className="dotted-bg flex min-h-screen items-start justify-center px-6 py-12 md:items-center">
      <div className="w-full max-w-xl">
        <p className="font-mono text-[11px] tracking-widest text-(--color-accent) uppercase">
          {`// ${t("eyebrow")}`}
        </p>
        <h1 className="mt-3 font-serif text-[clamp(28px,4vw,38px)] leading-tight">
          {alreadyAnswered ? t("thanksTitle") : t("title")}
        </h1>
        {alreadyAnswered ? (
          <p className="mt-4 text-[15px] leading-[1.6] text-(--color-muted)">
            {t("thanksBody", { score: row.score ?? 0 })}
          </p>
        ) : (
          <>
            <p className="mt-4 max-w-prose text-[15px] leading-[1.6] text-(--color-muted)">
              {t("intro", { project: projectName, days: row.askedAfterDays })}
            </p>
            <NpsForm
              token={token}
              strings={{
                scoreLabel: t("scoreLabel"),
                scoreHelpLow: t("scoreHelpLow"),
                scoreHelpHigh: t("scoreHelpHigh"),
                commentLabel: t("commentLabel"),
                commentPlaceholder: t("commentPlaceholder"),
                submitLabel: t("submitLabel"),
                submitting: t("submitting"),
                errorToast: t("errorToast"),
                successToast: t("successToast"),
              }}
              locale={lang}
            />
          </>
        )}
      </div>
    </main>
  );
}
