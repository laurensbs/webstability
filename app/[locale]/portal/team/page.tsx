import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { routing } from "@/i18n/routing";
import { getUserWithOrg, listOrgMembers } from "@/lib/db/queries/portal";
import { inviteMember } from "@/app/actions/team";
import { ToastForm } from "@/components/portal/ToastForm";
import { ToastSubmitButton } from "@/components/portal/ToastSubmitButton";
import { EmptyState } from "@/components/portal/EmptyState";
import { Users } from "lucide-react";

export default async function TeamPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const me = await getUserWithOrg(session.user.id);
  if (!me?.organizationId) redirect("/login");

  const t = await getTranslations("portal.team");
  const tSettings = await getTranslations("portal.settings");
  const members = await listOrgMembers(me.organizationId);
  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  const isOwner = me.role === "owner";

  return (
    <div className="space-y-8">
      <h1 className="text-3xl md:text-4xl">{t("title")}</h1>

      {isOwner ? (
        <ToastForm
          action={inviteMember}
          resetOnSuccess
          className="space-y-4 rounded-lg border border-(--color-border) bg-(--color-surface) p-6"
        >
          <h2 className="text-lg font-medium">{t("invite")}</h2>

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium">
              {t("inviteEmailLabel")}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm outline-none focus:border-(--color-accent)"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="role" className="block text-sm font-medium">
              {t("inviteRoleLabel")}
            </label>
            <select
              id="role"
              name="role"
              defaultValue="member"
              className="w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm outline-none focus:border-(--color-accent)"
            >
              <option value="member">{tSettings("roles.member")}</option>
              <option value="read_only">{tSettings("roles.read_only")}</option>
              <option value="owner">{tSettings("roles.owner")}</option>
            </select>
          </div>

          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-(--color-muted)">{t("inviteHint")}</p>
            <ToastSubmitButton variant="accent">{t("inviteSubmit")}</ToastSubmitButton>
          </div>
        </ToastForm>
      ) : (
        <p className="rounded-lg border border-dashed border-(--color-border) bg-(--color-bg-warm)/50 px-6 py-4 text-sm text-(--color-muted)">
          {t("ownerOnly")}
        </p>
      )}

      {members.length === 0 ? (
        <EmptyState icon={Users} title={t("empty")} body={t("emptyBody")} />
      ) : (
        <ul className="divide-y divide-(--color-border) overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface)">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between gap-4 px-6 py-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {m.name ?? m.email}
                  {m.id === me.id ? (
                    <span className="ml-2 font-mono text-xs text-(--color-muted)">
                      ({t("you")})
                    </span>
                  ) : null}
                </p>
                <p className="mt-1 truncate font-mono text-xs text-(--color-muted)">
                  {m.email} · {t("memberSince", { when: dateFmt.format(m.createdAt) })}
                </p>
              </div>
              <span className="rounded-md border border-(--color-border) px-2 py-0.5 font-mono text-xs tracking-widest uppercase">
                {tSettings(`roles.${m.role}`)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
