import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { routing } from "@/i18n/routing";
import { RevealOnScroll } from "@/components/shared/RevealOnScroll";
import { listMonitors, aggregateStatus, type Monitor } from "@/lib/better-stack";
import { MarkupText } from "@/components/animate/MarkupText";
import { SystemsGlobeMount } from "@/components/r3f/SystemsGlobeMount";

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

  const operationalCount = monitors.filter((m) => m.status === "up").length;
  const issueCount = monitors.filter(
    (m) => m.status === "down" || m.status === "maintenance",
  ).length;

  const isHealthy = overall === "operational";

  return (
    <main className="dotted-bg flex flex-1 flex-col">
      <section className="relative overflow-hidden px-6 pt-24 pb-12 md:pt-32">
        <SystemsGlobeMount className="pointer-events-none absolute -top-10 -right-20 hidden aspect-square w-[420px] opacity-90 lg:block" />
        <div className="relative mx-auto max-w-4xl space-y-6">
          <p className="font-mono text-xs tracking-widest text-(--color-muted) uppercase">
            {t("eyebrow")}
          </p>
          <h1 className="text-4xl leading-[1.1] md:text-6xl">
            {fetchError ? t("errorTitle") : <MarkupText>{t(titleKey)}</MarkupText>}
          </h1>
          <p className="max-w-2xl text-lg text-(--color-muted)">
            {fetchError ? t("errorBody") : t("summary")}
          </p>
        </div>
      </section>

      {!fetchError && (
        <section className="px-6 pb-24">
          <div className="mx-auto max-w-3xl space-y-6">
            {/* Overall status banner */}
            <RevealOnScroll>
              <div
                className={`flex items-center gap-4 rounded-lg border p-5 ${
                  isHealthy
                    ? "border-(--color-success)/30 bg-(--color-success)/5"
                    : "border-(--color-accent)/40 bg-(--color-accent-soft)/40"
                }`}
              >
                <span
                  className={`relative flex h-3 w-3 ${isHealthy ? "" : "animate-pulse"}`}
                  aria-hidden
                >
                  {isHealthy ? (
                    <>
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--color-success) opacity-50" />
                      <span className="relative inline-flex h-3 w-3 rounded-full bg-(--color-success)" />
                    </>
                  ) : (
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-(--color-accent)" />
                  )}
                </span>
                <p className="flex-1 text-sm">
                  <strong className="font-medium">
                    {operationalCount} / {monitors.length}
                  </strong>{" "}
                  <span className="text-(--color-muted)">services {t("labelOperational")}</span>
                </p>
                {isHealthy ? (
                  <CheckCircle2 className="h-5 w-5 text-(--color-success)" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-(--color-accent)" />
                )}
              </div>
            </RevealOnScroll>

            {/* Stats triplet */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: t("statsServices"), value: monitors.length, accent: false },
                { label: t("statsOperational"), value: operationalCount, accent: false },
                { label: t("statsIssue"), value: issueCount, accent: issueCount > 0 },
              ].map((s, i) => (
                <RevealOnScroll key={s.label} delay={i * 0.05}>
                  <div className="rounded-lg border border-(--color-border) bg-(--color-surface) px-4 py-4">
                    <p className="font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
                      {s.label}
                    </p>
                    <p
                      className={`mt-1.5 font-serif text-3xl ${
                        s.accent ? "text-(--color-accent)" : "text-(--color-text)"
                      }`}
                    >
                      {s.value}
                    </p>
                  </div>
                </RevealOnScroll>
              ))}
            </div>

            {/* Monitors list */}
            {monitors.length === 0 ? (
              <p className="text-(--color-muted)">{t("noMonitors")}</p>
            ) : (
              <ul className="divide-y divide-(--color-border) overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface)">
                {monitors.map((m, i) => (
                  <RevealOnScroll key={m.id} delay={i * 0.04}>
                    <li className="flex items-center justify-between gap-6 px-6 py-5 transition-colors hover:bg-(--color-bg-warm)/40">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{m.name}</p>
                        {m.lastCheckedAt ? (
                          <p className="mt-1 font-mono text-xs text-(--color-muted)">
                            {t("lastChecked", { when: dateFmt.format(new Date(m.lastCheckedAt)) })}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className={`relative flex h-2.5 w-2.5`} aria-hidden>
                          {m.status === "up" ? (
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--color-success) opacity-50" />
                          ) : null}
                          <span
                            className={`relative inline-flex h-2.5 w-2.5 rounded-full ${statusDot(m.status)}`}
                          />
                        </span>
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
