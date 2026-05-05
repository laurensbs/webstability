import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { routing } from "@/i18n/routing";
import { getUserWithOrg } from "@/lib/db/queries/portal";
import { updateProfile } from "@/app/actions/settings";
import { openBillingPortal } from "@/app/actions/billing";
import { Button } from "@/components/ui/Button";

export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await getUserWithOrg(session.user.id);
  if (!user) redirect("/login");

  const t = await getTranslations("portal.settings");
  const tCare = await getTranslations("pricing.care");
  const isOwner = user.role === "owner";
  const hasStripeCustomer = Boolean(user.organization?.stripeCustomerId);

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <h1 className="text-3xl md:text-4xl">{t("title")}</h1>

      <form action={updateProfile} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-medium">
            {t("name")}
          </label>
          <input
            id="name"
            name="name"
            type="text"
            defaultValue={user.name ?? ""}
            className="w-full rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-2 text-sm outline-none focus:border-(--color-accent)"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">{t("email")}</label>
          <p className="rounded-md border border-(--color-border) bg-(--color-bg-warm)/50 px-3 py-2 font-mono text-sm text-(--color-muted)">
            {user.email}
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="locale" className="block text-sm font-medium">
            {t("locale")}
          </label>
          <select
            id="locale"
            name="locale"
            defaultValue={user.locale}
            className="w-full rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-2 text-sm outline-none focus:border-(--color-accent)"
          >
            <option value="nl">Nederlands</option>
            <option value="es">Español</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">{t("role")}</label>
          <p className="rounded-md border border-(--color-border) bg-(--color-bg-warm)/50 px-3 py-2 font-mono text-sm text-(--color-muted)">
            {t(`roles.${user.role}`)}
          </p>
        </div>

        <Button type="submit" variant="accent">
          {t("save")}
        </Button>
      </form>

      {isOwner && hasStripeCustomer ? (
        <form action={openBillingPortal} className="border-t border-(--color-border) pt-8">
          <Button type="submit" variant="outline">
            {tCare("manageBilling")}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
