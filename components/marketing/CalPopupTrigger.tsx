"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import dynamic from "next/dynamic";
import { X } from "lucide-react";

/**
 * Klikt op de trigger? → Radix Dialog opent met de Cal-embed direct
 * erin. Geen redirect naar /contact meer; bezoeker blijft op de pagina,
 * kan via Esc of de X sluiten en gaat verder waar hij was.
 *
 * De Cal-bundle wordt pas geladen wanneer het dialog daadwerkelijk
 * opent (lazy via dynamic import) zodat de header geen 80kb extra
 * runtime kost als bezoeker de knop nooit aanraakt.
 */
const Cal = dynamic(() => import("@calcom/embed-react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <span className="inline-flex items-center gap-2 font-mono text-xs tracking-widest text-(--color-muted) uppercase">
        <span
          className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-(--color-accent) border-t-transparent"
          aria-hidden
        />
        agenda laden…
      </span>
    </div>
  ),
});

const CAL_LINK = process.env.NEXT_PUBLIC_CAL_LINK?.trim();
const CAL_ORIGIN = process.env.NEXT_PUBLIC_CAL_ORIGIN?.trim();
const CAL_EMBED_JS = CAL_ORIGIN ? `${CAL_ORIGIN}/embed/embed.js` : undefined;

export function CalPopupTrigger({
  children,
  locale,
  className,
}: {
  children: React.ReactNode;
  locale?: string;
  /** Aangeleverde wrapper-classNames voor de trigger button — zo
   * kunnen we de bestaande nav-CTA-styling 1-op-1 hergebruiken. */
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);

  // Geen Cal-link in env? Trigger wordt een mailto-fallback. Voorkomt
  // dat klikkers een leeg dialog krijgen.
  if (!CAL_LINK) {
    return (
      <a href="mailto:hello@webstability.eu" className={className}>
        {children}
      </a>
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button type="button" className={className}>
          {children}
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out fixed inset-0 z-50 bg-(--color-text)/50 backdrop-blur-sm" />

        <Dialog.Content
          aria-describedby={undefined}
          className="data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out fixed top-1/2 left-1/2 z-50 flex h-[min(720px,90vh)] w-[min(960px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-[20px] border border-(--color-border) bg-(--color-surface) shadow-[0_24px_60px_-12px_rgba(31,27,22,0.3)]"
        >
          <Dialog.Title className="sr-only">Plan een gesprek</Dialog.Title>

          <header className="flex items-center justify-between border-b border-(--color-border) bg-(--color-bg-warm) px-5 py-3">
            <p className="font-mono text-[11px] tracking-widest text-(--color-muted) uppercase">
              {locale === "es" ? "Reservar cita" : "Boek afspraak"}
            </p>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Sluit"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-(--color-muted) transition-colors hover:bg-(--color-surface) hover:text-(--color-text)"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </Dialog.Close>
          </header>

          <div className="flex-1 overflow-hidden">
            {/* Cal vult de hele beschikbare ruimte; minHeight nodig
                want anders krijgt iframe 0px in een flex-kind. */}
            <Cal
              calLink={CAL_LINK}
              calOrigin={CAL_ORIGIN}
              embedJsUrl={CAL_EMBED_JS}
              style={{ width: "100%", height: "100%", minHeight: 540 }}
              config={{
                layout: "month_view",
                theme: "light",
                ...(locale ? { locale } : {}),
              }}
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
