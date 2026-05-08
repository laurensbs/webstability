import { getTranslations } from "next-intl/server";

/**
 * Kleine "laatst bijgewerkt"-pill onderaan legal-pagina's. Gebruikt
 * `legal.lastUpdatedLabel` + `legal.lastUpdatedDate` strings — bij
 * iedere wijziging aan privacy/aviso/garanties moet de date in
 * messages bijgewerkt worden.
 */
export async function LastUpdated() {
  const t = await getTranslations("legal");
  return (
    <p className="mt-12 inline-flex items-center gap-2 rounded-full border border-(--color-border) bg-(--color-surface) px-3 py-1.5 font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
      <span className="h-1.5 w-1.5 rounded-full bg-(--color-wine)/60" aria-hidden />
      {t("lastUpdatedLabel")}: <span className="text-(--color-text)">{t("lastUpdatedDate")}</span>
    </p>
  );
}
