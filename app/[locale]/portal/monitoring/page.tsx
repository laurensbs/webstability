import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { routing } from "@/i18n/routing";
import { listMonitors, type Monitor } from "@/lib/better-stack";

export const revalidate = 60;

const dotMap: Record<Monitor["status"], string> = {
  up: "bg-(--color-success)",
  down: "bg-(--color-accent)",
  paused: "bg-(--color-muted)",
  pending: "bg-(--color-muted)",
  maintenance: "bg-amber-500",
  validating: "bg-(--color-muted)",
};

export default async function MonitoringPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const t = await getTranslations("portal.monitoring");

  let monitors: Monitor[] = [];
  let fetchError = false;
  try {
    monitors = await listMonitors();
  } catch {
    fetchError = true;
  }

  const dateFmt = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl md:text-4xl">{t("title")}</h1>
        <p className="text-(--color-muted)">{fetchError ? t("errorBody") : t("summary")}</p>
      </header>

      {fetchError ? null : monitors.length === 0 ? (
        <p className="text-(--color-muted)">{t("noMonitors")}</p>
      ) : (
        <ul className="divide-y divide-(--color-border) overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface)">
          {monitors.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-6 px-6 py-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{m.name}</p>
                <p className="mt-1 truncate font-mono text-xs text-(--color-muted)">{m.url}</p>
                {m.lastCheckedAt ? (
                  <p className="mt-1 font-mono text-xs text-(--color-muted)">
                    {t("lastChecked", { when: dateFmt.format(new Date(m.lastCheckedAt)) })}
                  </p>
                ) : null}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${dotMap[m.status]}`} aria-hidden />
                <span className="font-mono text-xs tracking-widest text-(--color-muted) uppercase">
                  {t(`label.${m.status}`)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
