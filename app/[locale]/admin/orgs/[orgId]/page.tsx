import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import NextLink from "next/link";
import { routing } from "@/i18n/routing";
import { getOrgWithDetails, getOrgHoursThisMonth } from "@/lib/db/queries/admin";
import { updateProject, logHours } from "@/app/actions/admin";
import { ToastForm } from "@/components/portal/ToastForm";
import { ToastSubmitButton } from "@/components/portal/ToastSubmitButton";
import { budgetMinutesFor } from "@/lib/plan-budget";

export default async function OrgDetail({
  params,
}: {
  params: Promise<{ locale: string; orgId: string }>;
}) {
  const { locale, orgId } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const org = await getOrgWithDetails(orgId);
  if (!org) notFound();

  const hours = await getOrgHoursThisMonth(orgId);
  const budgetMinutes = budgetMinutesFor(org.plan);
  const usedMinutes = hours.minutesUsed;
  const usagePct =
    budgetMinutes > 0 ? Math.min(100, Math.round((usedMinutes / budgetMinutes) * 100)) : 0;

  const t = await getTranslations("admin.org");
  const tProjects = await getTranslations("portal.projects");
  const tSettings = await getTranslations("portal.settings");
  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  const todayIso = new Date().toISOString().split("T")[0];
  const logHoursAction = logHours.bind(null, orgId);

  const backHref = locale === "nl" ? "/admin/orgs" : `/${locale}/admin/orgs`;

  return (
    <div className="space-y-10">
      <NextLink
        href={backHref}
        className="font-mono text-xs tracking-widest text-(--color-muted) uppercase hover:text-(--color-accent)"
      >
        ← {t("back")}
      </NextLink>

      <header className="space-y-2">
        <h1 className="text-3xl md:text-5xl">{org.name}</h1>
        <p className="font-mono text-xs text-(--color-muted)">
          {org.country} · {org.plan ?? "no plan"} · created {dateFmt.format(org.createdAt)}
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-xl font-medium">{t("members")}</h2>
        {org.members.length === 0 ? (
          <p className="text-sm text-(--color-muted)">—</p>
        ) : (
          <ul className="divide-y divide-(--color-border) overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface)">
            {org.members.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-4 px-6 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{m.name ?? m.email}</p>
                  <p className="truncate font-mono text-xs text-(--color-muted)">{m.email}</p>
                </div>
                <span className="rounded-md border border-(--color-border) px-2 py-0.5 font-mono text-xs tracking-widest uppercase">
                  {tSettings(`roles.${m.role}`)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-medium">{t("projects")}</h2>
        {org.projects.length === 0 ? (
          <p className="text-sm text-(--color-muted)">{t("noProjects")}</p>
        ) : (
          <ul className="space-y-4">
            {org.projects.map((p) => {
              const updateAction = updateProject.bind(null, p.id);
              return (
                <li
                  key={p.id}
                  className="rounded-lg border border-(--color-border) bg-(--color-surface) p-6"
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="text-lg font-medium">{p.name}</h3>
                    <span className="font-mono text-xs tracking-widest text-(--color-accent) uppercase">
                      {tProjects(`type.${p.type}`)}
                    </span>
                  </div>

                  <ToastForm
                    action={updateAction}
                    className="mt-4 grid gap-3 sm:grid-cols-[1fr_140px_auto] sm:items-end"
                  >
                    <label className="space-y-1">
                      <span className="block text-xs font-medium">Status</span>
                      <select
                        name="status"
                        defaultValue={p.status}
                        className="w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm outline-none focus:border-(--color-accent)"
                      >
                        <option value="planning">{tProjects("status.planning")}</option>
                        <option value="in_progress">{tProjects("status.in_progress")}</option>
                        <option value="review">{tProjects("status.review")}</option>
                        <option value="live">{tProjects("status.live")}</option>
                        <option value="done">{tProjects("status.done")}</option>
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="block text-xs font-medium">{t("progress")} %</span>
                      <input
                        type="number"
                        name="progress"
                        min={0}
                        max={100}
                        defaultValue={p.progress}
                        className="w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm outline-none focus:border-(--color-accent)"
                      />
                    </label>
                    <ToastSubmitButton variant="accent" size="md">
                      {t("saveProject")}
                    </ToastSubmitButton>
                  </ToastForm>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Hours log — staff vult uren in, klant ziet ze in zijn portaal */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-xl font-medium">{t("hoursLog")}</h2>
          {budgetMinutes > 0 ? (
            <p className="font-mono text-xs text-(--color-muted)">
              {Math.round(usedMinutes / 60).toString()}u {usedMinutes % 60}m / {budgetMinutes / 60}u
              · {usagePct}%
            </p>
          ) : null}
        </div>

        <div className="rounded-lg border border-(--color-border) bg-(--color-surface) p-6">
          <ToastForm
            action={logHoursAction}
            className="grid gap-3 sm:grid-cols-[120px_140px_1fr_auto] sm:items-end"
          >
            <label className="space-y-1">
              <span className="block text-xs font-medium">{t("hoursMinutes")}</span>
              <input
                type="number"
                name="minutes"
                min={1}
                max={480}
                step={5}
                defaultValue={30}
                className="w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm outline-none focus:border-(--color-accent)"
                required
              />
            </label>
            <label className="space-y-1">
              <span className="block text-xs font-medium">{t("hoursWorkedOn")}</span>
              <input
                type="date"
                name="workedOn"
                defaultValue={todayIso}
                className="w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm outline-none focus:border-(--color-accent)"
              />
            </label>
            <label className="space-y-1">
              <span className="block text-xs font-medium">{t("hoursDescription")}</span>
              <input
                type="text"
                name="description"
                placeholder={t("hoursDescPlaceholder")}
                className="w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm outline-none focus:border-(--color-accent)"
                required
              />
            </label>
            <ToastSubmitButton variant="accent" size="md">
              {t("hoursSubmit")}
            </ToastSubmitButton>
          </ToastForm>

          {org.projects.length > 0 ? (
            <details className="mt-3 text-xs text-(--color-muted)">
              <summary className="cursor-pointer">+ {t("hoursProject")}</summary>
              <select
                name="projectId"
                form="" // staat los van het log-form; alleen visueel hint
                className="mt-2 w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2"
                disabled
              >
                <option>{t("hoursNoProject")}</option>
                {org.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </details>
          ) : null}
        </div>

        {/* Recent gelogd */}
        <div className="space-y-2">
          <h3 className="font-mono text-xs tracking-widest text-(--color-muted) uppercase">
            {t("hoursRecent")}
          </h3>
          {hours.recent.length === 0 ? (
            <p className="text-sm text-(--color-muted)">{t("hoursNone")}</p>
          ) : (
            <ul className="divide-y divide-(--color-border) overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface)">
              {hours.recent.map((entry) => (
                <li key={entry.id} className="flex items-baseline justify-between gap-4 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{entry.description}</p>
                    <p className="font-mono text-[11px] text-(--color-muted)">
                      {dateFmt.format(entry.workedOn)}
                      {entry.project ? ` · ${entry.project.name}` : ""}
                      {entry.loggedByUser
                        ? ` · ${entry.loggedByUser.name ?? entry.loggedByUser.email}`
                        : ""}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-xs text-(--color-accent)">
                    {entry.minutes}m
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
