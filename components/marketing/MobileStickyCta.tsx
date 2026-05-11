"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { useLocale } from "next-intl";
import { Calendar, MessageCircle } from "lucide-react";
import { CalPopupTrigger } from "@/components/marketing/CalPopupTrigger";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim().replace(/\D/g, "") ?? "";

/**
 * Floating bottom action bar on mobile only. Appears once the user has
 * scrolled past the hero (~600px) and stays visible until they reach the
 * page's own CTA section. Two actions: schedule a call (the brand's
 * primary CTA) and WhatsApp — critical for the Spanish market where it's
 * the default low-friction inbox.
 *
 * Hidden entirely on desktop and when prefers-reduced-motion is on
 * (translates and the constant fixed positioning can be jarring).
 */
export function MobileStickyCta({
  planLabel,
  whatsappLabel,
}: {
  planLabel: string;
  whatsappLabel: string;
}) {
  const reduce = useReducedMotion();
  const locale = useLocale();
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    if (reduce) return;
    const onScroll = () => setVisible(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [reduce]);

  if (reduce) return null;

  const waHref = WHATSAPP_NUMBER ? `https://wa.me/${WHATSAPP_NUMBER}` : null;

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={visible ? { y: 0, opacity: 1 } : { y: 100, opacity: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="fixed right-0 bottom-0 left-0 z-30 flex gap-2.5 border-t border-(--color-border) bg-(--color-bg)/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-md md:hidden"
      style={{ pointerEvents: visible ? "auto" : "none" }}
    >
      <CalPopupTrigger
        locale={locale}
        className="flex flex-1 items-center justify-center gap-2 rounded-full bg-(--color-text) px-4 py-3 text-[14px] font-medium text-(--color-bg)"
      >
        <Calendar className="h-3.5 w-3.5" />
        {planLabel}
      </CalPopupTrigger>
      {waHref ? (
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={whatsappLabel}
          className="flex items-center justify-center gap-2 rounded-full bg-(--color-success) px-5 py-3 text-[14px] font-medium text-white"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only">{whatsappLabel}</span>
        </a>
      ) : null}
    </motion.div>
  );
}
