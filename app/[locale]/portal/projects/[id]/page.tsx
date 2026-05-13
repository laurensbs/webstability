import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Sparkles,
  MessageCircle,
  FileText,
  Clock,
  CheckCircle2,
  ListChecks,
  Inbox,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { routing } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { getUserWithOrg, getOrgProjectDetail } from "@/lib/db/queries/portal";
import { DeliverableApprovalCard } from "@/components/portal/DeliverableApprovalCard";
import { ProjectStatusStepper } from "@/components/portal/ProjectStatusStepper";
import { serviceKindFromProjectType } from "@/lib/service-kinds";

const STATUS_LABEL = {
  planning: { nl: "Planning", es: "Planificación" },
  in_progress: { nl: "In ontwikkeling", es: "En desarrollo" },
  review: { nl: "Review", es: "Revisión" },
  live: { nl: "Live", es: "En vivo" },
  done: { nl: "Afgerond", es: "Finalizado" },
} as const;

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function computeProgress(
  phase: { startedAt: Date | null; endsAt: Date | null } | null | undefined,
  fallback: number,
): { pct: number; weekText: string | null } {
  if (!phase?.startedAt || !phase?.endsAt) return { pct: fallback, weekText: null };
  const now = Date.now();
  const total = phase.endsAt.getTime() - phase.startedAt.getTime();
  const elapsed = Math.max(0, now - phase.startedAt.getTime());
  const pct = total > 0 ? Math.min(100, Math.round((elapsed / total) * 100)) : 0;
  const weekIndex = Math.max(1, Math.floor(elapsed / WEEK_MS) + 1);
  const totalWeeks = Math.max(weekIndex, Math.ceil(total / WEEK_MS));
  return { pct, weekText: `Week ${weekIndex} van ${totalWeeks}` };
}

/**
 * Project-detail-page voor klanten. Toont voortgang, mijlpaal,
 * staff-updates, openstaande vragen, en recente deliverables.
 * Strategie: dit is de pagina waar de klant zelf gaat kijken
 * 'hoe gaat 't?' i.p.v. mailen.
 */
export default async function ProjectDetailPage({
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

  const detail = await getOrgProjectDetail(user.organizationId, id);
  if (!detail) notFound();

  const { project, phase, updates, waitingTickets, recentFiles } = detail;
  const lang = locale === "es" ? "es" : "nl";
  const dateFmt = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });
  const fullDateFmt = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Voortgang berekenen — Date.now() in helper buiten render om
  // purity-rule te respecteren (zie computeProgress).
  const { pct: progressPct, weekText } = computeProgress(phase ?? null, project.progress);

  const t = await getTranslations("portal.projectDetail");

  return (
    <main className="dotted-bg min-h-screen px-6 py-8 md:py-12">
      <div className="mx-auto max-w-4xl space-y-10">
        {/* Header */}
        <div>
          <Link
            href="/portal/projects"
            className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-widest text-(--color-muted) uppercase transition-colors hover:text-(--color-text)"
          >
            <ArrowLeft className="h-3 w-3" strokeWidth={2.4} />
            {t("backToProjects")}
          </Link>
          <h1 className="mt-4 font-serif text-[clamp(28px,4vw,40px)] leading-tight">
            {project.name}
          </h1>
          <p className="mt-2 font-mono text-[11px] tracking-widest text-(--color-muted) uppercase">
            {STATUS_LABEL[project.status][lang]}
            {phase && weekText ? ` · ${weekText}` : null}
          </p>
        </div>

        {/* Fase-stepper — dienst-specifieke fasen (website/webshop/platform) */}
        <ProjectStatusStepper
          status={project.status}
          serviceKind={serviceKindFromProjectType(project.type)}
          strings={{ now: t("stepNow") }}
        />

        {/* Dienst-specifieke "wat gebeurt er nu / wat verwacht ik van jou"-
            hint per project-status × ServiceKind. Verdwijnt bij `done`
            (project is afgerond) en bij `live` voor de generieke `other`
            (LiveProjectStrip op het dashboard doet daar het werk al). */}
        {(() => {
          const kind = serviceKindFromProjectType(project.type);
          const key =
            project.status === "planning"
              ? "phaseHintPlanning"
              : project.status === "in_progress"
                ? "phaseHintInProgress"
                : project.status === "review"
                  ? "phaseHintReview"
                  : project.status === "live"
                    ? "phaseHintLive"
                    : null;
          if (!key) return null;
          const hint = t(`${key}.${kind}` as Parameters<typeof t>[0]);
          // Webshop tijdens bouw: extra regel met de concrete data-vraag
          // (productdata + betaalprovider) bovenop de generieke in_progress-hint.
          const extra =
            project.status === "in_progress" && kind === "webshop" ? t("phaseHintData") : null;
          return (
            <section className="rounded-panel flex items-start gap-3 border border-dashed border-(--color-accent)/30 bg-(--color-accent)/5 p-5">
              <Inbox className="mt-0.5 h-4 w-4 shrink-0 text-(--color-accent)" strokeWidth={2.2} />
              <div>
                <p className="font-mono text-[10px] tracking-widest text-(--color-accent) uppercase">
                  {t("phaseHintEyebrow")}
                </p>
                <p className="mt-1.5 text-[15px] leading-[1.55] text-(--color-text)">{hint}</p>
                {extra ? (
                  <p className="mt-2 text-[14px] leading-[1.55] text-(--color-text)/85">{extra}</p>
                ) : null}
              </div>
            </section>
          );
        })()}

        {/* Voortgang-balk */}
        {phase ? (
          <section className="rounded-panel border border-(--color-border) bg-(--color-surface) p-6">
            <div className="flex items-center justify-between gap-4">
              <p className="font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
                {t("progress")}
              </p>
              <p className="font-mono text-[12px] text-(--color-text)">{progressPct}%</p>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-(--color-border)">
              <div
                className="h-full bg-(--color-accent) transition-[width] duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[12px] text-(--color-muted)">
              <span>
                {phase.startedAt ? `${t("started")} ${fullDateFmt.format(phase.startedAt)}` : ""}
              </span>
              <span>
                {phase.endsAt ? `${t("planned")} ${fullDateFmt.format(phase.endsAt)}` : ""}
              </span>
            </div>
          </section>
        ) : null}

        {/* Handover-banner bij review-status */}
        {project.status === "review" ? (
          <Link
            href={{
              pathname: "/portal/projects/[id]/handover" as never,
              params: { id: project.id },
            }}
            className="rounded-panel flex items-center justify-between gap-4 border border-(--color-accent)/30 bg-(--color-accent)/5 px-6 py-5 transition-colors hover:bg-(--color-accent)/10"
          >
            <div className="flex items-start gap-3">
              <ListChecks
                className="mt-0.5 h-4 w-4 shrink-0 text-(--color-accent)"
                strokeWidth={2.4}
              />
              <div>
                <p className="font-mono text-[10px] tracking-widest text-(--color-accent) uppercase">
                  {t("handoverBannerEyebrow")}
                </p>
                <p className="mt-1 text-[15px] text-(--color-text)">{t("handoverBannerTitle")}</p>
              </div>
            </div>
            <span className="shrink-0 font-mono text-[11px] tracking-widest text-(--color-accent) uppercase">
              {t("handoverBannerCta")} →
            </span>
          </Link>
        ) : null}

        {/* Volgende mijlpaal */}
        {project.nextMilestone ? (
          <section className="rounded-panel border border-t-2 border-(--color-border) border-t-(--color-wine) bg-(--color-bg-warm) p-6">
            <p className="inline-flex items-center gap-2 font-mono text-[10px] tracking-widest text-(--color-wine) uppercase">
              <Sparkles className="h-3 w-3" strokeWidth={2.4} />
              {t("nextMilestone")}
            </p>
            <p className="mt-3 text-[16px] leading-[1.55] text-(--color-text)">
              {project.nextMilestone}
            </p>
            {project.nextMilestoneUpdatedAt ? (
              <p className="mt-3 font-mono text-[10px] tracking-wide text-(--color-muted) uppercase">
                {t("updatedOn")} {fullDateFmt.format(project.nextMilestoneUpdatedAt)}
              </p>
            ) : null}
          </section>
        ) : null}

        {/* Wekelijkse updates */}
        <section>
          <h2 className="mb-4 inline-flex items-center gap-2 font-mono text-[11px] tracking-widest text-(--color-text) uppercase">
            <MessageCircle className="h-3 w-3 text-(--color-accent)" strokeWidth={2.4} />
            {t("recentUpdates")}
          </h2>
          {updates.length === 0 ? (
            <p className="rounded-lg border border-dashed border-(--color-border) bg-(--color-bg-warm)/50 px-5 py-6 text-[14px] text-(--color-muted)">
              {t("noUpdates")}
            </p>
          ) : (
            <ul className="rounded-card divide-y divide-(--color-border) overflow-hidden border border-(--color-border) bg-(--color-surface)">
              {updates.map((u) => (
                <li key={u.id} className="px-5 py-4">
                  <p className="font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
                    {dateFmt.format(u.createdAt)}
                    {u.postedByUser?.name ? ` · ${u.postedByUser.name}` : ""}
                  </p>
                  <p className="mt-2 text-[14px] leading-[1.6] whitespace-pre-wrap text-(--color-text)">
                    {u.body}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Open vragen voor klant */}
        {waitingTickets.length > 0 ? (
          <section>
            <h2 className="mb-4 inline-flex items-center gap-2 font-mono text-[11px] tracking-widest text-(--color-text) uppercase">
              <Clock className="h-3 w-3 text-(--color-wine)" strokeWidth={2.4} />
              {t("waitingForYou")}
            </h2>
            <ul className="rounded-card divide-y divide-(--color-border) overflow-hidden border border-(--color-border) bg-(--color-surface)">
              {waitingTickets.map((tk) => (
                <li key={tk.id}>
                  <Link
                    href={{
                      pathname: "/portal/tickets/[id]" as never,
                      params: { id: tk.id },
                    }}
                    className="flex items-start justify-between gap-4 px-5 py-4 transition-colors hover:bg-(--color-bg-warm)"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[14px] font-medium text-(--color-text)">
                        {tk.subject}
                      </p>
                      <p className="mt-1 font-mono text-[10px] tracking-wide text-(--color-muted) uppercase">
                        {dateFmt.format(tk.createdAt)}
                      </p>
                    </div>
                    <span className="shrink-0 font-mono text-[10px] tracking-widest text-(--color-wine) uppercase">
                      {t("respond")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {/* Deliverables (akkoord-flow) + overige files (download) */}
        {recentFiles.length > 0 ? (
          <ProjectFiles files={recentFiles} locale={locale} t={t} dateFmt={dateFmt} />
        ) : null}
      </div>
    </main>
  );
}

const DELIVERABLE_CATEGORIES = new Set([
  "deliverable",
  "screenshot",
  "wireframe",
  "brand_kit",
  "copy",
  "final_handover",
]);

function ProjectFiles({
  files,
  locale,
  t,
  dateFmt,
}: {
  files: Array<{
    id: string;
    name: string;
    url: string;
    category: string;
    version: number;
    approvedAt: Date | null;
    revisionRequestedAt: Date | null;
    revisionNote: string | null;
    createdAt: Date;
    replacesFileId: string | null;
  }>;
  locale: string;
  t: (key: string) => string;
  dateFmt: Intl.DateTimeFormat;
}) {
  // Splits in deliverables (akkoord-flow) en overige (alleen download).
  // Toon alleen huidige versies bij deliverables — vervangen versies
  // worden gefilterd zodat de klant niet vier varianten naast elkaar
  // ziet. (Voor staff in admin tonen we wel alle versies — andere page.)
  const replacedIds = new Set(files.filter((f) => f.replacesFileId).map((f) => f.replacesFileId));
  const deliverables = files
    .filter((f) => DELIVERABLE_CATEGORIES.has(f.category) && !replacedIds.has(f.id))
    .map((f) => ({
      id: f.id,
      name: f.name,
      url: f.url,
      category: f.category,
      version: f.version,
      approvedAt: f.approvedAt,
      revisionRequestedAt: f.revisionRequestedAt,
      revisionNote: f.revisionNote,
      createdAt: f.createdAt,
      replacesFileId: f.replacesFileId,
    }));
  const others = files.filter(
    (f) => !DELIVERABLE_CATEGORIES.has(f.category) && !replacedIds.has(f.id),
  );

  return (
    <>
      {deliverables.length > 0 ? (
        <section>
          <h2 className="mb-4 inline-flex items-center gap-2 font-mono text-[11px] tracking-widest text-(--color-text) uppercase">
            <CheckCircle2 className="h-3 w-3 text-(--color-success)" strokeWidth={2.4} />
            {t("deliverables")}
          </h2>
          <DeliverableApprovalCard
            deliverables={deliverables}
            locale={locale}
            strings={{
              title: t("deliverables"),
              empty: t("noDeliverables"),
              approveLabel: t("approve"),
              approving: t("approving"),
              approvedLabel: t("approved"),
              reviseLabel: t("revise"),
              revising: t("revising"),
              reviseTitle: t("reviseTitle"),
              reviseNotePlaceholder: t("reviseNotePlaceholder"),
              reviseSubmit: t("reviseSubmit"),
              reviseCancel: t("reviseCancel"),
              reviewedLabel: t("revisionRequested"),
              versionLabel: t("versionLabel"),
              approvedToast: t("approvedToast"),
              revisionToast: t("revisionToast"),
              errorToast: t("errorToast"),
              download: t("download"),
            }}
          />
        </section>
      ) : null}

      {others.length > 0 ? (
        <section>
          <h2 className="mb-4 inline-flex items-center gap-2 font-mono text-[11px] tracking-widest text-(--color-text) uppercase">
            <FileText className="h-3 w-3 text-(--color-accent)" strokeWidth={2.4} />
            {t("recentFiles")}
          </h2>
          <ul className="rounded-card divide-y divide-(--color-border) overflow-hidden border border-(--color-border) bg-(--color-surface)">
            {others.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-4 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] text-(--color-text)">{f.name}</p>
                  <p className="font-mono text-[10px] tracking-wide text-(--color-muted) uppercase">
                    {f.category} · {dateFmt.format(f.createdAt)}
                  </p>
                </div>
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 font-mono text-[11px] text-(--color-accent) hover:underline"
                >
                  {t("download")}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
