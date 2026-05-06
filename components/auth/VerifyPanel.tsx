"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { Mail } from "lucide-react";
import { Link } from "@/i18n/navigation";

/**
 * Right-pane content of the verify page. Reads the email the user
 * entered from sessionStorage (set by LoginForm) so we can show a
 * "we sent a link to <email>" line without a round-trip. Falls back
 * gracefully when storage is empty.
 */
export function VerifyPanel({
  eyebrow,
  title,
  subtitle,
  hint,
  resend,
}: {
  eyebrow: string;
  title: string;
  subtitle: string; // contains "{email}" placeholder
  hint: string;
  resend: string;
}) {
  const reduce = useReducedMotion();
  // Lazy init — runs once on mount. Returns null during SSR, then the
  // client paints with the stashed email already in state on first
  // render. No setState-in-effect needed.
  const [email] = React.useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return sessionStorage.getItem("wb:pending-email");
    } catch {
      return null;
    }
  });

  // "We sent a link to {email}" → split so we can wrap email in mono.
  const parts = subtitle.split("{email}");

  return (
    <div className="space-y-7">
      {/* Animated email illustration */}
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-(--color-border) bg-(--color-accent-soft) text-(--color-accent)"
      >
        <motion.span
          animate={
            reduce
              ? undefined
              : {
                  y: [0, -2, 0],
                }
          }
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Mail className="h-6 w-6" strokeWidth={1.75} />
        </motion.span>
      </motion.div>

      <p className="font-mono text-xs tracking-widest text-(--color-accent) uppercase">
        {"// "}
        {eyebrow}
      </p>

      <h1 className="text-4xl md:text-5xl">{title}</h1>

      <p className="text-lg text-(--color-muted)">
        {parts[0]}
        {email ? (
          <span className="font-mono text-base break-all text-(--color-text)">{email}</span>
        ) : (
          <span className="text-(--color-text)">{"je e-mailadres"}</span>
        )}
        {parts[1] ?? ""}
      </p>

      <p className="text-sm text-(--color-muted)">{hint}</p>

      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 font-mono text-xs tracking-wide text-(--color-accent) transition-colors hover:underline"
      >
        ← {resend}
      </Link>
    </div>
  );
}
