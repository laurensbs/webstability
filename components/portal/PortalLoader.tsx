"use client";

import { motion, AnimatePresence } from "motion/react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { LoginAmbientMount } from "@/components/r3f/LoginAmbientMount";

/**
 * Full-page loader voor de portal. Donker met conic-mesh ambient,
 * pulserende terracotta dot, mono eyebrow + serif cycling messages.
 * Zelfde sfeer als /login en StudioStatement zodat de overgang van
 * marketing → portal niet aanvoelt als een andere site.
 */
export function PortalLoader() {
  const t = useTranslations("portal.loading");
  const messages = (t.raw("messages") as string[]) ?? [];
  const [i, setI] = React.useState(() =>
    messages.length > 0 ? Math.floor(Math.random() * messages.length) : 0,
  );

  React.useEffect(() => {
    if (messages.length === 0) return;
    const id = setInterval(() => setI((prev) => (prev + 1) % messages.length), 1400);
    return () => clearInterval(id);
  }, [messages.length]);

  const current = messages[i] ?? "";

  return (
    <div className="rounded-panel relative isolate flex min-h-[70vh] flex-col items-center justify-center overflow-hidden bg-(--color-text) px-6 py-20 text-(--color-bg)">
      {/* Halo-blobs — terracotta linksboven, wijn rechtsonder */}
      <div
        aria-hidden
        className="wb-soft-halo pointer-events-none absolute -top-24 -left-24 h-[320px] w-[320px] rounded-full bg-(--color-accent) opacity-35 blur-3xl"
      />
      <div
        aria-hidden
        className="wb-soft-halo pointer-events-none absolute -right-24 -bottom-24 h-[320px] w-[320px] rounded-full bg-(--color-wine) opacity-40 blur-3xl"
      />
      {/* Conic-mesh ambient */}
      <LoginAmbientMount className="pointer-events-none absolute inset-0 -z-10 opacity-50" />

      {/* Eyebrow met pulserende terracotta dot */}
      <div className="relative flex items-center gap-3">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--color-accent) opacity-60" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-(--color-accent)" />
        </span>
        <p className="font-mono text-[11px] tracking-widest text-(--color-bg)/65 uppercase">
          {"// "}
          {t("title")}
        </p>
      </div>

      {/* Cycling message-line — serif, italic-vrij, cream/85 */}
      <div className="relative mt-8 flex h-10 items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={current}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="font-serif text-[clamp(20px,3vw,28px)] leading-none text-(--color-bg)/90"
          >
            {current}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Subtiele progress-bar onderaan — een dun lijntje dat heen en
          weer beweegt zodat het oog iets te volgen heeft, ipv naar een
          statische pagina te staren. */}
      <div className="relative mt-10 h-px w-48 overflow-hidden rounded-full bg-(--color-bg)/10">
        <motion.span
          className="block h-full w-1/3 bg-(--color-accent)"
          animate={{ x: ["-100%", "300%"] }}
          transition={{ duration: 1.6, ease: "easeInOut", repeat: Infinity }}
        />
      </div>
    </div>
  );
}
