"use client";

import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import dynamic from "next/dynamic";
import { X } from "lucide-react";
import { Spinner } from "@/components/animate/Spinner";

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
        <Spinner size={14} variant="accent" />
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
        <Dialog.Overlay className="data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out fixed inset-0 z-50 bg-(--color-wine)/40 backdrop-blur-sm" />

        <Dialog.Content
          aria-describedby={undefined}
          className="data-[state=open]:animate-in data-[state=open]:fade-in data-[state=closed]:animate-out data-[state=closed]:fade-out shadow-modal rounded-panel fixed top-1/2 left-1/2 z-50 flex h-[min(720px,90vh)] w-[min(960px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden border border-t-2 border-(--color-text)/20 border-t-(--color-wine) bg-(--color-text) text-(--color-bg)"
        >
          {/* Halo-blobs voor depth — zelfde sfeer als login-panel + footer */}
          <div
            aria-hidden
            className="wb-soft-halo pointer-events-none absolute -top-32 -left-32 h-[320px] w-[320px] rounded-full bg-(--color-accent) opacity-30 blur-3xl"
          />
          <div
            aria-hidden
            className="wb-soft-halo pointer-events-none absolute -right-32 -bottom-32 h-[320px] w-[320px] rounded-full bg-(--color-wine) opacity-40 blur-3xl"
          />

          <Dialog.Title className="sr-only">Plan een gesprek</Dialog.Title>

          <header className="relative flex items-center justify-between border-b border-(--color-bg)/10 bg-(--color-text) px-5 py-3">
            <p className="font-mono text-[11px] tracking-widest text-(--color-bg)/60 uppercase">
              {"// "}
              {locale === "es" ? "Reservar cita" : "Boek afspraak"}
            </p>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Sluit"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full text-(--color-bg)/60 transition-colors hover:bg-(--color-bg)/10 hover:text-(--color-bg) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)"
              >
                <X className="h-4 w-4" strokeWidth={2} />
              </button>
            </Dialog.Close>
          </header>

          {/* Cream-card binnen het donkere modal — Cal embed wil licht
              achter de agenda-tegels, anders zijn dagen onleesbaar */}
          <div className="relative flex-1 overflow-hidden bg-(--color-surface) p-2 md:p-3">
            <div className="rounded-card h-full w-full overflow-hidden">
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
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
