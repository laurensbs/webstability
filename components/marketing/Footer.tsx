import { getTranslations } from "next-intl/server";

export async function Footer() {
  const t = await getTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-(--color-border) bg-(--color-bg-warm)">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 py-10 md:flex-row md:items-center">
        <div className="space-y-1">
          <p className="text-lg font-extrabold tracking-tight">
            webstability<span className="text-(--color-accent)">.</span>
          </p>
          <p className="text-sm text-(--color-muted)">{t("tagline")}</p>
        </div>
        <p className="font-mono text-xs tracking-widest text-(--color-muted) uppercase">
          © {year} · {t("rights")}
        </p>
      </div>
    </footer>
  );
}
