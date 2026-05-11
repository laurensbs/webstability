import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound, redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { auth } from "@/lib/auth";
import { routing } from "@/i18n/routing";
import { createTicket } from "@/app/actions/tickets";
import { Button } from "@/components/ui/Button";
import { TicketCategoryPicker } from "@/components/portal/TicketCategoryPicker";

export default async function NewTicket({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ warn?: string; open?: string; limit?: string }>;
}) {
  const { locale } = await params;
  const sp = await searchParams;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const t = await getTranslations("portal.tickets");
  const tCat = await getTranslations("portal.tickets.category");
  const overBudget = sp.warn === "over-budget";

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <h1 className="text-3xl md:text-4xl">{t("new")}</h1>

      {overBudget ? (
        <aside className="flex items-start gap-3 rounded-xl border border-(--color-accent)/40 bg-(--color-accent-soft) p-4 text-[14px] text-(--color-text)">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-(--color-accent)" />
          <div className="space-y-1">
            <p className="font-medium">
              {t("budgetWarningTitle", { open: sp.open ?? "0", limit: sp.limit ?? "0" })}
            </p>
            <p className="text-[13px] text-(--color-muted)">{t("budgetWarningBody")}</p>
          </div>
        </aside>
      ) : null}

      <form action={createTicket} className="space-y-6">
        <TicketCategoryPicker
          defaultCategory="change"
          strings={{
            bugLabel: tCat("bugLabel"),
            bugBody: tCat("bugBody"),
            featureLabel: tCat("featureLabel"),
            featureBody: tCat("featureBody"),
            questionLabel: tCat("questionLabel"),
            questionBody: tCat("questionBody"),
            changeLabel: tCat("changeLabel"),
            changeBody: tCat("changeBody"),
            upgradeLabel: tCat("upgradeLabel"),
            upgradeBody: tCat("upgradeBody"),
          }}
        />

        <div className="space-y-2">
          <label htmlFor="subject" className="block text-sm font-medium">
            {t("subjectLabel")}
          </label>
          <input
            id="subject"
            name="subject"
            type="text"
            required
            className="block min-h-11 w-full rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-2 text-[15px] outline-none focus:border-(--color-accent)"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="body" className="block text-sm font-medium">
            {t("bodyLabel")}
          </label>
          <textarea
            id="body"
            name="body"
            rows={6}
            required
            className="block w-full rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-2 text-[15px] outline-none focus:border-(--color-accent)"
          />
        </div>

        {/* Force-flag — alleen meestuurd als de waarschuwing actief is */}
        {overBudget ? <input type="hidden" name="force" value="1" /> : null}

        <Button type="submit" variant="accent" size="lg">
          {overBudget ? t("submitForce") : t("submit")}
        </Button>
      </form>
    </div>
  );
}
