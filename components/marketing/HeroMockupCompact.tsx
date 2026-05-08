"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import { Calendar, Wallet, ShieldCheck, Check } from "lucide-react";

/**
 * Compacte hero-mockup voor mobile + tablet (< lg). Alleen admin-view,
 * geen toggle (te druk op smal scherm). Drie stats + één live-rij die
 * binnenrolt en flipt van "wacht" naar "betaald". Vorm-functie: een
 * leek ziet binnen één scroll dat hier een werkend product zit.
 */
export function HeroMockupCompact() {
  const reduce = useReducedMotion();
  const [paid, setPaid] = React.useState(() => reduce === true);
  const [bookingIn, setBookingIn] = React.useState(() => reduce === true);

  React.useEffect(() => {
    if (reduce) return;
    const t1 = window.setTimeout(() => setBookingIn(true), 500);
    const t2 = window.setTimeout(() => setPaid(true), 2200);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [reduce]);

  return (
    <div className="relative">
      {/* Floating glow */}
      {!reduce ? (
        <div
          aria-hidden
          className="wb-soft-halo pointer-events-none absolute -inset-4 -z-10 opacity-50 blur-[36px]"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 30% 30%, rgba(107,30,44,0.18) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 70% 70%, rgba(201,97,79,0.20) 0%, transparent 60%)",
          }}
        />
      ) : null}

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-[16px] border border-(--color-border) bg-(--color-surface) shadow-[0_16px_36px_-8px_rgba(31,27,22,0.14),0_4px_10px_-2px_rgba(31,27,22,0.06)]"
      >
        {/* Browser chrome — admin */}
        <div className="flex items-center gap-1.5 border-b border-(--color-border) bg-(--color-text) px-3 py-2">
          <span className="h-1.5 w-1.5 rounded-full bg-(--color-bg)/30" />
          <span className="h-1.5 w-1.5 rounded-full bg-(--color-bg)/30" />
          <span className="h-1.5 w-1.5 rounded-full bg-(--color-bg)/30" />
          <span className="ml-2 truncate font-mono text-[9px] text-(--color-bg)/60">
            admin · vandaag
          </span>
          <span className="ml-auto inline-flex items-center gap-1">
            <span className="relative flex h-1.5 w-1.5">
              {!reduce ? (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--color-success) opacity-60" />
              ) : null}
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-(--color-success)" />
            </span>
            <span className="font-mono text-[8px] tracking-widest text-(--color-bg)/60 uppercase">
              live
            </span>
          </span>
        </div>

        <div className="space-y-2.5 p-3">
          {/* Stats — 3 op één rij */}
          <div className="grid grid-cols-3 gap-1.5">
            <Stat icon={Wallet} label="Vandaag" value="€2.200" wine />
            <Stat icon={Calendar} label="Boekingen" value="13" />
            <Stat icon={ShieldCheck} label="Uptime" value="99.98%" success />
          </div>

          {/* Live booking row */}
          <motion.div
            initial={reduce ? false : { opacity: 0, x: 20 }}
            animate={bookingIn ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex items-center justify-between gap-2 rounded-[8px] border border-(--color-accent)/40 bg-(--color-accent-soft)/40 px-2.5 py-2"
          >
            <span
              aria-hidden
              className="absolute top-1/2 -left-px h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-(--color-wine)"
            />
            <div className="flex min-w-0 items-center gap-2">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-(--color-accent) text-white">
                <Calendar className="h-3 w-3" strokeWidth={2.2} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[11px] font-medium">Familie Janssen</p>
                <p className="truncate font-mono text-[9px] text-(--color-muted)">
                  Object · 14—21 jul · 7n
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <motion.span
                initial={false}
                animate={
                  paid
                    ? { backgroundColor: "rgba(90,122,74,0.15)", color: "var(--color-success)" }
                    : { backgroundColor: "rgba(31,27,22,0.06)", color: "var(--color-muted)" }
                }
                transition={{ duration: 0.4 }}
                className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-mono text-[8.5px] tracking-wide uppercase"
              >
                {paid ? (
                  <>
                    <Check className="h-2 w-2" strokeWidth={3} />
                    betaald
                  </>
                ) : (
                  <>
                    <span className="h-1 w-1 rounded-full bg-(--color-muted)" />
                    wacht
                  </>
                )}
              </motion.span>
              <span className="font-serif text-[12px] font-medium tabular-nums">€840</span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* Floating "+1 boeking"-pill */}
      <motion.div
        initial={reduce ? false : { opacity: 0, scale: 0.85, y: -4 }}
        animate={bookingIn ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.85, y: -4 }}
        transition={{ duration: 0.4, delay: 0.05, ease: [0.34, 1.56, 0.64, 1] }}
        className="absolute -top-2 right-3 z-10 inline-flex items-center gap-1.5 rounded-full border border-(--color-border) bg-(--color-surface) px-2 py-0.5 shadow-[0_4px_12px_-2px_rgba(31,27,22,0.12)]"
      >
        <span className="relative flex h-1.5 w-1.5">
          <span
            className="absolute inline-flex h-full w-full rounded-full bg-(--color-wine)"
            style={{ animation: reduce ? undefined : "wb-soft-pulse 2.4s ease-out infinite" }}
          />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-(--color-wine)" />
        </span>
        <span className="font-mono text-[9px] tracking-wide text-(--color-text)">
          +1 · net binnen
        </span>
      </motion.div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  wine = false,
  success = false,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
  wine?: boolean;
  success?: boolean;
}) {
  const valueColor = wine
    ? "text-(--color-wine)"
    : success
      ? "text-(--color-success)"
      : "text-(--color-text)";
  return (
    <div className="rounded-[6px] border border-(--color-border) bg-(--color-bg)/40 px-2 py-1.5">
      <div className="flex items-center gap-1 font-mono text-[8px] tracking-widest text-(--color-muted) uppercase">
        <Icon className="h-2.5 w-2.5" strokeWidth={2} />
        <span className="truncate">{label}</span>
      </div>
      <div className={`mt-0.5 font-serif text-[13px] leading-none tabular-nums ${valueColor}`}>
        {value}
      </div>
    </div>
  );
}
