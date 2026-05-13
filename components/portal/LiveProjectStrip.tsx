import { ExternalLink, Globe, ShoppingBag, Boxes } from "lucide-react";
import type { ServiceKind } from "@/lib/service-kinds";

/**
 * Compacte "je site/shop/platform draait op X"-balk bovenaan het portal-
 * dashboard, voor een project dat live is maar buiten het livegang-
 * feestvenster valt (anders neemt LivegangCelebration het over). Geeft de
 * klant op elke dashboard-bezoek meteen z'n live-URL + een korte status-
 * regel + (waar beschikbaar) een 30-dagen-uptime-percentage. Dat is het
 * tastbare bewijs dat z'n abonnement écht werkt — niet "vertrouw me" maar
 * een getal. Pure server-component, geen data-fetch.
 */
const KIND_ICON: Record<ServiceKind, typeof Globe> = {
  website: Globe,
  webshop: ShoppingBag,
  platform: Boxes,
  other: Globe,
};

export function LiveProjectStrip({
  url,
  serviceKind,
  uptime,
  strings,
}: {
  url: string;
  serviceKind: ServiceKind;
  /** 30d-uptime-percentage uit getProjectUptimeSummary; null = nog geen
   * monitoring-data, dan tonen we de pill niet (eerlijker dan een 100%
   * placeholder die zou liegen). */
  uptime?: { pct: number; days: number } | null;
  strings: { label: string; visitLabel: string; uptimeLabel: string };
}) {
  const Icon = KIND_ICON[serviceKind];
  const display = url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  // 99.9%+ = groen, 99–99.9% = ok-groen, <99% = wijn (zelfde palet als status).
  const uptimeColor =
    uptime == null
      ? ""
      : uptime.pct >= 99.5
        ? "text-(--color-success) border-(--color-success)/30 bg-(--color-success)/10"
        : uptime.pct >= 99
          ? "text-(--color-text) border-(--color-border) bg-(--color-bg-warm)"
          : "text-(--color-wine) border-(--color-wine)/30 bg-(--color-wine)/10";
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-(--color-success)/30 bg-(--color-success)/5 px-4 py-3">
      <span className="inline-flex items-center gap-2 text-sm text-(--color-text)">
        <Icon className="h-4 w-4 shrink-0 text-(--color-success)" strokeWidth={2.2} />
        {strings.label}
      </span>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-sm font-mono text-[13px] text-(--color-success) underline decoration-(--color-success)/40 underline-offset-2 transition-colors hover:decoration-(--color-success) active:bg-(--color-success)/10"
      >
        {display}
        <ExternalLink className="h-3 w-3" strokeWidth={2.4} />
      </a>
      {uptime != null ? (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] tabular-nums ${uptimeColor}`}
        >
          <span className="opacity-70">
            {strings.uptimeLabel.replace("{days}", String(uptime.days))}
          </span>
          <span className="font-medium">{uptime.pct.toFixed(2)}%</span>
        </span>
      ) : null}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="ml-auto hidden font-mono text-[11px] tracking-widest text-(--color-muted) uppercase hover:text-(--color-text) sm:inline"
      >
        {strings.visitLabel} →
      </a>
    </div>
  );
}
