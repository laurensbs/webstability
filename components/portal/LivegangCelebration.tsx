"use client";

import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { CheckCircle2, X, ExternalLink } from "lucide-react";

type Strings = {
  eyebrow: string; // "Live sinds {date}"
  headingPrefix: string; // "{name}"
  headingSuffix: string; // "is live."
  body: string;
  visitLabel: string;
  dismissLabel: string;
};

/**
 * Banner bovenaan portal-dashboard wanneer een van de klant's projecten
 * binnen de laatste 7 dagen live is gegaan. CSS-only sparkle rond de
 * wijn-rode CheckCircle — 8 div'jes in cirkel, scale+rotate met
 * staggered delays. Honoreert prefers-reduced-motion (geen sparkle,
 * wel banner). Dismissable per project via localStorage.
 */
export function LivegangCelebration({
  projectId,
  projectName,
  projectUrl,
  liveAtLabel,
  strings,
}: {
  projectId: string;
  projectName: string;
  projectUrl: string | null;
  /** Pre-geformatteerde datum-string ipv Intl.DateTimeFormat: classes
   * zijn niet serializable van server- naar client-component (Next 16). */
  liveAtLabel: string;
  strings: Strings;
}) {
  const reduce = useReducedMotion();
  const STORAGE_KEY = `wb:livegang-seen-${projectId}`;
  const [dismissed, setDismissed] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  function dismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // noop
    }
    setDismissed(true);
  }

  if (dismissed) return null;

  // 8 sparkles op kring rond CheckCircle
  const sparkles = Array.from({ length: 8 }).map((_, i) => {
    const angle = (i / 8) * 2 * Math.PI;
    const radius = 28; // px
    const dx = Math.cos(angle) * radius;
    const dy = Math.sin(angle) * radius;
    return { id: i, dx, dy, delay: i * 0.08 };
  });

  return (
    <AnimatePresence>
      <motion.div
        initial={reduce ? false : { opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-2xl border border-t-2 border-(--color-border) border-t-(--color-wine) bg-gradient-to-br from-(--color-surface) to-(--color-bg-warm) p-6 md:p-7"
      >
        <button
          type="button"
          onClick={dismiss}
          className="absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-(--color-muted) transition-colors hover:bg-(--color-bg-warm) hover:text-(--color-text)"
          aria-label={strings.dismissLabel}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-5">
          {/* Sparkle-cluster around CheckCircle */}
          <div className="relative h-14 w-14 shrink-0">
            <CheckCircle2
              className="absolute inset-0 m-auto h-12 w-12 text-(--color-wine)"
              strokeWidth={1.75}
              fill="rgba(107, 30, 44, 0.08)"
            />
            {!reduce
              ? sparkles.map((s) => (
                  <motion.span
                    key={s.id}
                    aria-hidden
                    className="absolute top-1/2 left-1/2 h-1.5 w-1.5 rounded-full bg-(--color-wine)"
                    initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                    animate={{
                      x: s.dx,
                      y: s.dy,
                      scale: [0, 1.2, 0],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 1.4,
                      delay: 0.3 + s.delay,
                      ease: "easeOut",
                    }}
                  />
                ))
              : null}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium tracking-[0.08em] text-(--color-wine)">
              {strings.eyebrow.replace("{date}", liveAtLabel)}
            </p>
            <h2 className="mt-2 font-serif text-2xl leading-tight md:text-3xl">
              {strings.headingPrefix.replace("{name}", projectName)}{" "}
              <em className="font-light text-(--color-wine)">{strings.headingSuffix}</em>
            </h2>
            <p className="mt-3 max-w-prose text-[14px] leading-[1.6] text-(--color-muted)">
              {strings.body}
            </p>

            {projectUrl ? (
              <a
                href={projectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-(--color-text) px-4 py-2 text-[13px] font-medium text-(--color-bg) transition-opacity hover:opacity-90"
              >
                {strings.visitLabel}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
