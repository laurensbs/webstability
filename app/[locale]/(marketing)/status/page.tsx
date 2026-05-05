import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { PageHeader } from "@/components/marketing/PageHeader";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";
import { listMonitors, aggregateStatus, type Monitor } from "@/lib/better-stack";

export const revalidate = 60;

function statusDot(status: Monitor["status"]) {
  const map: Record<Monitor["status"], string> = {
    up: "bg-(--color-success)",
    down: "bg-(--color-accent)",
    paused: "bg-(--color-muted)",
    pending: "bg-(--color-muted)",
    maintenance: "bg-amber-500",
    validating: "bg-(--color-muted)",
  };
  return map[status] ?? "bg-(--color-muted)";
}

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("status");

  let monitors: Monitor[] = [];
  let fetchError = false;
  try {
    monitors = await listMonitors();
  } catch {
    fetchError = true;
  }

  const overall = aggregateStatus(monitors);
  const titleKey =
    overall === "operational" ? "title" : overall === "degraded" ? "titleDegraded" : "titleDown";

  const dateFmt = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const labelMap: Record<Monitor["status"], string> = {
    up: t("labelOperational"),
    down: t("labelDown"),
    paused: t("labelPaused"),
    pending: t("labelUnknown"),
    maintenance: t("labelDegraded"),
    validating: t("labelUnknown"),
  };

  return (
    <main className="dotted-bg flex flex-1 flex-col">
      <PageHeader
        eyebrow={t("eyebrow")}
        title={fetchError ? t("errorTitle") : t.rich(titleKey, { em: (c) => <em>{c}</em> })}
        lede={fetchError ? t("errorBody") : t("summary")}
      />

      {!fetchError && (
        <section className="px-6 pb-24">
          <div className="mx-auto max-w-3xl">
            {monitors.length === 0 ? (
              <p className="text-(--color-muted)">{t("noMonitors")}</p>
            ) : (
              <ul className="divide-y divide-(--color-border) rounded-lg border border-(--color-border) bg-(--color-surface)">
                {monitors.map((m, i) => (
                  <RevealOnScroll key={m.id} delay={i * 0.04}>
                    <li className="flex items-center justify-between gap-6 px-6 py-5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{m.name}</p>
                        {m.lastCheckedAt ? (
                          <p className="mt-1 font-mono text-xs text-(--color-muted)">
                            {t("lastChecked", { when: dateFmt.format(new Date(m.lastCheckedAt)) })}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${statusDot(m.status)}`}
                          aria-hidden
                        />
                        <span className="font-mono text-xs tracking-widest text-(--color-muted) uppercase">
                          {labelMap[m.status]}
                        </span>
                      </div>
                    </li>
                  </RevealOnScroll>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
