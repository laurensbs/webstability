"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";
import { usePopupDismissal } from "@/lib/use-popup-dismissal";

/**
 * Niet-blokkerende popup-card rechtsonder, getriggerd door scroll-depth
 * of exit-intent. Toont content (typisch een korte vraag + CTA) en
 * respecteert een localStorage-cooldown zodat hij niet bij elk bezoek
 * terugkomt.
 *
 * - trigger="scroll": opent als de bezoeker `threshold` (0..1) van de
 *   pagina-hoogte voorbij is gescrold. Default 0.4.
 * - trigger="exit": opent bij `mouseleave` van het document met de
 *   cursor boven de viewport (e.clientY <= 0). Alleen op apparaten met
 *   een echte hover-pointer (geen mobile).
 *
 * Sluiten of de CTA aanklikken markeert de popup als gezien.
 */
export function SmartPopup({
  id,
  trigger,
  threshold = 0.4,
  cooldownDays,
  eyebrow,
  title,
  body,
  children,
}: {
  id: string;
  trigger: "scroll" | "exit";
  threshold?: number;
  cooldownDays: number;
  eyebrow: string;
  title: string;
  body: string;
  /** De CTA — typisch een CalPopupTrigger of een Link. */
  children: React.ReactNode;
}) {
  const { suppressed, markSeen } = usePopupDismissal(id, cooldownDays);
  // open: zichtbaar (incl. exit-animatie). everOpened: ooit deze sessie
  // geopend → blijf renderen ook nadat markSeen() de suppressed-flag
  // flipt. Beide gezet in dezelfde event-handler, nooit in een effect.
  const [open, setOpen] = React.useState(false);
  const [everOpened, setEverOpened] = React.useState(false);
  // Eén keer per page-load; na dismiss niet opnieuw.
  const firedRef = React.useRef(false);

  const openPopup = React.useCallback(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    setOpen(true);
    setEverOpened(true);
    markSeen();
  }, [markSeen]);

  React.useEffect(() => {
    if (suppressed || firedRef.current) return;

    if (trigger === "scroll") {
      const onScroll = () => {
        const scrolled = window.scrollY + window.innerHeight;
        const docHeight = document.documentElement.scrollHeight;
        if (docHeight <= 0) return;
        if (scrolled / docHeight >= threshold) {
          window.removeEventListener("scroll", onScroll);
          openPopup();
        }
      };
      window.addEventListener("scroll", onScroll, { passive: true });
      return () => window.removeEventListener("scroll", onScroll);
    }

    // exit-intent — alleen op hover-capable apparaten
    if (typeof window.matchMedia === "function" && !window.matchMedia("(hover: hover)").matches) {
      return;
    }
    const onLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        document.removeEventListener("mouseleave", onLeave);
        openPopup();
      }
    };
    document.addEventListener("mouseleave", onLeave);
    return () => document.removeEventListener("mouseleave", onLeave);
  }, [suppressed, trigger, threshold, openPopup]);

  const close = React.useCallback(() => setOpen(false), []);

  // Render niets als hij onderdrukt is én nog nooit deze sessie opende.
  if (suppressed && !everOpened) return null;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.25 }}
          className="fixed right-4 bottom-4 z-50 w-[min(380px,calc(100vw-2rem))] rounded-[16px] border border-t-2 border-(--color-border) border-t-(--color-accent) bg-(--color-surface) p-5 shadow-[0_24px_60px_-12px_rgba(31,27,22,0.25)]"
        >
          <button
            type="button"
            onClick={close}
            aria-label="Sluiten"
            className="absolute top-3 right-3 inline-flex h-7 w-7 items-center justify-center rounded-full text-(--color-muted) transition-colors hover:bg-(--color-bg-warm) hover:text-(--color-text)"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2.2} />
          </button>
          <p className="font-mono text-[10px] tracking-widest text-(--color-accent) uppercase">
            {`// ${eyebrow}`}
          </p>
          <h2 className="mt-2 font-serif text-[19px] leading-tight text-(--color-text)">{title}</h2>
          <p className="mt-2 text-[13px] leading-[1.55] text-(--color-muted)">{body}</p>
          <div className="mt-4">{children}</div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
