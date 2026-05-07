import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { routing } from "@/i18n/routing";
import { getUserWithOrg, getTicketWithReplies } from "@/lib/db/queries/portal";
import { replyToTicket } from "@/app/actions/tickets";
import NextLink from "next/link";
import { ToastForm } from "@/components/portal/ToastForm";
import { ToastSubmitButton } from "@/components/portal/ToastSubmitButton";
import { TicketRepliesLive } from "@/components/portal/TicketRepliesLive";

export default async function TicketDetail({
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

  const ticket = await getTicketWithReplies(user.organizationId, id);
  if (!ticket) notFound();

  const t = await getTranslations("portal.tickets");
  const dateFmt = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const replyAction = replyToTicket.bind(null, ticket.id);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <NextLink
        href={locale === "nl" ? "/portal/tickets" : `/${locale}/portal/tickets`}
        className="font-mono text-xs tracking-widest text-(--color-muted) uppercase hover:text-(--color-accent)"
      >
        ← {t("back")}
      </NextLink>

      <header className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-xs tracking-widest text-(--color-muted) uppercase">
            {t(`priority.${ticket.priority}`)}
          </span>
          <span className="rounded-md border border-(--color-border) px-2 py-0.5 font-mono text-xs tracking-widest uppercase">
            {t(`status.${ticket.status}`)}
          </span>
        </div>
        <h1 className="text-2xl md:text-4xl">{ticket.subject}</h1>
        <p className="font-mono text-xs text-(--color-muted)">
          {t("createdAt", { when: dateFmt.format(ticket.createdAt) })} ·{" "}
          {ticket.user?.name ?? ticket.user?.email}
        </p>
      </header>

      <article className="rounded-lg border border-(--color-border) bg-(--color-surface) p-6">
        <p className="leading-relaxed whitespace-pre-wrap">{ticket.body}</p>
      </article>

      <TicketRepliesLive
        ticketId={ticket.id}
        initialReplies={ticket.replies.map((r) => ({
          id: r.id,
          body: r.body,
          createdAt: r.createdAt.toISOString(),
          author: {
            id: r.user.id,
            name: r.user.name,
            email: r.user.email,
            isStaff: r.user.isStaff,
          },
        }))}
        dateFmt={dateFmt}
        strings={{
          noReplies: t("noReplies"),
          staffBadge: t("staffBadge"),
        }}
      />

      <ToastForm action={replyAction} resetOnSuccess className="space-y-3">
        <textarea
          name="body"
          rows={4}
          required
          className="w-full rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-2 text-sm outline-none focus:border-(--color-accent)"
        />
        <ToastSubmitButton>{t("reply")}</ToastSubmitButton>
      </ToastForm>
    </div>
  );
}
