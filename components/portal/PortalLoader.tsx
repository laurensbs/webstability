"use client";

import { motion, AnimatePresence } from "motion/react";
import { useTranslations } from "next-intl";
import * as React from "react";

export function PortalLoader() {
  const t = useTranslations("portal.loading");
  const messages = (t.raw("messages") as string[]) ?? [];
  // Random starting line on mount; lazy initializer keeps setState out of the effect.
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
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-8 px-6">
      <div className="flex items-center gap-3">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--color-accent) opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-(--color-accent)" />
        </span>
        <p className="font-mono text-xs tracking-widest text-(--color-muted) uppercase">
          {t("title")}
        </p>
      </div>

      <div className="flex h-7 items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={current}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="text-lg text-(--color-muted)"
          >
            {current}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
