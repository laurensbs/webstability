"use client";

import * as React from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Calendar,
  Wallet,
  ShieldCheck,
  Check,
  Inbox,
  TrendingUp,
  Clock,
  Receipt,
  Users,
  FileText,
  Activity,
} from "lucide-react";

/**
 * Hero-mockup voor de homepage: admin-dashboard met live-data, één
 * booking-rij die binnenrolt, status flipt naar "betaald", revenue tikt
 * op. Geen view-toggle meer — mockup is bewijs voor de h1-claim ("één
 * systeem onder je bedrijf"), niet een eigen verhaal naast de copy.
 *
 * Animaties: één keer bij mount; reduced-motion → eind-state direct.
 */
export function HeroMockup() {
  const reduce = useReducedMotion();
  return <AdminView reduce={reduce ?? false} />;
}

/* -------- ADMIN VIEW: dashboard met live data -------- */

function AdminView({ reduce }: { reduce: boolean }) {
  const [paid, setPaid] = React.useState(() => reduce);
  const [bookingIn, setBookingIn] = React.useState(() => reduce);
  const [revenue, setRevenue] = React.useState(reduce ? 2200 : 1360);

  React.useEffect(() => {
    if (reduce) return;
    const t1 = window.setTimeout(() => setBookingIn(true), 500);
    const t2 = window.setTimeout(() => setPaid(true), 2200);
    const t3 = window.setTimeout(() => setRevenue(2200), 2400);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [reduce]);

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="shadow-modal relative overflow-hidden rounded-[20px] border border-(--color-border) bg-(--color-surface) ring-1 ring-(--color-bg)/10"
    >
      {/* Browser chrome — admin dark */}
      <div className="flex items-center gap-1.5 border-b border-(--color-border) bg-(--color-text) px-3.5 py-2.5">
        <span className="h-2 w-2 rounded-full bg-(--color-bg)/30" />
        <span className="h-2 w-2 rounded-full bg-(--color-bg)/30" />
        <span className="h-2 w-2 rounded-full bg-(--color-bg)/30" />
        <span className="ml-2 truncate font-mono text-[10px] text-(--color-bg)/60">
          admin.jouwbedrijf.nl
        </span>
        <span className="ml-auto inline-flex items-center gap-1.5">
          <span className="relative flex h-1.5 w-1.5">
            {!reduce ? (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--color-success) opacity-60" />
            ) : null}
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-(--color-success)" />
          </span>
          <span className="font-mono text-[9px] tracking-widest text-(--color-bg)/60 uppercase">
            live
          </span>
        </span>
      </div>

      <div className="space-y-3 p-4 md:p-5">
        {/* Top stats — 4-grid */}
        <div className="grid grid-cols-4 gap-2">
          <Stat
            icon={Wallet}
            label="Vandaag"
            value={`€${revenue.toLocaleString("nl-NL")}`}
            wine
            animate
          />
          <Stat icon={Inbox} label="Open" value="2" />
          <Stat icon={Calendar} label="Boekingen" value="13" />
          <Stat icon={ShieldCheck} label="Uptime" value="99.98%" success />
        </div>

        {/* Header row */}
        <div className="flex items-baseline justify-between border-t border-b border-(--color-border) py-2.5">
          <div>
            <p className="font-mono text-[9px] tracking-widest text-(--color-muted) uppercase">
              Recente boekingen
            </p>
          </div>
          <span className="rounded-full bg-(--color-success)/15 px-2 py-0.5 font-mono text-[9px] tracking-wide text-(--color-success) uppercase">
            alles loopt
          </span>
        </div>

        {/* Booking rows */}
        <div className="space-y-1.5">
          <ExistingRow
            customer="Familie de Vries"
            object="Object · 7—14 jul"
            amount="€720"
            status="betaald"
          />
          <ExistingRow
            customer="J. Bakker"
            object="Bestelling #2841 · 3 items"
            amount="€640"
            status="contract"
          />

          {/* Nieuwe binnenrollende row */}
          <motion.div
            initial={reduce ? false : { opacity: 0, x: 24 }}
            animate={bookingIn ? { opacity: 1, x: 0 } : { opacity: 0, x: 24 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex items-center justify-between gap-3 rounded-[8px] border border-(--color-accent)/40 bg-(--color-accent-soft)/40 px-2.5 py-2"
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
                <p className="truncate text-[11.5px] font-medium">Familie Janssen</p>
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
                    <span
                      className="h-1 w-1 rounded-full bg-(--color-muted)"
                      style={{ animation: reduce ? undefined : "pulse 1.5s ease-in-out infinite" }}
                    />
                    wacht
                  </>
                )}
              </motion.span>
              <span className="font-serif text-[12px] font-medium tabular-nums">€840</span>
            </div>
          </motion.div>
        </div>

        {/* Bottom stats: secondary */}
        <div className="grid grid-cols-3 gap-2 border-t border-(--color-border) pt-2.5">
          <SecondaryStat icon={Receipt} label="Onbetaald" value="€340" />
          <SecondaryStat icon={Users} label="Klanten" value="248" />
          <SecondaryStat icon={Activity} label="Sites" value="3 · all up" />
        </div>

        {/* Mini activity feed */}
        <div className="space-y-1 border-t border-(--color-border) pt-2.5">
          <p className="font-mono text-[9px] tracking-widest text-(--color-muted) uppercase">
            Live activiteit
          </p>
          <ActivityItem icon={FileText} label="Contract verstuurd · J. Bakker" time="2m" />
          <ActivityItem icon={Wallet} label="Aanbetaling €420 · Familie Janssen" time="net" wine />
          <ActivityItem icon={TrendingUp} label="SEO-rapport ready · 12 keywords" time="1u" />
          <ActivityItem icon={Clock} label="Backup compleet · 2.4 GB" time="3u" muted />
        </div>
      </div>
    </motion.div>
  );
}

function ExistingRow({
  customer,
  object,
  amount,
  status,
}: {
  customer: string;
  object: string;
  amount: string;
  status: "betaald" | "contract";
}) {
  const statusStyle =
    status === "betaald"
      ? "bg-(--color-success)/15 text-(--color-success)"
      : "bg-(--color-accent-soft) text-(--color-accent)";
  return (
    <div className="flex items-center justify-between gap-3 rounded-[8px] border border-(--color-border) bg-(--color-bg-warm)/40 px-2.5 py-2">
      <div className="flex min-w-0 items-center gap-2">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-(--color-bg) text-(--color-muted)">
          <Calendar className="h-3 w-3" strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <p className="truncate text-[11.5px] font-medium">{customer}</p>
          <p className="truncate font-mono text-[9px] text-(--color-muted)">{object}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <span
          className={`rounded-full px-1.5 py-0.5 font-mono text-[8.5px] tracking-wide uppercase ${statusStyle}`}
        >
          {status}
        </span>
        <span className="font-serif text-[12px] font-medium tabular-nums">{amount}</span>
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  wine = false,
  success = false,
  animate = false,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
  wine?: boolean;
  success?: boolean;
  animate?: boolean;
}) {
  const valueColor = wine
    ? "text-(--color-wine)"
    : success
      ? "text-(--color-success)"
      : "text-(--color-text)";
  return (
    <div className="rounded-[8px] border border-(--color-border) bg-(--color-bg)/40 px-2 py-1.5">
      <div className="flex items-center gap-1 font-mono text-[8.5px] tracking-widest text-(--color-muted) uppercase">
        <Icon className="h-2.5 w-2.5" strokeWidth={2} />
        {label}
      </div>
      <motion.div
        key={animate ? value : undefined}
        initial={animate ? { opacity: 0.5, y: 4 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className={`mt-0.5 font-serif text-[14px] leading-none tabular-nums ${valueColor}`}
      >
        {value}
      </motion.div>
    </div>
  );
}

function SecondaryStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="h-3 w-3 text-(--color-muted)" strokeWidth={2} />
      <div className="min-w-0">
        <p className="truncate font-mono text-[8.5px] tracking-widest text-(--color-muted) uppercase">
          {label}
        </p>
        <p className="truncate text-[11px] font-medium">{value}</p>
      </div>
    </div>
  );
}

function ActivityItem({
  icon: Icon,
  label,
  time,
  wine = false,
  muted = false,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  time: string;
  wine?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-[10.5px]">
      <div className="flex min-w-0 items-center gap-1.5">
        <Icon
          className={`h-2.5 w-2.5 shrink-0 ${
            wine ? "text-(--color-wine)" : muted ? "text-(--color-muted)" : "text-(--color-accent)"
          }`}
          strokeWidth={2}
        />
        <span className={`truncate ${muted ? "text-(--color-muted)" : "text-(--color-text)"}`}>
          {label}
        </span>
      </div>
      <span className="shrink-0 font-mono text-[8.5px] text-(--color-muted)">{time}</span>
    </div>
  );
}
