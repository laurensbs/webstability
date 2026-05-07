import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { Mail, Shield, X as IconX } from "lucide-react";
import { eq } from "drizzle-orm";
import { routing } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { listPendingStaffInvites, listStudioStaff } from "@/lib/db/queries/admin";
import { inviteStaff, revokeStaffInvite } from "@/app/actions/admin";
import { ToastForm } from "@/components/portal/ToastForm";
import { ToastSubmitButton } from "@/components/portal/ToastSubmitButton";

export default async function AdminTeamPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("admin.team");
  const session = await auth();
  const me = session?.user?.id
    ? await db.query.users.findFirst({
        where: eq(users.id, session.user.id),
        columns: { id: true },
      })
    : null;

  const [pending, staff] = await Promise.all([listPendingStaffInvites(), listStudioStaff()]);
  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });

  return (
    <div className="space-y-12">
      <header className="space-y-2">
        <h1 className="text-3xl md:text-5xl">{t("title")}</h1>
        <p className="max-w-2xl text-(--color-muted)">{t("subtitle")}</p>
      </header>

      {/* Invite-form */}
      <section className="rounded-2xl border border-(--color-border) bg-(--color-surface) p-6 md:p-8">
        <h2 className="mb-4 inline-flex items-center gap-2 text-base font-medium">
          <Mail className="h-4 w-4 text-(--color-accent)" strokeWidth={2} />
          {t("inviteHeading")}
        </h2>
        <ToastForm
          action={inviteStaff}
          resetOnSuccess
          className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"
        >
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-(--color-text)">
              {t("inviteEmailLabel")}
            </span>
            <input
              type="email"
              name="email"
              required
              placeholder={t("inviteEmailPlaceholder")}
              className="block min-h-11 w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-[15px] outline-none focus:border-(--color-accent) focus:ring-2 focus:ring-(--color-accent-soft)"
            />
          </label>
          <ToastSubmitButton variant="primary" className="sm:self-end">
            {t("inviteSubmit")}
          </ToastSubmitButton>
        </ToastForm>
      </section>

      {/* Pending invites */}
      <section>
        <h2 className="mb-4 text-base font-medium">{t("pendingHeading")}</h2>
        {pending.length === 0 ? (
          <p className="text-[14px] text-(--color-muted)">{t("pendingEmpty")}</p>
        ) : (
          <ul className="divide-y divide-(--color-border) overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface)">
            {pending.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium text-(--color-text)">
                    {inv.email}
                  </p>
                  <p className="text-[12px] text-(--color-muted)">
                    {t("pendingExpires", { when: dateFmt.format(inv.expiresAt) })}
                  </p>
                </div>
                <ToastForm action={revokeStaffInvite.bind(null, inv.id)}>
                  <ToastSubmitButton variant="ghost" className="text-(--color-muted)">
                    <IconX className="h-3.5 w-3.5" />
                    {t("pendingRevoke")}
                  </ToastSubmitButton>
                </ToastForm>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Active staff */}
      <section>
        <h2 className="mb-4 inline-flex items-center gap-2 text-base font-medium">
          <Shield className="h-4 w-4 text-(--color-wine)" strokeWidth={2} />
          {t("staffHeading")}
        </h2>
        {staff.length === 0 ? (
          <p className="text-[14px] text-(--color-muted)">{t("staffEmpty")}</p>
        ) : (
          <ul className="divide-y divide-(--color-border) overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface)">
            {staff.map((s) => {
              const isMe = me?.id === s.id;
              return (
                <li key={s.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-medium text-(--color-text)">
                      {s.name ?? s.email}
                      {isMe ? (
                        <span className="ml-2 text-[12px] text-(--color-muted)">
                          {t("staffYou")}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-[12px] text-(--color-muted)">{s.email}</p>
                  </div>
                  <p className="text-[12px] text-(--color-muted)">
                    {t("staffSince", { when: dateFmt.format(s.createdAt) })}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
