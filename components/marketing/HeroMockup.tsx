"use client";

import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
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

type View = "client" | "admin";

/**
 * Hero-mockup met view-toggle: een leek ziet hetzelfde booking-systeem
 * van twee kanten — wat de klant ziet (boekingsformulier + bevestiging)
 * en wat de eigenaar ziet (admin-dashboard met live-rij). Auto-cycle
 * na 6s, manueel klikbaar via de pill bovenaan. Animaties stoppen bij
 * prefers-reduced-motion.
 */
export function HeroMockup() {
  const reduce = useReducedMotion();
  const [view, setView] = React.useState<View>("client");

  // Auto-cycle elke 6.5s. Stopt zodra de gebruiker handmatig switcht.
  const [autoCycle, setAutoCycle] = React.useState(true);
  React.useEffect(() => {
    if (reduce || !autoCycle) return;
    const id = window.setInterval(() => {
      setView((v) => (v === "client" ? "admin" : "client"));
    }, 6500);
    return () => window.clearInterval(id);
  }, [reduce, autoCycle]);

  const handleSwitch = (next: View) => {
    setAutoCycle(false);
    setView(next);
  };

  return (
    <div className="relative">
      {/* Floating glow achter de mockup */}
      {!reduce ? (
        <div
          aria-hidden
          className="wb-soft-halo pointer-events-none absolute -inset-8 -z-10 opacity-60 blur-[40px]"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 30% 30%, rgba(107,30,44,0.20) 0%, transparent 60%), radial-gradient(ellipse 50% 40% at 70% 70%, rgba(201,97,79,0.20) 0%, transparent 60%)",
          }}
        />
      ) : null}

      {/* View-toggle pill — bovenop de mockup */}
      <div className="mb-3 flex items-center justify-center">
        <div className="inline-flex items-center gap-0.5 rounded-full border border-(--color-border) bg-(--color-surface) p-1 shadow-[0_1px_2px_rgba(31,27,22,0.04)]">
          <ToggleButton active={view === "client"} onClick={() => handleSwitch("client")}>
            Klant ziet dit
          </ToggleButton>
          <ToggleButton active={view === "admin"} onClick={() => handleSwitch("admin")}>
            Jij ziet dit
          </ToggleButton>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === "client" ? (
          <motion.div
            key="client"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <ClientView reduce={reduce ?? false} />
          </motion.div>
        ) : (
          <motion.div
            key="admin"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <AdminView reduce={reduce ?? false} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative rounded-full px-3 py-1 text-[11px] font-medium tracking-wide transition-colors ${
        active ? "text-(--color-bg)" : "text-(--color-muted) hover:text-(--color-text)"
      }`}
    >
      {active ? (
        <motion.span
          layoutId="hero-mockup-pill"
          className="absolute inset-0 rounded-full bg-(--color-text)"
          transition={{ type: "spring", stiffness: 160, damping: 26, mass: 1.1 }}
        />
      ) : null}
      <span className="relative">{children}</span>
    </button>
  );
}

/* -------- CLIENT VIEW: publieke boekingspagina mockup -------- */

function ClientView({ reduce }: { reduce: boolean }) {
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-[20px] border border-(--color-border) bg-(--color-surface) shadow-[0_24px_48px_-12px_rgba(31,27,22,0.18),0_8px_16px_-4px_rgba(31,27,22,0.08)]"
    >
      {/* Browser chrome — light (publiek) */}
      <div className="flex items-center gap-1.5 border-b border-(--color-border) bg-(--color-bg-warm)/60 px-3.5 py-2.5">
        <span className="h-2 w-2 rounded-full bg-(--color-border)" />
        <span className="h-2 w-2 rounded-full bg-(--color-border)" />
        <span className="h-2 w-2 rounded-full bg-(--color-border)" />
        <span className="ml-2 truncate font-mono text-[10px] text-(--color-muted)">
          jouwbedrijf.nl/boeken
        </span>
        <span className="ml-auto rounded-full bg-(--color-success)/15 px-1.5 py-0.5 font-mono text-[8px] tracking-wide text-(--color-success) uppercase">
          SSL
        </span>
      </div>

      <div className="p-4 md:p-5">
        {/* Abstracte product-hero — gradient + grid-lijnen voor depth.
            Generiek genoeg voor elke productlijn: verhuur, retail,
            reparatie, stallingen — geen caravan-fixatie. */}
        <div
          aria-hidden
          className="relative mb-3 aspect-[16/7] overflow-hidden rounded-[12px] border border-(--color-border)"
          style={{
            background:
              "linear-gradient(135deg, var(--color-accent-soft) 0%, var(--color-bg-warm) 60%, var(--color-bg) 100%)",
          }}
        >
          {/* Subtle terracotta halo top-right */}
          <span className="wb-soft-halo absolute -top-12 -right-12 h-32 w-32 rounded-full bg-(--color-accent)/30 blur-2xl" />
          {/* Grid-lijnen voor structuur */}
          <span
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(var(--color-text) 1px, transparent 1px), linear-gradient(90deg, var(--color-text) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          {/* "Beschikbaar" badge */}
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-(--color-surface)/90 px-2 py-0.5 font-mono text-[9px] tracking-wide text-(--color-success) backdrop-blur-sm">
            <span className="h-1 w-1 rounded-full bg-(--color-success)" />
            beschikbaar
          </span>
          {/* Photo-counter */}
          <span className="absolute right-2 bottom-2 rounded-full bg-(--color-text)/70 px-2 py-0.5 font-mono text-[9px] tracking-wide text-(--color-bg) backdrop-blur-sm">
            1/12
          </span>
        </div>

        {/* Titel + reviews */}
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <div className="min-w-0">
            <p className="font-mono text-[8px] tracking-widest text-(--color-muted) uppercase">
              Productlijn · Beschikbaar
            </p>
            <h3 className="mt-0.5 truncate font-serif text-[16px] leading-tight">
              Object · 14—21 jul
            </h3>
          </div>
          <div className="flex shrink-0 items-center gap-1 font-mono text-[10px] text-(--color-muted)">
            <span className="text-(--color-accent)">★ 4.9</span>
            <span>· 47 reviews</span>
          </div>
        </div>

        {/* Date-picker mini */}
        <div className="mb-3 grid grid-cols-2 gap-2">
          <div className="rounded-[8px] border border-(--color-border) bg-(--color-bg-warm)/40 px-2.5 py-2">
            <p className="font-mono text-[8px] tracking-widest text-(--color-muted) uppercase">
              Aankomst
            </p>
            <p className="mt-0.5 text-[12px] font-medium">14 jul · 15:00</p>
          </div>
          <div className="rounded-[8px] border border-(--color-border) bg-(--color-bg-warm)/40 px-2.5 py-2">
            <p className="font-mono text-[8px] tracking-widest text-(--color-muted) uppercase">
              Vertrek
            </p>
            <p className="mt-0.5 text-[12px] font-medium">21 jul · 11:00</p>
          </div>
        </div>

        {/* Prijs-breakdown */}
        <div className="mb-3 space-y-1.5 rounded-[8px] border border-(--color-border) bg-(--color-surface) p-2.5">
          <PriceRow label="€120 × 7 nachten" value="€840" />
          <PriceRow label="Schoonmaak" value="€45" muted />
          <PriceRow label="Borg (refundable)" value="€500" muted />
          <div className="border-t border-(--color-border) pt-1.5">
            <PriceRow label="Te betalen nu (50%)" value="€420" wine />
          </div>
        </div>

        {/* CTA + payment-icons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex-1 rounded-full bg-(--color-accent) px-3 py-2 text-[12px] font-medium text-white"
          >
            Boek nu — €420 aanbetaling
          </button>
          <div className="flex shrink-0 items-center gap-1">
            <PaymentBadge label="iDEAL" />
            <PaymentBadge label="Visa" />
          </div>
        </div>
        <p className="mt-2 text-center font-mono text-[8px] tracking-wide text-(--color-muted)">
          🔒 Veilig betalen via Mollie · annuleren tot 7 dagen voor aankomst
        </p>
      </div>
    </motion.div>
  );
}

function PriceRow({
  label,
  value,
  muted = false,
  wine = false,
}: {
  label: string;
  value: string;
  muted?: boolean;
  wine?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between text-[11px]">
      <span className={muted ? "text-(--color-muted)" : "text-(--color-text)"}>{label}</span>
      <span
        className={`font-medium tabular-nums ${
          wine ? "font-serif text-[14px] text-(--color-wine)" : ""
        } ${muted ? "text-(--color-muted)" : "text-(--color-text)"}`}
      >
        {value}
      </span>
    </div>
  );
}

function PaymentBadge({ label }: { label: string }) {
  return (
    <span className="rounded border border-(--color-border) bg-(--color-bg) px-1.5 py-0.5 font-mono text-[8px] font-medium tracking-wide text-(--color-muted)">
      {label}
    </span>
  );
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
      className="relative overflow-hidden rounded-[20px] border border-(--color-border) bg-(--color-surface) shadow-[0_24px_48px_-12px_rgba(31,27,22,0.18),0_8px_16px_-4px_rgba(31,27,22,0.08)]"
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
