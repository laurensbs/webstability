"use client";

import { LayoutDashboard, CalendarDays, Caravan, CreditCard } from "lucide-react";
import { DemoShell, StatCard, DemoTable, StatusBadge } from "./DemoShell";

const BOOKINGS = [
  {
    ref: "B-2026-0142",
    guest: "Familie Visser",
    caravan: "Hobby Premium 660",
    period: "18-25 mei",
    nights: 7,
    amount: 945,
    status: "Bevestigd",
  },
  {
    ref: "B-2026-0141",
    guest: "Karen + Marc",
    caravan: "Adria Adora 613",
    period: "18-22 mei",
    nights: 4,
    amount: 520,
    status: "Aanbetaald",
  },
  {
    ref: "B-2026-0140",
    guest: "Familie Smit",
    caravan: "Knaus Sport 540",
    period: "20-30 mei",
    nights: 10,
    amount: 1340,
    status: "Bevestigd",
  },
  {
    ref: "B-2026-0139",
    guest: "Pieter de Boer",
    caravan: "Hobby Premium 660",
    period: "10-13 mei",
    nights: 3,
    amount: 405,
    status: "Verleden",
  },
  {
    ref: "B-2026-0138",
    guest: "Familie Bakker",
    caravan: "LMC Style 470",
    period: "25 mei - 8 jun",
    nights: 14,
    amount: 1820,
    status: "Aanbetaald",
  },
  {
    ref: "B-2026-0137",
    guest: "Eva Janssen",
    caravan: "Adria Adora 613",
    period: "1-8 jun",
    nights: 7,
    amount: 875,
    status: "Bevestigd",
  },
];

const CARAVANS = [
  { id: "C-01", name: "Hobby Premium 660", spots: 6, status: "Verhuurd t/m 25 mei" },
  { id: "C-02", name: "Adria Adora 613", spots: 4, status: "Verhuurd t/m 22 mei" },
  { id: "C-03", name: "Knaus Sport 540", spots: 4, status: "Verhuurd t/m 30 mei" },
  { id: "C-04", name: "LMC Style 470", spots: 4, status: "Verhuurd t/m 8 jun" },
  { id: "C-05", name: "Tabbert Da Vinci 550", spots: 4, status: "Beschikbaar" },
  { id: "C-06", name: "Fendt Bianco 515", spots: 4, status: "In onderhoud" },
];

export function VerhuurDemo() {
  return (
    <DemoShell
      portalHref="/demo/verhuur/portaal"
      brandName="Caravan Costa Brava"
      brandSub="Verhuur admin"
      accentColor="#1f4e3d"
      views={[
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "boekingen", label: "Boekingen", icon: CalendarDays, badge: 6 },
        { id: "vloot", label: "Vloot", icon: Caravan },
        { id: "betalingen", label: "Betalingen", icon: CreditCard, badge: 2 },
      ]}
    >
      {(view) => {
        if (view === "dashboard") {
          return (
            <div className="space-y-6">
              <div>
                <p className="font-mono text-[11px] tracking-widest text-(--color-muted) uppercase">
                  Week 20 · 14 mei
                </p>
                <h1 className="mt-1 text-2xl text-(--color-text)">Bezetting deze week</h1>
                <p className="mt-1 text-[14px] text-(--color-muted)">
                  4 van 6 caravans verhuurd · 2 nieuwe boekingen vandaag · €820 aanbetalingen in
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <StatCard label="Bezetting mei" value="78%" hint="+12% vs. vorig jaar" />
                <StatCard label="Boekingen open" value="6" hint="2 starten deze week" />
                <StatCard label="Omzet maand" value="€ 9.430" hint="van € 14k begroting" />
                <StatCard label="Aanbetaling open" value="€ 1.640" hint="2 boekingen" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-card border border-(--color-border) bg-(--color-surface) p-5">
                  <p className="font-mono text-[11px] tracking-widest text-(--color-muted) uppercase">
                    Aankomsten deze week
                  </p>
                  <ul className="mt-3 space-y-2.5 text-[13.5px]">
                    <li className="flex items-center justify-between">
                      <span>
                        <span className="font-medium">Familie Visser</span> · Hobby Premium 660
                      </span>
                      <span className="text-(--color-muted)">za 18 mei</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>
                        <span className="font-medium">Karen + Marc</span> · Adria Adora 613
                      </span>
                      <span className="text-(--color-muted)">za 18 mei</span>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>
                        <span className="font-medium">Familie Smit</span> · Knaus Sport 540
                      </span>
                      <span className="text-(--color-muted)">ma 20 mei</span>
                    </li>
                  </ul>
                </div>

                <div className="rounded-card border border-(--color-border) bg-(--color-surface) p-5">
                  <p className="font-mono text-[11px] tracking-widest text-(--color-muted) uppercase">
                    Reviews binnen
                  </p>
                  <ul className="mt-3 space-y-3 text-[13.5px] text-(--color-text)">
                    <li>
                      <p className="text-(--color-accent)">★★★★★</p>
                      <p className="mt-0.5 italic">
                        &ldquo;Top weekend gehad! Caravan was perfect schoon, alles werkte
                        goed.&rdquo;
                      </p>
                      <p className="mt-1 text-[11px] text-(--color-muted)">
                        Pieter de Boer · gisteren
                      </p>
                    </li>
                    <li>
                      <p className="text-(--color-accent)">★★★★★</p>
                      <p className="mt-0.5 italic">
                        &ldquo;Heerlijke vakantie. Aanrader voor families.&rdquo;
                      </p>
                      <p className="mt-1 text-[11px] text-(--color-muted)">
                        Femke Bos · 3 dagen geleden
                      </p>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          );
        }

        if (view === "boekingen") {
          return (
            <div className="space-y-5">
              <div className="flex items-end justify-between">
                <div>
                  <h1 className="text-2xl text-(--color-text)">Boekingen</h1>
                  <p className="mt-1 text-[14px] text-(--color-muted)">
                    Open en aankomende boekingen · sortering op datum
                  </p>
                </div>
                <button className="rounded-full bg-(--color-accent) px-4 py-2 text-[13px] font-medium text-white">
                  + Boeking
                </button>
              </div>
              <DemoTable
                headers={["Ref", "Gast", "Caravan", "Periode", "Bedrag", "Status"]}
                rows={BOOKINGS}
                render={(b) => [
                  <span key="r" className="font-mono text-[12px]">
                    {b.ref}
                  </span>,
                  <span key="g" className="font-medium">
                    {b.guest}
                  </span>,
                  <span key="c" className="text-[12.5px] text-(--color-muted)">
                    {b.caravan}
                  </span>,
                  <span key="p" className="text-[12.5px]">
                    {b.period} <span className="text-(--color-muted)">· {b.nights}n</span>
                  </span>,
                  <span key="a" className="font-medium">
                    € {b.amount.toLocaleString("nl-NL")}
                  </span>,
                  <StatusBadge
                    key="s"
                    variant={
                      b.status === "Bevestigd"
                        ? "success"
                        : b.status === "Aanbetaald"
                          ? "warning"
                          : "neutral"
                    }
                  >
                    {b.status}
                  </StatusBadge>,
                ]}
              />
            </div>
          );
        }

        if (view === "vloot") {
          return (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl text-(--color-text)">Vloot</h1>
                <p className="mt-1 text-[14px] text-(--color-muted)">
                  6 caravans · 4 verhuurd · 1 beschikbaar · 1 onderhoud
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {CARAVANS.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-card border border-(--color-border) bg-(--color-surface) p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
                          {c.id}
                        </p>
                        <p className="mt-1 text-[15px] font-medium text-(--color-text)">{c.name}</p>
                        <p className="mt-0.5 text-[11.5px] text-(--color-muted)">
                          {c.spots} slaapplaatsen
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <StatusBadge
                        variant={
                          c.status === "Beschikbaar"
                            ? "success"
                            : c.status === "In onderhoud"
                              ? "warning"
                              : "neutral"
                        }
                      >
                        {c.status}
                      </StatusBadge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // betalingen
        return (
          <div className="space-y-5">
            <div>
              <h1 className="text-2xl text-(--color-text)">Betalingen</h1>
              <p className="mt-1 text-[14px] text-(--color-muted)">
                iDEAL + bankoverschrijvingen · automatisch gekoppeld aan boekingen
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              <StatCard label="Binnen mei" value="€ 4.820" />
              <StatCard label="Aanbetaling open" value="€ 1.640" hint="2 boekingen" />
              <StatCard label="Restbetaling open" value="€ 2.970" hint="bij aankomst" />
            </div>

            <DemoTable
              headers={["Boeking", "Gast", "Bedrag", "Status"]}
              rows={BOOKINGS.filter((b) => b.status !== "Verleden")}
              render={(b) => [
                <span key="r" className="font-mono text-[12px]">
                  {b.ref}
                </span>,
                <span key="g">{b.guest}</span>,
                <span key="a" className="font-medium">
                  € {b.amount.toLocaleString("nl-NL")}
                </span>,
                <StatusBadge
                  key="s"
                  variant={
                    b.status === "Bevestigd"
                      ? "success"
                      : b.status === "Aanbetaald"
                        ? "warning"
                        : "neutral"
                  }
                >
                  {b.status === "Bevestigd" ? "Volledig" : "30% aanbetaling"}
                </StatusBadge>,
              ]}
            />
          </div>
        );
      }}
    </DemoShell>
  );
}
