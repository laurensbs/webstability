import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function Footer() {
  const t = await getTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-(--color-border) bg-(--color-bg-warm)">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <p className="text-lg font-extrabold tracking-tight">
            webstability<span className="text-(--color-accent)">.</span>
          </p>
          <p className="text-sm text-(--color-muted)">{t("tagline")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <Link
            href="/status"
            className="text-(--color-muted) transition-colors hover:text-(--color-text)"
          >
            {t("status")}
          </Link>
          <Link
            href="/garanties"
            className="text-(--color-muted) transition-colors hover:text-(--color-text)"
          >
            {t("guarantees")}
          </Link>
          <Link
            href="/privacy"
            className="text-(--color-muted) transition-colors hover:text-(--color-text)"
          >
            {t("privacy")}
          </Link>
          <Link
            href="/aviso-legal"
            className="text-(--color-muted) transition-colors hover:text-(--color-text)"
          >
            {t("legal")}
          </Link>
        </div>

        <p className="font-mono text-xs tracking-widest text-(--color-muted) uppercase">
          © {year} · {t("rights")}
        </p>
      </div>
    </footer>
  );
}
