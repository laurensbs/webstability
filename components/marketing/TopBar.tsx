import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

/**
 * Smalle dark-mode top-bar boven de hoofd-nav. Toont de live status
 * met pulserend groen dotje + de tagline 'Eén plek voor je hele
 * systeem' aan de rechterkant. Klikbaar — linkt naar /status.
 *
 * Server component zodat er geen JS heen hoeft; de pulse is pure CSS.
 */
export async function TopBar() {
  const t = await getTranslations("nav");
  const tFooter = await getTranslations("footer");

  return (
    <div className="border-b border-(--color-text)/15 bg-(--color-text) text-(--color-bg)">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-2">
        <Link
          href="/status"
          className="group inline-flex min-h-11 items-center gap-2 text-[11px] font-medium tracking-[0.08em] transition-colors"
          style={{ color: "rgba(245, 240, 232, 0.85)" }}
        >
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--color-success) opacity-60" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-(--color-success)" />
          </span>
          <span>{t("liveBadge")}</span>
          <span className="opacity-0 transition-opacity duration-200 group-hover:opacity-100">
            →
          </span>
        </Link>

        <p
          className="hidden text-[11px] font-medium tracking-[0.08em] md:block"
          style={{ color: "rgba(245, 240, 232, 0.65)" }}
        >
          {tFooter("tagline")}
        </p>
      </div>
    </div>
  );
}
