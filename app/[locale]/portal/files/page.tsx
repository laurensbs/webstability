import { setRequestLocale, getTranslations } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound, redirect } from "next/navigation";
import {
  Download,
  FileText,
  Image as ImageIcon,
  FileArchive,
  FileSpreadsheet,
  File as FileIcon,
  type LucideIcon,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { routing } from "@/i18n/routing";
import { getUserWithOrg, listOrgFiles, isBlobConfigured } from "@/lib/db/queries/portal";
import { uploadFile } from "@/app/actions/files";
import { Button } from "@/components/ui/Button";
import { UploadZone } from "@/components/portal/UploadZone";

function iconForName(name: string): LucideIcon {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg", "avif"].includes(ext)) return ImageIcon;
  if (["zip", "tar", "gz", "rar", "7z"].includes(ext)) return FileArchive;
  if (["csv", "xlsx", "xls", "ods"].includes(ext)) return FileSpreadsheet;
  if (["pdf", "txt", "md", "doc", "docx"].includes(ext)) return FileText;
  return FileIcon;
}

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
      <header>
        <h1 className="text-3xl md:text-4xl">{t("title")}</h1>
      </header>

      {blobReady ? (
        <form action={uploadFile} encType="multipart/form-data" className="space-y-4">
          <UploadZone inputId="file" inputName="file" label={t("upload")} hint={t("uploadHint")} />

          <div className="flex flex-col gap-4 rounded-lg border border-(--color-border) bg-(--color-surface) p-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex-1 space-y-2">
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
          </div>
        </form>
      ) : (
        <div className="rounded-lg border border-dashed border-(--color-border) bg-(--color-bg-warm)/50 p-6">
          <p className="font-mono text-xs text-(--color-muted)">{t("notConfigured")}</p>
        </div>
      )}

      {list.length === 0 ? (
        <div className="rounded-lg border border-dashed border-(--color-border) bg-(--color-surface)/50 px-6 py-12 text-center">
          <p className="text-(--color-muted)">{t("empty")}</p>
        </div>
      ) : (
        <ul className="divide-y divide-(--color-border) overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface)">
          {list.map((f) => {
            const Icon = iconForName(f.name);
            return (
              <li
                key={f.id}
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-(--color-bg-warm)/40"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md border border-(--color-border) bg-(--color-bg-warm) text-(--color-muted)">
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{f.name}</p>
                  <p className="mt-0.5 truncate font-mono text-[11px] text-(--color-muted)">
                    {t(`category.${f.category}`)} ·{" "}
                    {t("uploadedAt", { when: dateFmt.format(f.createdAt) })}
                  </p>
                </div>
                <a
                  href={f.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-(--color-border) px-3 py-1.5 font-mono text-[10px] tracking-widest text-(--color-muted) uppercase transition-colors hover:border-(--color-accent) hover:text-(--color-accent)"
                >
                  <Download className="h-3 w-3" />
                  {t("download")}
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
