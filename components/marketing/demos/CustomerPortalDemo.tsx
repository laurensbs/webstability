"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  Receipt,
  CalendarDays,
  MessageSquare,
  FileText,
  Bell,
  type LucideIcon,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

/**
 * Klant-portaal demo. Wat de eindklant in een Webstability-portaal ziet —
 * compact, vriendelijk, geen overload aan velden zoals het admin-paneel.
 *
 * Generiek opgezet: één component, drie varianten via de `variant` prop.
 * Data per case staat in CASE_DATA hieronder. Stijl matcht DemoShell —
 * top-banner, sidebar nav, view-switcher — maar dan met een lichtere
 * accentkleur en klant-perspectief.
 */

type Variant = "stalling" | "reparatie" | "verhuur";

type Notification = { time: string; what: string; tone?: "info" | "warn" | "success" };
type Document = { name: string; date: string; size: string };
type Invoice = { nr: string; date: string; amount: number; status: "Betaald" | "Open" };

type CaseData = {
  brandName: string;
  brandSub: string;
  accentColor: string;
  customerName: string;
  greeting: string;
  // Hero stat (één grote info bovenaan dashboard)
  heroLabel: string;
  heroValue: string;
  heroDetail: string;
  // 3 quick-info kaartjes
  infoCards: { label: string; value: string; hint?: string }[];
  notifications: Notification[];
  invoices: Invoice[];
  documents: Document[];
  // Tab-namen kunnen verschillen per case
  tabs: { dashboard: string; documents: string; agenda: string; messages: string };
  agendaItems: { date: string; what: string }[];
};

const CASE_DATA: Record<Variant, CaseData> = {
  stalling: {
    brandName: "Costa Storage",
    brandSub: "Mijn portaal",
    accentColor: "#1e3a4a",
    customerName: "Anna de Vries",
    greeting: "Welkom Anna",
    heroLabel: "Jouw plek",
    heroValue: "B-12",
    heroDetail: "Loods · contract loopt tot 1 maart 2026",
    infoCards: [
      { label: "Volgende ophalen", value: "16 mei", hint: "voor onderhoud" },
      { label: "Open factuur", value: "€ 0,—", hint: "alles betaald" },
      { label: "Foto's", value: "12", hint: "laatste mei 2025" },
    ],
    notifications: [
      {
        time: "vandaag",
        what: "Carlos heeft je caravan ingebracht voor de winter — foto's beschikbaar",
        tone: "success",
      },
      {
        time: "3 dagen geleden",
        what: "Factuur F-2026-0142 betaald · €850",
        tone: "info",
      },
      { time: "1 week geleden", what: "Contract automatisch verlengd t/m 2026" },
    ],
    invoices: [
      { nr: "F-2026-0142", date: "1 mei 2026", amount: 850, status: "Betaald" },
      { nr: "F-2025-0398", date: "1 nov 2025", amount: 320, status: "Betaald" },
      { nr: "F-2025-0211", date: "1 mei 2025", amount: 850, status: "Betaald" },
    ],
    documents: [
      { name: "Stallingscontract 2025-2026", date: "1 mei 2025", size: "240 kB" },
      { name: "Inspectie rapport mei 2025", date: "8 mei 2025", size: "1.2 MB" },
      { name: "Foto's na inbreng dec 2024", date: "12 dec 2024", size: "4.8 MB" },
    ],
    tabs: {
      dashboard: "Dashboard",
      documents: "Documenten",
      agenda: "Agenda",
      messages: "Berichten",
    },
    agendaItems: [
      { date: "vr 16 mei", what: "Ophalen door Carlos · onderhoudsbeurt" },
      { date: "ma 19 mei", what: "Terugplaatsen na onderhoud" },
      { date: "1 mrt 2026", what: "Contract verlenging" },
    ],
  },
  reparatie: {
    brandName: "Reparatie Spanje",
    brandSub: "Mijn werkbon",
    accentColor: "#3a2820",
    customerName: "Anna de Vries",
    greeting: "Welkom Anna",
    heroLabel: "Status werkbon",
    heroValue: "In behandeling",
    heroDetail: "WO-1429 · lekkage bij dakraam · monteur Pedro",
    infoCards: [
      { label: "Verwachte oplevering", value: "16 mei", hint: "vrijdag eind dag" },
      { label: "Indicatie kosten", value: "€ 240–320", hint: "definitief op offerte" },
      { label: "Foto's binnen", value: "8", hint: "voor + tijdens reparatie" },
    ],
    notifications: [
      {
        time: "1 uur geleden",
        what: "Pedro heeft 4 nieuwe foto's toegevoegd · status: in behandeling",
        tone: "success",
      },
      {
        time: "vanmorgen",
        what: "Werkbon WO-1429 aangenomen door Pedro · start vandaag",
        tone: "info",
      },
      {
        time: "gisteren",
        what: "Reparatie aanvraag ingediend voor caravan Hobby De Luxe 540",
      },
    ],
    invoices: [
      { nr: "F-2025-0089", date: "12 jul 2025", amount: 185, status: "Betaald" },
      { nr: "F-2024-0341", date: "5 sep 2024", amount: 420, status: "Betaald" },
    ],
    documents: [
      { name: "Werkbon WO-1429", date: "13 mei 2026", size: "180 kB" },
      { name: "Foto's voor reparatie (4)", date: "13 mei 2026", size: "3.2 MB" },
      { name: "Vorige offerte (jul 2025)", date: "10 jul 2025", size: "210 kB" },
    ],
    tabs: {
      dashboard: "Mijn werkbon",
      documents: "Foto's & docs",
      agenda: "Planning",
      messages: "Berichten",
    },
    agendaItems: [
      { date: "wo 14 mei", what: "Pedro begint met dakraam-reparatie" },
      { date: "do 15 mei", what: "Verwachte voortgang · update + foto's" },
      { date: "vr 16 mei", what: "Verwachte oplevering · ophalen vanaf 16:00" },
    ],
  },
  verhuur: {
    brandName: "Caravan Costa Brava",
    brandSub: "Mijn boeking",
    accentColor: "#1f4e3d",
    customerName: "Familie Visser",
    greeting: "Welkom familie",
    heroLabel: "Aankomst over",
    heroValue: "4 dagen",
    heroDetail: "za 18 mei · Hobby Premium 660 · Camping Costa Brava",
    infoCards: [
      { label: "Periode", value: "18-25 mei", hint: "7 nachten" },
      { label: "Totaal", value: "€ 945", hint: "aanbetaald" },
      { label: "Borg", value: "€ 250", hint: "via iDEAL" },
    ],
    notifications: [
      {
        time: "vanmorgen",
        what: "Aankomst-info verstuurd · check je inbox voor de routebeschrijving",
        tone: "info",
      },
      {
        time: "3 dagen geleden",
        what: "Aanbetaling van € 280 ontvangen · bevestiging volgt",
        tone: "success",
      },
      { time: "1 week geleden", what: "Boeking B-2026-0142 bevestigd" },
    ],
    invoices: [{ nr: "B-2026-0142 (boeking)", date: "8 mei 2026", amount: 945, status: "Betaald" }],
    documents: [
      { name: "Bevestiging boeking", date: "8 mei 2026", size: "180 kB" },
      { name: "Aankomst-info + routebeschrijving", date: "13 mei 2026", size: "420 kB" },
      { name: "Huisregels camping", date: "8 mei 2026", size: "95 kB" },
    ],
    tabs: {
      dashboard: "Mijn boeking",
      documents: "Documenten",
      agenda: "Planning",
      messages: "Berichten",
    },
    agendaItems: [
      { date: "za 18 mei", what: "Aankomst tussen 14:00 en 18:00" },
      { date: "ma 20 mei", what: "Schone handdoeken op afspraak" },
      { date: "za 25 mei", what: "Vertrek voor 11:00 · sleutel in box" },
    ],
  },
};

type View = "dashboard" | "documents" | "agenda" | "messages";

export function CustomerPortalDemo({ variant }: { variant: Variant }) {
  const data = CASE_DATA[variant];
  const [view, setView] = React.useState<View>("dashboard");

  const tabs: { id: View; label: string; icon: LucideIcon }[] = [
    { id: "dashboard", label: data.tabs.dashboard, icon: LayoutDashboard },
    { id: "documents", label: data.tabs.documents, icon: FileText },
    { id: "agenda", label: data.tabs.agenda, icon: CalendarDays },
    { id: "messages", label: data.tabs.messages, icon: MessageSquare },
  ];

  return (
    <div className="dotted-bg min-h-screen px-4 py-8 md:px-6 md:py-10">
      {/* Top demo-banner */}
      <div className="mx-auto mb-4 flex max-w-5xl items-center justify-between gap-3 rounded-full border border-(--color-border) bg-(--color-surface) px-4 py-2 text-[12px]">
        <div className="flex items-center gap-2">
          <span className="rounded bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-neutral-900 uppercase">
            Demo · klant
          </span>
          <span className="text-(--color-muted)">
            <span className="hidden sm:inline">Wat de eindklant in z&apos;n portaal ziet.</span>{" "}
            Klikken werkt, niets wordt opgeslagen.
          </span>
        </div>
        <Link
          href={`/demo/${variant}` as never}
          className="inline-flex items-center gap-1 font-medium text-(--color-text) hover:text-(--color-accent)"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Bekijk admin-kant</span>
          <span className="sm:hidden">Admin</span>
        </Link>
      </div>

      {/* App-frame */}
      <div className="rounded-modal shadow-floating mx-auto flex h-[min(820px,80vh)] max-w-5xl overflow-hidden border border-(--color-border) bg-(--color-surface)">
        {/* Sidebar */}
        <aside
          className="hidden w-[230px] shrink-0 flex-col p-4 md:flex"
          style={{ background: data.accentColor, color: "#fff" }}
        >
          <div className="mb-6">
            <p className="text-[15px] leading-tight font-semibold">{data.brandName}</p>
            <p className="mt-1 text-[11px] opacity-70">{data.brandSub}</p>
          </div>

          <div className="rounded-lg bg-white/10 p-3 text-[12px]">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-[11px] font-bold"
                aria-hidden
              >
                {data.customerName
                  .split(" ")
                  .map((s) => s[0])
                  .slice(0, 2)
                  .join("")}
              </span>
              <div>
                <p className="font-medium">{data.customerName}</p>
                <p className="opacity-70">Ingelogd als klant</p>
              </div>
            </div>
          </div>

          <nav className="mt-4 flex flex-1 flex-col gap-0.5">
            {tabs.map((t) => {
              const Icon = t.icon;
              const isActive = t.id === view;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setView(t.id)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13.5px] font-medium transition-colors"
                  style={{
                    color: "#fff",
                    background: isActive ? "rgba(255,255,255,0.15)" : "transparent",
                    opacity: isActive ? 1 : 0.78,
                  }}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {t.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-4 border-t border-white/15 pt-3">
            <a
              href="https://webstability.nl"
              className="flex items-center gap-1.5 text-[10.5px] font-medium tracking-widest uppercase opacity-60 hover:opacity-90"
            >
              Gebouwd door Webstability
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </aside>

        {/* Mobile tabs */}
        <div className="flex w-full flex-col">
          <div
            className="flex shrink-0 overflow-x-auto border-b border-(--color-border) md:hidden"
            style={{ background: data.accentColor }}
          >
            {tabs.map((t) => {
              const isActive = t.id === view;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setView(t.id)}
                  className="shrink-0 px-4 py-3 text-[12px] font-medium"
                  style={{
                    color: "#fff",
                    opacity: isActive ? 1 : 0.65,
                    borderBottom: isActive ? `2px solid #fff` : "2px solid transparent",
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Content met fade-in animatie bij view-switch */}
          <main className="flex-1 overflow-y-auto bg-(--color-bg) p-6 md:p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              >
                {view === "dashboard" ? <Dashboard data={data} /> : null}
                {view === "documents" ? <Documents data={data} /> : null}
                {view === "agenda" ? <Agenda data={data} /> : null}
                {view === "messages" ? <Messages data={data} /> : null}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ data }: { data: CaseData }) {
  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[11px] tracking-widest text-(--color-muted) uppercase">
          {data.greeting}
        </p>
        <h1 className="mt-1 text-2xl text-(--color-text)">Hier vind je alles op een plek.</h1>
      </div>

      {/* Hero panel */}
      <div
        className="rounded-card border border-(--color-border) p-6"
        style={{
          background: `linear-gradient(135deg, ${data.accentColor}, ${data.accentColor}dd)`,
          color: "#fff",
        }}
      >
        <p className="font-mono text-[10.5px] tracking-widest uppercase opacity-70">
          {data.heroLabel}
        </p>
        <p className="mt-1 font-serif text-3xl">{data.heroValue}</p>
        <p className="mt-2 text-[13px] opacity-85">{data.heroDetail}</p>
      </div>

      {/* Quick info cards */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {data.infoCards.map((c) => (
          <div
            key={c.label}
            className="rounded-card border border-(--color-border) bg-(--color-surface) p-4"
          >
            <p className="font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
              {c.label}
            </p>
            <p className="mt-1 text-[20px] leading-tight font-semibold text-(--color-text)">
              {c.value}
            </p>
            {c.hint ? <p className="mt-0.5 text-[11px] text-(--color-muted)">{c.hint}</p> : null}
          </div>
        ))}
      </div>

      {/* Notifications */}
      <div className="rounded-card border border-(--color-border) bg-(--color-surface) p-5">
        <div className="mb-3 flex items-center gap-2">
          <Bell className="h-4 w-4 text-(--color-accent)" />
          <p className="font-mono text-[11px] tracking-widest text-(--color-muted) uppercase">
            Recente updates
          </p>
        </div>
        <ul className="space-y-3">
          {data.notifications.map((n, i) => (
            <li key={i} className="flex gap-3 text-[13.5px]">
              <span
                className="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full"
                style={{
                  background:
                    n.tone === "success"
                      ? "#5a7a4a"
                      : n.tone === "warn"
                        ? "#f59e0b"
                        : "var(--color-accent)",
                }}
                aria-hidden
              />
              <div className="flex-1">
                <p className="text-(--color-text)">{n.what}</p>
                <p className="mt-0.5 font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
                  {n.time}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Invoices */}
      <div className="rounded-card border border-(--color-border) bg-(--color-surface) p-5">
        <div className="mb-3 flex items-center gap-2">
          <Receipt className="h-4 w-4 text-(--color-accent)" />
          <p className="font-mono text-[11px] tracking-widest text-(--color-muted) uppercase">
            Mijn facturen
          </p>
        </div>
        <ul className="divide-y divide-(--color-border)">
          {data.invoices.map((inv) => (
            <li key={inv.nr} className="flex items-center justify-between py-2.5 text-[13.5px]">
              <div>
                <p className="font-medium text-(--color-text)">{inv.nr}</p>
                <p className="text-[11.5px] text-(--color-muted)">{inv.date}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">€ {inv.amount.toLocaleString("nl-NL")}</p>
                <p
                  className={`text-[11px] ${
                    inv.status === "Betaald" ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  {inv.status}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Documents({ data }: { data: CaseData }) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl text-(--color-text)">{data.tabs.documents}</h1>
        <p className="mt-1 text-[14px] text-(--color-muted)">
          Alles wat we voor jou bewaren — altijd downloadbaar
        </p>
      </div>
      <div className="space-y-2">
        {data.documents.map((d) => (
          <div
            key={d.name}
            className="rounded-card flex items-center justify-between border border-(--color-border) bg-(--color-surface) p-4 transition-shadow hover:shadow-sm"
          >
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-(--color-accent)" />
              <div>
                <p className="text-[14px] font-medium text-(--color-text)">{d.name}</p>
                <p className="text-[11.5px] text-(--color-muted)">
                  {d.date} · {d.size}
                </p>
              </div>
            </div>
            <button className="rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-1.5 text-[12px] font-medium hover:border-(--color-accent)/40">
              Download
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Agenda({ data }: { data: CaseData }) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl text-(--color-text)">{data.tabs.agenda}</h1>
        <p className="mt-1 text-[14px] text-(--color-muted)">Wat er aan komt voor jou</p>
      </div>
      <div className="space-y-3">
        {data.agendaItems.map((it) => (
          <div
            key={it.date}
            className="rounded-card flex items-start gap-4 border border-(--color-border) bg-(--color-surface) p-4"
          >
            <div className="w-24 shrink-0">
              <p className="font-mono text-[11px] tracking-wider text-(--color-accent) uppercase">
                {it.date}
              </p>
            </div>
            <p className="text-[14px] text-(--color-text)">{it.what}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Messages({ data }: { data: CaseData }) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl text-(--color-text)">{data.tabs.messages}</h1>
        <p className="mt-1 text-[14px] text-(--color-muted)">
          Direct contact met het team — antwoord meestal binnen een dag
        </p>
      </div>
      <div className="rounded-card space-y-4 border border-(--color-border) bg-(--color-surface) p-5">
        <div className="flex gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-(--color-accent)/10 text-[11px] font-bold text-(--color-accent)">
            T
          </span>
          <div className="flex-1">
            <p className="text-[12px] font-medium text-(--color-text)">
              Team {data.brandName} <span className="text-(--color-muted)">· vandaag</span>
            </p>
            <p className="mt-1 text-[13.5px] text-(--color-text)">
              Hoi! Alles is in orde, we sturen je een update zodra er nieuws is. Vragen? Stuur
              gewoon een bericht hier.
            </p>
          </div>
        </div>
        <div className="border-t border-(--color-border) pt-4">
          <textarea
            rows={3}
            placeholder="Stel je vraag…"
            className="w-full resize-none rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-[13.5px] focus:border-(--color-accent) focus:outline-none"
          />
          <button className="mt-2 rounded-full bg-(--color-accent) px-4 py-2 text-[12.5px] font-medium text-white">
            Stuur bericht
          </button>
        </div>
      </div>
    </div>
  );
}
