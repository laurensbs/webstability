import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { routing } from "@/i18n/routing";
import { createTicket } from "@/app/actions/tickets";
import { Button } from "@/components/ui/Button";

export default async function NewTicket({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const t = await getTranslations("portal.tickets");

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <h1 className="text-3xl md:text-4xl">{t("new")}</h1>

      <form action={createTicket} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="subject" className="block text-sm font-medium">
            {t("subjectLabel")}
          </label>
          <input
            id="subject"
            name="subject"
            type="text"
            required
            className="w-full rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-2 text-sm outline-none focus:border-(--color-accent)"
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
            className="w-full rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-2 text-sm outline-none focus:border-(--color-accent)"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="priority" className="block text-sm font-medium">
            {t("priorityLabel")}
          </label>
          <select
            id="priority"
            name="priority"
            defaultValue="normal"
            className="w-full rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-2 text-sm outline-none focus:border-(--color-accent)"
          >
            <option value="low">{t("priority.low")}</option>
            <option value="normal">{t("priority.normal")}</option>
            <option value="high">{t("priority.high")}</option>
          </select>
        </div>

        <Button type="submit" variant="accent" size="lg">
          {t("submit")}
        </Button>
      </form>
    </div>
  );
}
