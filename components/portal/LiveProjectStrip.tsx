import { ExternalLink, Globe, ShoppingBag, Boxes } from "lucide-react";
import type { ServiceKind } from "@/lib/service-kinds";

/**
 * Compacte "je site/shop/platform draait op X"-balk bovenaan het portal-
 * dashboard, voor een project dat live is maar buiten het livegang-
 * feestvenster valt (anders neemt LivegangCelebration het over). Geeft de
 * klant op elke dashboard-bezoek meteen z'n live-URL + een korte status-
 * regel, dienst-specifiek verwoord. Pure server-component, geen data-fetch.
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
  strings,
}: {
  url: string;
  serviceKind: ServiceKind;
  strings: { label: string; visitLabel: string };
}) {
  const Icon = KIND_ICON[serviceKind];
  // Toon de URL zonder protocol — netter, en past makkelijker op mobiel.
  const display = url.replace(/^https?:\/\//, "").replace(/\/$/, "");
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
        className="inline-flex items-center gap-1.5 font-mono text-[13px] text-(--color-success) underline decoration-(--color-success)/40 underline-offset-2 hover:decoration-(--color-success)"
      >
        {display}
        <ExternalLink className="h-3 w-3" strokeWidth={2.4} />
      </a>
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
