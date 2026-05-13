import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ListChecks } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { and, eq } from "drizzle-orm";
import { users } from "@/lib/db/schema";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { getUserWithOrg, getHandoverStatus } from "@/lib/db/queries/portal";
import { HandoverChecklist } from "@/components/portal/HandoverChecklist";
import { projects } from "@/lib/db/schema";
import { serviceKindFromProjectType, HANDOVER_EXTRAS_BY_KIND } from "@/lib/service-kinds";

/**
 * Oplevering-checklist voor één project. Klant ziet 'm read-only en
 * krijgt zicht op wat nog mist; staff (isStaff) ziet de vinkjes als
 * interactief en — als alles ✓ — de "Markeer live"-knop.
 */
export default async function HandoverPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await getUserWithOrg(session.user.id);
  if (!user?.organizationId) redirect("/login");

  const staffRow = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
    columns: { isStaff: true },
  });
  const isStaff = Boolean(staffRow?.isStaff);

  const status = await getHandoverStatus(user.organizationId, id);
  if (!status) notFound();

  // Dienst-type → extra opleverpunten die alleen voor staff zichtbaar zijn
  // (puur informatief, geen persistente vinkjes — die staan in de vaste lijst).
  // Defensive: ook hier expliciet organizationId-filter, ook al heeft de
  // getHandoverStatus-call hierboven het project al naar deze org gescoped.
  const projectRow = await db.query.projects.findFirst({
    where: and(eq(projects.id, id), eq(projects.organizationId, user.organizationId)),
    columns: { type: true },
  });
  const serviceKind = serviceKindFromProjectType(projectRow?.type);
  const handoverExtras = isStaff ? HANDOVER_EXTRAS_BY_KIND[serviceKind] : [];

  const t = await getTranslations("portal.handover");
  const dateFmt = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
  });

  const itemLabels: Record<string, string> = {
    deliverables_approved: t("items.deliverables_approved"),
    domain_coupled: t("items.domain_coupled"),
    monitoring_active: t("items.monitoring_active"),
    credentials_sent: t("items.credentials_sent"),
    maintenance_explained: t("items.maintenance_explained"),
    invoice_paid: t("items.invoice_paid"),
  };

  const itemsForUi = status.items.map((i) => ({
    key: i.key,
    label: itemLabels[i.key] ?? i.key,
    doneAt: i.doneAt,
    auto: i.auto,
    meta: "meta" in i ? i.meta : undefined,
  }));

  return (
    <main className="dotted-bg min-h-screen px-6 py-8 md:py-12">
      <div className="mx-auto max-w-3xl space-y-8">
        <div>
          <Link
            href={{
              pathname: "/portal/projects/[id]" as never,
              params: { id },
            }}
            className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-widest text-(--color-muted) uppercase transition-colors hover:text-(--color-text)"
          >
            <ArrowLeft className="h-3 w-3" strokeWidth={2.4} />
            {t("backToProject")}
          </Link>
          <h1 className="mt-4 inline-flex items-center gap-3 font-serif text-[clamp(28px,4vw,40px)] leading-tight">
            <ListChecks className="h-7 w-7 text-(--color-accent)" strokeWidth={2.2} />
            {t("title")}
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-[1.6] text-(--color-muted)">
            {t("intro", { project: status.project.name })}
          </p>
        </div>

        <HandoverChecklist
          projectId={status.project.id}
          items={itemsForUi}
          allDone={status.allDone}
          isStaff={isStaff}
          projectLive={Boolean(status.project.liveAt)}
          strings={{
            doneLabel: t("doneLabel"),
            pendingLabel: t("pendingLabel"),
            autoLabel: t("autoLabel"),
            markDoneLabel: t("markDoneLabel"),
            markUndoneLabel: t("markUndoneLabel"),
            markLiveLabel: t("markLiveLabel"),
            markingLive: t("markingLive"),
            liveLabel: t("liveLabel"),
            handoverIncompleteToast: t("handoverIncompleteToast"),
            itemSavedToast: t("itemSavedToast"),
            errorToast: t("errorToast"),
            projectLiveToast: t("projectLiveToast"),
            dateLocale: locale,
          }}
          dateFmt={(d: Date) => dateFmt.format(d)}
        />

        {handoverExtras.length > 0 ? (
          <section className="rounded-panel border border-dashed border-(--color-border) bg-(--color-surface)/60 p-5">
            <h2 className="font-mono text-[11px] tracking-widest text-(--color-muted) uppercase">
              {t("byKindTitle")}
            </h2>
            <p className="mt-1 text-[13px] text-(--color-muted)">{t("byKindHint")}</p>
            <ul className="mt-3 space-y-1.5">
              {handoverExtras.map((label) => (
                <li key={label} className="flex items-start gap-2 text-[14px] text-(--color-text)">
                  <span
                    aria-hidden
                    className="mt-2 h-1 w-1 shrink-0 rounded-full bg-(--color-muted)"
                  />
                  {label}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </main>
  );
}
