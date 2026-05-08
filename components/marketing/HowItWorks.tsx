"use client";

import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Calendar, FileText, Wallet, ShieldCheck } from "lucide-react";
import { Eyebrow } from "@/components/animate/Eyebrow";
import { AnimatedHeading } from "@/components/animate/AnimatedHeading";
import { CaravanIllustration } from "@/components/marketing/CaravanIllustration";
import { BookingCalendarMini } from "@/components/marketing/BookingCalendarMini";
import { MeshBackground } from "@/components/marketing/MeshBackground";

type View = "client" | "owner";

type Strings = {
  eyebrow: string;
  title: string;
  lede: string;
  toggleClient: string;
  toggleOwner: string;
  client: {
    badge: string;
    object: string;
    dates: string;
    total: string;
    deposit: string;
    cta: string;
  };
  owner: {
    badge: string;
    bookingId: string;
    customer: string;
    customerEmail: string;
    object: string;
    nights: string;
    total: string;
    paid: string;
    contract: string;
    deposit: string;
    calendar: string;
    statusLabel: string;
    statusValue: string;
    actionLabel: string;
    actionValue: string;
  };
  flowSteps: string[];
  calendar: {
    weekdays: [string, string, string, string, string, string, string];
    monthLabel: string;
  };
  bridgeLabel: string;
};

export function HowItWorks({ strings }: { strings: Strings }) {
  const reduce = useReducedMotion();
  const [view, setView] = React.useState<View>("client");

  return (
    <section className="px-6 py-[100px]">
      <div className="mx-auto max-w-[1200px]">
        {/* Heading */}
        <div className="mx-auto mb-12 max-w-[720px] text-center">
          <Eyebrow className="mb-[18px]">{strings.eyebrow}</Eyebrow>
          <AnimatedHeading as="h2" className="mx-auto mb-[18px] text-[clamp(32px,4.5vw,52px)]">
            {strings.title}
          </AnimatedHeading>
          <p className="mx-auto max-w-[56ch] text-[18px] text-(--color-muted)">{strings.lede}</p>
        </div>

        {/* Toggle */}
        <div className="mx-auto mb-6 flex w-fit items-center gap-1 rounded-full border border-(--color-border) bg-(--color-surface) p-1.5">
          <ToggleButton active={view === "client"} onClick={() => setView("client")}>
            {strings.toggleClient}
          </ToggleButton>
          <ToggleButton active={view === "owner"} onClick={() => setView("owner")}>
            {strings.toggleOwner}
          </ToggleButton>
        </div>

        {/* Sync-bridge — connector between toggle and mockup */}
        <SyncBridge view={view} label={strings.bridgeLabel} />

        {/* Mockup card with floating ambient glow */}
        <div className="relative mx-auto max-w-[820px]">
          {/* Ambient mesh-glow behind card — only when motion allowed */}
          {reduce ? null : (
            <div aria-hidden className="pointer-events-none absolute -inset-12 -z-10 opacity-40">
              <MeshBackground />
            </div>
          )}

          <AnimatePresence mode="wait">
            {view === "client" ? (
              <motion.div
                key="client"
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <ClientMockup strings={strings.client} />
              </motion.div>
            ) : (
              <motion.div
                key="owner"
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <OwnerMockup
                  strings={strings.owner}
                  flowSteps={strings.flowSteps}
                  calendar={strings.calendar}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
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
      className={`relative rounded-full px-5 py-2 text-[13px] font-medium transition-colors ${
        active ? "text-(--color-bg)" : "text-(--color-muted) hover:text-(--color-text)"
      }`}
    >
      {active ? (
        <motion.span
          layoutId="how-it-works-toggle-pill"
          className="absolute inset-0 rounded-full bg-(--color-text)"
          transition={{ type: "spring", stiffness: 400, damping: 32 }}
        />
      ) : null}
      <span className="relative">{children}</span>
    </button>
  );
}

/* -------- SYNC-BRIDGE: connector with live-pulse dot + booking ID -------- */
function SyncBridge({ view, label }: { view: View; label: string }) {
  return (
    <div className="mx-auto mb-8 flex max-w-[480px] items-center gap-3">
      <span
        className={`h-px flex-1 bg-gradient-to-r ${
          view === "client"
            ? "from-transparent to-(--color-accent)/60"
            : "from-(--color-accent)/60 to-transparent"
        }`}
      />
      <div className="relative flex items-center gap-2 rounded-full border border-(--color-border) bg-(--color-surface) px-3 py-1.5">
        <span className="relative flex h-2 w-2">
          <motion.span
            layoutId="how-sync-dot"
            className="absolute inset-0 rounded-full bg-(--color-accent)"
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          />
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-(--color-accent)"
            style={{ animation: "wb-soft-pulse 2.4s ease-out infinite" }}
          />
        </span>
        <span className="font-mono text-[10px] tracking-wide text-(--color-muted)">{label}</span>
      </div>
      <span
        className={`h-px flex-1 bg-gradient-to-r ${
          view === "owner"
            ? "from-transparent to-(--color-accent)/60"
            : "from-(--color-accent)/60 to-transparent"
        }`}
      />
    </div>
  );
}

/* -------- CLIENT-VIEW: a public booking page mockup -------- */
function ClientMockup({ strings }: { strings: Strings["client"] }) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-(--color-border) bg-(--color-surface) shadow-[0_24px_48px_-12px_rgba(31,27,22,0.12),0_8px_16px_-4px_rgba(31,27,22,0.06)]">
      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 border-b border-(--color-border) bg-(--color-bg-warm)/60 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-(--color-border)" />
        <span className="h-2.5 w-2.5 rounded-full bg-(--color-border)" />
        <span className="h-2.5 w-2.5 rounded-full bg-(--color-border)" />
        <span className="ml-3 font-mono text-[11px] text-(--color-muted)">
          costacaravans.nl/boeken
        </span>
      </div>

      <div className="grid gap-8 p-8 md:grid-cols-[1.2fr_1fr] md:p-12">
        {/* Left — illustrated hero + thumbnail strip */}
        <div className="space-y-4">
          <CaravanIllustration />

          {/* Thumbnail strip — suggestie van meerdere foto's */}
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <button
                key={i}
                type="button"
                aria-label={`Foto ${i + 1}`}
                className={`aspect-[4/3] flex-1 rounded-md border transition-all ${
                  i === 0
                    ? "border-(--color-accent) ring-1 ring-(--color-accent)/30"
                    : "border-(--color-border) opacity-70 hover:opacity-100"
                }`}
                style={{
                  background:
                    i === 0
                      ? "linear-gradient(135deg, #FBE9D8 0%, #E5D4C4 100%)"
                      : i === 1
                        ? "linear-gradient(135deg, #DCE8E7 0%, #B8CFCD 100%)"
                        : "linear-gradient(135deg, #F4DCD4 0%, #C9614F33 100%)",
                }}
              />
            ))}
          </div>

          <p className="font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
            {strings.badge}
          </p>
          <h3 className="font-serif text-[28px] leading-[1.1]">{strings.object}</h3>
          <p className="text-[14px] text-(--color-muted)">{strings.dates}</p>
        </div>

        {/* Right — booking summary */}
        <div className="flex flex-col justify-between gap-6 rounded-[14px] border border-(--color-border) bg-(--color-bg-warm)/40 p-6">
          <div className="space-y-3">
            <div className="flex items-baseline justify-between border-b border-(--color-border) pb-3">
              <span className="text-[13px] text-(--color-muted)">{strings.total}</span>
              <span className="font-serif text-[28px] leading-none">€840</span>
            </div>
            <div className="flex items-baseline justify-between text-[13px]">
              <span className="text-(--color-muted)">{strings.deposit}</span>
              <span className="font-medium">€420</span>
            </div>
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-(--color-accent) px-5 py-3 text-[14px] font-medium text-white"
          >
            {strings.cta} →
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------- OWNER-VIEW: an admin dashboard mockup of the same booking -------- */
function OwnerMockup({
  strings,
  flowSteps,
  calendar,
}: {
  strings: Strings["owner"];
  flowSteps: string[];
  calendar: Strings["calendar"];
}) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-(--color-border) bg-(--color-surface) shadow-[0_24px_48px_-12px_rgba(31,27,22,0.12),0_8px_16px_-4px_rgba(31,27,22,0.06)]">
      {/* Browser chrome — admin */}
      <div className="flex items-center gap-1.5 border-b border-(--color-border) bg-(--color-text) px-4 py-3 text-(--color-bg)">
        <span className="h-2.5 w-2.5 rounded-full bg-(--color-bg)/30" />
        <span className="h-2.5 w-2.5 rounded-full bg-(--color-bg)/30" />
        <span className="h-2.5 w-2.5 rounded-full bg-(--color-bg)/30" />
        <span className="ml-3 font-mono text-[11px] text-(--color-bg)/60">
          admin.costacaravans.nl/bookings
        </span>
      </div>

      <div className="grid gap-6 p-8 md:p-10">
        <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-(--color-border) pb-5">
          <div>
            <p className="font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
              {strings.badge}
            </p>
            <h3 className="mt-1 font-serif text-[24px]">{strings.bookingId}</h3>
            <p className="mt-1 text-[13px] text-(--color-muted)">
              {strings.customer} · {strings.customerEmail}
            </p>
          </div>
          <span className="rounded-full bg-(--color-success)/15 px-3 py-1 font-mono text-[10px] tracking-wide text-(--color-success) uppercase">
            {strings.statusValue}
          </span>
        </div>

        {/* Status flow — Boeking → Betaling → Contract → Borg → Bevestigd */}
        <StatusFlow steps={flowSteps} />

        {/* Two-column: details + mini calendar */}
        <div className="grid gap-5 md:grid-cols-[1.4fr_1fr]">
          <ul className="grid gap-2.5">
            <Row icon={Calendar} label={strings.object} value={strings.nights} />
            <Row icon={Wallet} label={strings.total} value="€840" />
            <Row icon={Check} label={strings.paid} value="€420 · Mollie" success />
            <Row icon={FileText} label={strings.contract} value="✓ verstuurd" success />
            <Row icon={ShieldCheck} label={strings.deposit} value="€500 vastgehouden" />
            <Row icon={Calendar} label={strings.calendar} value="Booking + Airbnb sync ✓" success />
          </ul>

          <BookingCalendarMini strings={calendar} />
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-(--color-border) pt-5 text-[13px]">
          <span className="text-(--color-muted)">{strings.actionLabel}</span>
          <span className="font-medium">{strings.actionValue}</span>
        </div>
      </div>
    </div>
  );
}

function StatusFlow({ steps }: { steps: string[] }) {
  // All steps before the last are "done"; the last is "pending".
  return (
    <ol className="flex items-center gap-1.5 overflow-x-auto">
      {steps.map((step, i) => {
        const done = i < steps.length - 1;
        const isLast = i === steps.length - 1;
        return (
          <React.Fragment key={step}>
            <li className="flex items-center gap-2 whitespace-nowrap">
              <span
                className={`relative flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                  done
                    ? "bg-(--color-success) text-white"
                    : "border-2 border-(--color-accent) bg-(--color-surface) text-(--color-accent)"
                }`}
              >
                {done ? (
                  <Check className="h-3 w-3" strokeWidth={3} />
                ) : (
                  <>
                    <span
                      aria-hidden
                      className="absolute inset-0 rounded-full bg-(--color-accent)/40"
                      style={{ animation: "wb-soft-pulse 2.4s ease-out infinite" }}
                    />
                    <span className="relative">{i + 1}</span>
                  </>
                )}
              </span>
              <span
                className={`font-mono text-[10px] tracking-wide uppercase ${
                  isLast ? "text-(--color-accent)" : "text-(--color-muted)"
                }`}
              >
                {step}
              </span>
            </li>
            {i < steps.length - 1 ? (
              <span
                aria-hidden
                className={`h-px w-4 flex-shrink ${
                  done ? "bg-(--color-success)/40" : "bg-(--color-border)"
                }`}
              />
            ) : null}
          </React.Fragment>
        );
      })}
    </ol>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  success = false,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  value: string;
  success?: boolean;
}) {
  return (
    <li className="flex items-center justify-between gap-4 rounded-[10px] border border-(--color-border) bg-(--color-bg-warm)/40 px-4 py-3 text-[14px]">
      <span className="flex items-center gap-2.5 text-(--color-muted)">
        <Icon className="h-3.5 w-3.5 text-(--color-accent)" strokeWidth={2} />
        {label}
      </span>
      <span
        className={`font-mono text-[12px] ${success ? "text-(--color-success)" : "text-(--color-text)"}`}
      >
        {value}
      </span>
    </li>
  );
}
