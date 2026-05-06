"use client";

import * as React from "react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { Link } from "@/i18n/navigation";

const RESEND_SECONDS = 30;

/**
 * Right-pane content of the verify page. Reads the email the user
 * entered from sessionStorage (set by LoginForm) so we can show a
 * "we sent a link to <email>" line without a round-trip. Falls back
 * gracefully when storage is empty.
 *
 * Adds:
 * - Letter-voor-letter staggered fade van het email-adres
 * - Resend-countdown timer (30s → klikbaar)
 * - BroadcastChannel-detectie: als de magic-link in een andere tab
 *   wordt geklikt, refresht deze tab automatisch
 */
export function VerifyPanel({
  eyebrow,
  title,
  subtitle,
  hint,
  resend,
  resendIn,
  resendNow,
  tabSwitched,
}: {
  eyebrow: string;
  title: string;
  subtitle: string; // contains "{email}" placeholder
  hint: string;
  resend: string;
  resendIn: string; // contains "{seconds}"
  resendNow: string;
  tabSwitched: string;
}) {
  const reduce = useReducedMotion();
  const router = useRouter();
  const [email] = React.useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return sessionStorage.getItem("wb:pending-email");
    } catch {
      return null;
    }
  });

  const [secondsLeft, setSecondsLeft] = React.useState(RESEND_SECONDS);
  const [tabSwitchedDetected, setTabSwitchedDetected] = React.useState(false);

  // Resend countdown — telt af tot 0, dan kan de user opnieuw versturen.
  React.useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [secondsLeft]);

  // BroadcastChannel — als de user in een andere tab op de magic-link
  // klikt, krijgt die tab een sessie-cookie. We pollen daar niet voor:
  // bij elke focus-event van deze tab refreshen we router-state, zodat
  // server middleware de inmiddels ingelogde user kan herkennen en door
  // kan sturen naar /portal.
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("webstability-auth");
      bc.onmessage = (ev) => {
        if (ev.data?.type === "verified") {
          setTabSwitchedDetected(true);
          router.refresh();
          window.setTimeout(() => router.push("/portal/dashboard"), 600);
        }
      };
    } catch {
      // BroadcastChannel niet ondersteund — fallback via visibilitychange.
    }

    const onVisible = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      bc?.close();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [router]);

  const parts = subtitle.split("{email}");
  const canResend = secondsLeft <= 0;

  function handleResend() {
    if (!canResend || !email) return;
    setSecondsLeft(RESEND_SECONDS);
    // Stuur user terug naar /login met email vooringevuld; LoginForm
    // submit zelf opnieuw zodat we het auth-pad niet duplicaten.
    window.location.href = `/login?email=${encodeURIComponent(email)}`;
  }

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
          <span className="font-mono text-base break-all text-(--color-text)">
            {reduce
              ? email
              : email.split("").map((ch, i) => (
                  <motion.span
                    key={`${ch}-${i}`}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: 0.4 + i * 0.04 }}
                  >
                    {ch}
                  </motion.span>
                ))}
          </span>
        ) : (
          <span className="text-(--color-text)">{"je e-mailadres"}</span>
        )}
        {parts[1] ?? ""}
      </p>

      <p className="text-sm text-(--color-muted)">{hint}</p>

      <AnimatePresence>
        {tabSwitchedDetected ? (
          <motion.p
            key="tab-switched"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-lg border border-(--color-success)/40 bg-(--color-success)/10 px-4 py-3 text-sm text-(--color-text)"
          >
            {tabSwitched}
          </motion.p>
        ) : null}
      </AnimatePresence>

      <div className="flex items-center gap-4">
        {canResend ? (
          <button
            type="button"
            onClick={handleResend}
            className="inline-flex items-center gap-1.5 font-mono text-xs tracking-wide text-(--color-accent) transition-colors hover:underline"
          >
            ↻ {resendNow}
          </button>
        ) : (
          <span className="font-mono text-xs tracking-wide text-(--color-muted)">
            {resendIn.replace("{seconds}", String(secondsLeft))}
          </span>
        )}
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 font-mono text-xs tracking-wide text-(--color-muted) transition-colors hover:text-(--color-accent)"
        >
          ← {resend}
        </Link>
      </div>
    </div>
  );
}
