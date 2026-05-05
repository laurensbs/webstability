import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { routing } from "@/i18n/routing";
import { getUserWithOrg, listOrgFiles, isBlobConfigured } from "@/lib/db/queries/portal";
import { uploadFile } from "@/app/actions/files";
import { Button } from "@/components/ui/Button";

export default async function FilesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await getUserWithOrg(session.user.id);
  if (!user?.organizationId) redirect("/login");

  const t = await getTranslations("portal.files");
  const list = await listOrgFiles(user.organizationId);
  const dateFmt = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  const blobReady = isBlobConfigured();

  return (
    <div className="space-y-8">
      <h1 className="text-3xl md:text-4xl">{t("title")}</h1>

      {blobReady ? (
        <form
          action={uploadFile}
          encType="multipart/form-data"
          className="space-y-4 rounded-lg border border-(--color-border) bg-(--color-surface) p-6"
        >
          <div className="space-y-2">
            <label htmlFor="file" className="block text-sm font-medium">
              {t("upload")}
            </label>
            <input
              id="file"
              name="file"
              type="file"
              required
              className="block w-full text-sm file:mr-4 file:rounded-md file:border-0 file:bg-(--color-text) file:px-4 file:py-2 file:text-sm file:font-medium file:text-(--color-bg) hover:file:opacity-90"
            />
            <p className="text-xs text-(--color-muted)">{t("uploadHint")}</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="category" className="block text-sm font-medium">
              {t("categoryLabel")}
            </label>
            <select
              id="category"
              name="category"
              defaultValue="deliverable"
              className="w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-sm outline-none focus:border-(--color-accent)"
            >
              <option value="deliverable">{t("category.deliverable")}</option>
              <option value="contract">{t("category.contract")}</option>
              <option value="asset">{t("category.asset")}</option>
              <option value="report">{t("category.report")}</option>
            </select>
          </div>

          <Button type="submit" variant="accent">
            {t("upload")}
          </Button>
        </form>
      ) : (
        <div className="rounded-lg border border-dashed border-(--color-border) bg-(--color-bg-warm)/50 p-6">
          <p className="font-mono text-xs text-(--color-muted)">{t("notConfigured")}</p>
        </div>
      )}

      {list.length === 0 ? (
        <p className="text-(--color-muted)">{t("empty")}</p>
      ) : (
        <ul className="divide-y divide-(--color-border) overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface)">
          {list.map((f) => (
            <li key={f.id} className="flex items-center justify-between gap-4 px-6 py-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{f.name}</p>
                <p className="mt-1 font-mono text-xs text-(--color-muted)">
                  {t(`category.${f.category}`)} ·{" "}
                  {t("uploadedAt", { when: dateFmt.format(f.createdAt) })}
                </p>
              </div>
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md border border-(--color-border) px-3 py-1.5 text-xs transition-colors hover:bg-(--color-bg-warm)"
              >
                {t("download")}
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
