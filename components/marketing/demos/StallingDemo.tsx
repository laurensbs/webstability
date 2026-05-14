"use client";

import { LayoutDashboard, Users, Warehouse, Receipt, Calendar } from "lucide-react";
import { DemoShell, StatCard, DemoTable, StatusBadge } from "./DemoShell";

/**
 * Demo: stallingsplatform admin paneel.
 *
 * Vier gesimuleerde schermen: dashboard met stats, klantenlijst, plekken-
 * overzicht en facturen. Alle data is hardcoded in deze file en bedoeld
 * om herkenbaar maar fictief te zijn (Spaanse plaatsnamen + NL klanten).
 */

const CUSTOMERS = [
  {
    id: "C-1024",
    name: "Anna de Vries",
    spot: "B-12",
    contract: "1 mrt 2024 — 1 mrt 2026",
    status: "Actief",
  },
  {
    id: "C-1025",
    name: "Marc Janssen",
    spot: "B-08",
    contract: "15 jun 2024 — 15 jun 2026",
    status: "Actief",
  },
  {
    id: "C-1026",
    name: "Sophie Bakker",
    spot: "A-03",
    contract: "1 jan 2025 — 1 jan 2027",
    status: "Actief",
  },
  {
    id: "C-1027",
    name: "Pieter van Dam",
    spot: "C-22",
    contract: "12 sep 2023 — 12 sep 2025",
    status: "Verloopt binnenkort",
  },
  {
    id: "C-1028",
    name: "Eva Mulder",
    spot: "—",
    contract: "Wachtlijst",
    status: "Wachtlijst",
  },
  {
    id: "C-1029",
    name: "Jeroen Dekker",
    spot: "B-15",
    contract: "5 mei 2024 — 5 mei 2026",
    status: "Actief",
  },
];

const SPOTS = [
  { code: "A-01", type: "Buiten · groot", customer: "Lotte Smit", since: "2024" },
  { code: "A-02", type: "Buiten · groot", customer: "Bram de Jong", since: "2023" },
  { code: "A-03", type: "Buiten · groot", customer: "Sophie Bakker", since: "2025" },
  { code: "A-04", type: "Buiten · klein", customer: null, since: "—" },
  { code: "B-08", type: "Loods", customer: "Marc Janssen", since: "2024" },
  { code: "B-12", type: "Loods", customer: "Anna de Vries", since: "2024" },
  { code: "B-15", type: "Loods", customer: "Jeroen Dekker", since: "2024" },
  { code: "C-22", type: "Stalling +", customer: "Pieter van Dam", since: "2023" },
];

const INVOICES = [
  { number: "F-2026-0142", customer: "Anna de Vries", amount: 850, status: "Betaald" },
  { number: "F-2026-0141", customer: "Marc Janssen", amount: 720, status: "Betaald" },
  { number: "F-2026-0140", customer: "Sophie Bakker", amount: 950, status: "Open" },
  {
    number: "F-2026-0139",
    customer: "Pieter van Dam",
    amount: 1100,
    status: "Verlopen",
  },
  { number: "F-2026-0138", customer: "Lotte Smit", amount: 850, status: "Betaald" },
];

export function StallingDemo() {
  return (
    <DemoShell
      brandName="Costa Storage"
      brandSub="Studio admin · stalling"
      accentColor="#1e3a4a"
      views={[
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "klanten", label: "Klanten", icon: Users, badge: 6 },
        { id: "plekken", label: "Plekken", icon: Warehouse },
        { id: "agenda", label: "Agenda", icon: Calendar },
        { id: "facturen", label: "Facturen", icon: Receipt, badge: 2 },
      ]}
    >
      {(view) => {
        if (view === "dashboard") {
          return (
            <div className="space-y-6">
              <div>
                <p className="font-mono text-[11px] tracking-widest text-(--color-muted) uppercase">
                  Vandaag · 14 mei
                </p>
                <h1 className="mt-1 text-2xl text-(--color-text)">Goedemorgen Carlos</h1>
                <p className="mt-1 text-[14px] text-(--color-muted)">
                  3 contracten verlopen deze maand · 2 facturen verlopen · 1 nieuwe aanvraag op de
                  wachtlijst
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <StatCard label="Actieve klanten" value="142" hint="+3 deze maand" />
                <StatCard label="Bezetting" value="92%" hint="11 plekken vrij" />
                <StatCard label="Open facturen" value="€ 2.870" hint="2 verlopen" />
                <StatCard label="Wachtlijst" value="8" hint="oudste 4 mnd" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-card border border-(--color-border) bg-(--color-surface) p-5">
                  <p className="font-mono text-[11px] tracking-widest text-(--color-muted) uppercase">
                    Contracten verlopen
                  </p>
                  <ul className="mt-3 space-y-2.5 text-[13.5px]">
                    <li className="flex items-center justify-between">
                      <span>Pieter van Dam · C-22</span>
                      <StatusBadge variant="warning">12 sep 2025</StatusBadge>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Iris Vermeulen · A-09</span>
                      <StatusBadge variant="warning">28 sep 2025</StatusBadge>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>Tim Hendriks · B-04</span>
                      <StatusBadge variant="warning">14 okt 2025</StatusBadge>
                    </li>
                  </ul>
                </div>

                <div className="rounded-card border border-(--color-border) bg-(--color-surface) p-5">
                  <p className="font-mono text-[11px] tracking-widest text-(--color-muted) uppercase">
                    Recente activiteit
                  </p>
                  <ul className="mt-3 space-y-2.5 text-[13.5px] text-(--color-text)">
                    <li>
                      <span className="font-medium">Sophie Bakker</span>{" "}
                      <span className="text-(--color-muted)">· factuur F-2026-0140 verstuurd</span>
                    </li>
                    <li>
                      <span className="font-medium">Marc Janssen</span>{" "}
                      <span className="text-(--color-muted)">· stalde caravan in B-08</span>
                    </li>
                    <li>
                      <span className="font-medium">Eva Mulder</span>{" "}
                      <span className="text-(--color-muted)">· toegevoegd aan wachtlijst</span>
                    </li>
                    <li>
                      <span className="font-medium">Anna de Vries</span>{" "}
                      <span className="text-(--color-muted)">· contract verlengd tot 2026</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          );
        }

        if (view === "klanten") {
          return (
            <div className="space-y-5">
              <div className="flex items-end justify-between">
                <div>
                  <h1 className="text-2xl text-(--color-text)">Klanten</h1>
                  <p className="mt-1 text-[14px] text-(--color-muted)">
                    {CUSTOMERS.length} klanten · zoek op naam, plek of klant-ID
                  </p>
                </div>
                <button className="rounded-full bg-(--color-accent) px-4 py-2 text-[13px] font-medium text-white">
                  + Nieuwe klant
                </button>
              </div>
              <DemoTable
                headers={["ID", "Naam", "Plek", "Contract", "Status"]}
                rows={CUSTOMERS}
                render={(c) => [
                  <span key="id" className="font-mono text-[12px] text-(--color-muted)">
                    {c.id}
                  </span>,
                  <span key="name" className="font-medium">
                    {c.name}
                  </span>,
                  c.spot,
                  <span key="ct" className="text-[12px] text-(--color-muted)">
                    {c.contract}
                  </span>,
                  <StatusBadge
                    key="st"
                    variant={
                      c.status === "Actief"
                        ? "success"
                        : c.status === "Wachtlijst"
                          ? "neutral"
                          : "warning"
                    }
                  >
                    {c.status}
                  </StatusBadge>,
                ]}
              />
            </div>
          );
        }

        if (view === "plekken") {
          return (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl text-(--color-text)">Plekken-overzicht</h1>
                <p className="mt-1 text-[14px] text-(--color-muted)">
                  154 plekken totaal · 142 bezet · 12 vrij
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                <StatCard label="Buiten groot" value="48 / 50" />
                <StatCard label="Buiten klein" value="32 / 36" />
                <StatCard label="Loods" value="44 / 48" />
              </div>

              <DemoTable
                headers={["Plek", "Type", "Klant", "Sinds"]}
                rows={SPOTS}
                render={(s) => [
                  <span key="c" className="font-mono text-[12px]">
                    {s.code}
                  </span>,
                  <span key="t" className="text-[13px] text-(--color-muted)">
                    {s.type}
                  </span>,
                  s.customer ?? (
                    <StatusBadge variant="success" key="empty">
                      Vrij
                    </StatusBadge>
                  ),
                  <span key="d" className="text-[12px] text-(--color-muted)">
                    {s.since}
                  </span>,
                ]}
              />
            </div>
          );
        }

        if (view === "agenda") {
          return (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl text-(--color-text)">Agenda</h1>
                <p className="mt-1 text-[14px] text-(--color-muted)">
                  Komende ophalingen, wegbrengen en inspecties
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    date: "do 16 mei",
                    items: [
                      { time: "09:30", what: "Anna de Vries · ophalen B-12 voor onderhoud" },
                      { time: "11:00", what: "Sophie Bakker · inspectie A-03" },
                    ],
                  },
                  {
                    date: "vr 17 mei",
                    items: [
                      { time: "10:00", what: "Marc Janssen · terugplaatsen B-08" },
                      { time: "14:30", what: "Bram de Jong · jaarlijkse inspectie A-02" },
                    ],
                  },
                  {
                    date: "ma 20 mei",
                    items: [
                      { time: "09:00", what: "Lotte Smit · contractbespreking" },
                      { time: "13:00", what: "Pieter van Dam · contractverlenging C-22" },
                    ],
                  },
                ].map((day) => (
                  <div
                    key={day.date}
                    className="rounded-card border border-(--color-border) bg-(--color-surface) p-4"
                  >
                    <p className="font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
                      {day.date}
                    </p>
                    <ul className="mt-2 space-y-1.5 text-[13.5px]">
                      {day.items.map((it) => (
                        <li key={it.time} className="flex gap-3">
                          <span className="w-12 shrink-0 font-mono text-[12px] text-(--color-accent)">
                            {it.time}
                          </span>
                          <span className="text-(--color-text)">{it.what}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // facturen
        return (
          <div className="space-y-5">
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-2xl text-(--color-text)">Facturen</h1>
                <p className="mt-1 text-[14px] text-(--color-muted)">
                  Mei 2026 · € 12.420 omzet · 2 verlopen
                </p>
              </div>
              <button className="rounded-full bg-(--color-accent) px-4 py-2 text-[13px] font-medium text-white">
                + Nieuwe factuur
              </button>
            </div>

            <DemoTable
              headers={["Nummer", "Klant", "Bedrag", "Status"]}
              rows={INVOICES}
              render={(inv) => [
                <span key="n" className="font-mono text-[12px]">
                  {inv.number}
                </span>,
                inv.customer,
                <span key="a" className="font-medium">
                  € {inv.amount.toLocaleString("nl-NL")}
                </span>,
                <StatusBadge
                  key="s"
                  variant={
                    inv.status === "Betaald"
                      ? "success"
                      : inv.status === "Verlopen"
                        ? "danger"
                        : "warning"
                  }
                >
                  {inv.status}
                </StatusBadge>,
              ]}
            />
          </div>
        );
      }}
    </DemoShell>
  );
}
