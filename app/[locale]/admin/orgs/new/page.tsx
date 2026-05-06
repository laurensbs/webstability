import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import NextLink from "next/link";
import { routing } from "@/i18n/routing";
import { createOrg } from "@/app/actions/admin";
import { ToastForm } from "@/components/portal/ToastForm";
import { ToastSubmitButton } from "@/components/portal/ToastSubmitButton";

export default async function NewOrgPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("admin.newOrg");
  const tPricing = await getTranslations("pricing.build.tierNames");

  const backHref = locale === "nl" ? "/admin/orgs" : `/${locale}/admin/orgs`;

  return (
    <div className="space-y-10">
      <NextLink
        href={backHref}
        className="font-mono text-xs tracking-widest text-(--color-bg)/55 uppercase hover:text-(--color-accent)"
      >
        ← {t("back")}
      </NextLink>

      <header className="space-y-2">
        <h1 className="text-3xl md:text-5xl">{t("title")}</h1>
        <p className="text-(--color-muted)">{t("subtitle")}</p>
      </header>

      <ToastForm
        action={createOrg}
        className="max-w-2xl space-y-5 rounded-lg border border-(--color-border) bg-(--color-surface) p-8"
      >
        <Field label={t("name")} required>
          <input
            type="text"
            name="name"
            placeholder={t("namePlaceholder")}
            required
            className="w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm outline-none focus:border-(--color-accent)"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("country")} required>
            <select
              name="country"
              required
              defaultValue="NL"
              className="w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm outline-none focus:border-(--color-accent)"
            >
              <option value="NL">Nederland</option>
              <option value="ES">España</option>
            </select>
          </Field>
          <Field label={t("plan")}>
            <select
              name="plan"
              defaultValue=""
              className="w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm outline-none focus:border-(--color-accent)"
            >
              <option value="">{t("planNone")}</option>
              <option value="care">{tPricing("care")} · €69/m</option>
              <option value="studio">{tPricing("studio")} · €179/m</option>
              <option value="atelier">{tPricing("atelier")} · €399/m</option>
            </select>
          </Field>
        </div>

        <Field label={t("vat")}>
          <input
            type="text"
            name="vatNumber"
            placeholder={t("vatPlaceholder")}
            className="w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm outline-none focus:border-(--color-accent)"
          />
        </Field>

        <div className="flex justify-end pt-2">
          <ToastSubmitButton variant="accent" size="md">
            {t("submit")}
          </ToastSubmitButton>
        </div>
      </ToastForm>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-xs font-medium">
        {label}
        {required ? <span className="ml-1 text-(--color-accent)">*</span> : null}
      </span>
      {children}
    </label>
  );
}
