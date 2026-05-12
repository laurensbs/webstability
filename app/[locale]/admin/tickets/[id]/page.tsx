import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import NextLink from "next/link";
import { ArrowLeft } from "lucide-react";
import { routing } from "@/i18n/routing";
import { getAdminTicketDetail } from "@/lib/db/queries/admin";
import {
  staffReplyToTicket,
  changeTicketStatusDirect,
  changeTicketPriority,
} from "@/app/actions/admin";
import { ToastForm } from "@/components/portal/ToastForm";
import { ToastSubmitButton } from "@/components/portal/ToastSubmitButton";
import { TicketRepliesLive } from "@/components/portal/TicketRepliesLive";

type Status = "open" | "in_progress" | "waiting" | "closed";

const STATUS_LABEL_NL: Record<Status, string> = {
  open: "open",
  in_progress: "in behandeling",
  waiting: "wachtend",
  closed: "gesloten",
};
const PRIORITY_LABEL_NL: Record<string, string> = { low: "laag", normal: "normaal", high: "hoog" };

export default async function AdminTicketDetail({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const ticket = await getAdminTicketDetail(id);
  if (!ticket) notFound();

  const t = await getTranslations("admin.ticketDetail");
  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });

  const replyAction = staffReplyToTicket.bind(null, ticket.id);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <NextLink
        href={`/${locale === "nl" ? "" : `${locale}/`}admin/tickets`}
        className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-widest text-(--color-muted) uppercase transition-colors hover:text-(--color-text)"
      >
        <ArrowLeft className="h-3 w-3" strokeWidth={2.4} />
        {t("back")}
      </NextLink>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] tracking-widest text-(--color-muted) uppercase">
            {PRIORITY_LABEL_NL[ticket.priority] ?? ticket.priority}
          </span>
          <span className="rounded-md border border-(--color-border) px-2 py-0.5 font-mono text-[11px] tracking-widest uppercase">
            {STATUS_LABEL_NL[ticket.status as Status] ?? ticket.status}
          </span>
          {ticket.overBudget ? (
            <span className="rounded-full bg-(--color-wine)/10 px-2 py-0.5 font-mono text-[10px] tracking-widest text-(--color-wine) uppercase">
              over-budget
            </span>
          ) : null}
        </div>
        <h1 className="font-serif text-[clamp(24px,3.5vw,34px)] leading-tight">{ticket.subject}</h1>
        <p className="font-mono text-[11px] text-(--color-muted)">
          {t("createdAt", { when: dateFmt.format(ticket.createdAt) })}
          {" · "}
          {t("createdBy")}: {ticket.user?.name ?? ticket.user?.email ?? "—"}
          {ticket.organization ? (
            <>
              {" · "}
              {t("org")}:{" "}
              <NextLink
                href={`/${locale === "nl" ? "" : `${locale}/`}admin/orgs/${ticket.organization.id}`}
                className="text-(--color-accent) hover:underline"
              >
                {ticket.organization.name}
              </NextLink>
            </>
          ) : null}
          {ticket.project ? ` · ${t("project")}: ${ticket.project.name}` : null}
        </p>
      </header>

      {/* Status- + prioriteit-controls */}
      <div className="space-y-3 border-y border-(--color-border) py-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-16 shrink-0 font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
            {t("statusLabel")}
          </span>
          {(
            [
              ["in_progress", t("setInProgress")],
              ["waiting", t("setWaiting")],
              ["closed", ticket.status === "closed" ? t("reopen") : t("setClosed")],
            ] as Array<[Status | "reopen", string]>
          ).map(([key, label]) => {
            const target: Status = key === "reopen" ? "open" : (key as Status);
            const active = ticket.status === target;
            return (
              <form key={key} action={changeTicketStatusDirect.bind(null, ticket.id, target)}>
                <button
                  type="submit"
                  disabled={active}
                  className={`rounded-full border px-3 py-1 font-mono text-[11px] tracking-wide uppercase transition-colors ${
                    active
                      ? "border-(--color-accent) bg-(--color-accent)/10 text-(--color-accent)"
                      : "border-(--color-border) text-(--color-muted) hover:border-(--color-accent)/40 hover:text-(--color-text)"
                  }`}
                >
                  {label}
                </button>
              </form>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-16 shrink-0 font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
            {t("priorityLabel")}
          </span>
          {(
            [
              ["low", t("setLow")],
              ["normal", t("setNormal")],
              ["high", t("setHigh")],
            ] as Array<["low" | "normal" | "high", string]>
          ).map(([key, label]) => {
            const active = ticket.priority === key;
            return (
              <form key={key} action={changeTicketPriority.bind(null, ticket.id, key)}>
                <button
                  type="submit"
                  disabled={active}
                  className={`rounded-full border px-3 py-1 font-mono text-[11px] tracking-wide uppercase transition-colors ${
                    active
                      ? key === "high"
                        ? "border-(--color-wine) bg-(--color-wine)/10 text-(--color-wine)"
                        : "border-(--color-accent) bg-(--color-accent)/10 text-(--color-accent)"
                      : "border-(--color-border) text-(--color-muted) hover:border-(--color-accent)/40 hover:text-(--color-text)"
                  }`}
                >
                  {label}
                </button>
              </form>
            );
          })}
        </div>
      </div>

      {/* Oorspronkelijk bericht */}
      <article className="rounded-lg border border-(--color-border) bg-(--color-surface) p-6">
        <p className="font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
          {t("originalMessage")}
        </p>
        <p className="mt-3 leading-relaxed whitespace-pre-wrap text-(--color-text)">
          {ticket.body}
        </p>
      </article>

      {/* Reply-thread (live polling — gedeeld met het portal). Interne notities
          worden hier wél getoond (staff ziet alles); de klant ziet ze nooit. */}
      <TicketRepliesLive
        ticketId={ticket.id}
        initialReplies={ticket.replies.map((r) => ({
          id: r.id,
          body: r.body,
          internal: r.internal,
          createdAt: r.createdAt.toISOString(),
          author: {
            id: r.user.id,
            name: r.user.name,
            email: r.user.email,
            isStaff: r.user.isStaff,
          },
        }))}
        locale={locale}
        strings={{
          noReplies: t("noReplies"),
          staffBadge: t("staffBadge"),
          internalBadge: t("internalBadge"),
        }}
      />

      {/* Staff-antwoord aan de klant */}
      <ToastForm action={replyAction} resetOnSuccess className="space-y-3">
        <label className="block">
          <span className="mb-2 block font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
            {t("replyLabel")}
          </span>
          <textarea
            name="body"
            rows={5}
            required
            placeholder={t("replyPlaceholder")}
            className="w-full rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-2.5 text-[14px] outline-none focus:border-(--color-accent)/60"
          />
        </label>
        <ToastSubmitButton variant="primary">{t("send")}</ToastSubmitButton>
      </ToastForm>

      {/* Interne notitie — alleen voor het studio-team, klant ziet 'm nooit */}
      <ToastForm action={replyAction} resetOnSuccess className="space-y-3">
        <input type="hidden" name="internal" value="1" />
        <label className="block">
          <span className="mb-2 block font-mono text-[10px] tracking-widest text-(--color-wine) uppercase">
            {t("internalNoteLabel")}
          </span>
          <textarea
            name="body"
            rows={3}
            required
            placeholder={t("internalNotePlaceholder")}
            className="w-full rounded-md border border-dashed border-(--color-wine)/40 bg-(--color-wine)/[0.03] px-3 py-2.5 text-[14px] outline-none focus:border-(--color-wine)/60"
          />
        </label>
        <ToastSubmitButton variant="ghost">{t("internalNoteSend")}</ToastSubmitButton>
      </ToastForm>
    </div>
  );
}
