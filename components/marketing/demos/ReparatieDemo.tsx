"use client";

import { LayoutDashboard, Wrench, Tablet, Package } from "lucide-react";
import { DemoShell, StatCard, DemoTable, StatusBadge } from "./DemoShell";

const ORDERS = [
  {
    nr: "WO-1429",
    customer: "Anna de Vries",
    vehicle: "Hobby De Luxe 540 UFf",
    issue: "Lekkage bij dakraam",
    status: "In behandeling",
    monteur: "Pedro",
  },
  {
    nr: "WO-1428",
    customer: "Marc Janssen",
    vehicle: "Knaus Sport 540 FDK",
    issue: "Boiler doet het niet",
    status: "Wacht op onderdelen",
    monteur: "Diego",
  },
  {
    nr: "WO-1427",
    customer: "Sophie Bakker",
    vehicle: "Adria Aviva 522 PT",
    issue: "Jaarlijkse onderhoudsbeurt",
    status: "Klaar",
    monteur: "Pedro",
  },
  {
    nr: "WO-1426",
    customer: "Pieter van Dam",
    vehicle: "Tabbert Da Vinci 550",
    issue: "Bandenwissel + remmen",
    status: "In behandeling",
    monteur: "Diego",
  },
  {
    nr: "WO-1425",
    customer: "Eva Mulder",
    vehicle: "Fendt Bianco 515",
    issue: "Inspectie elektra",
    status: "Klaar",
    monteur: "Pedro",
  },
  {
    nr: "WO-1424",
    customer: "Lotte Smit",
    vehicle: "LMC Style 470",
    issue: "Voortent reparatie",
    status: "Wacht op klant",
    monteur: "Diego",
  },
];

const PARTS = [
  { code: "P-201", name: "Truma boiler 14L", supplier: "Camperonderdelen Spanje", stock: 2 },
  { code: "P-188", name: "Dakraam 40x40 cm", supplier: "Caravan Parts NL", stock: 5 },
  {
    code: "P-302",
    name: 'Bandenset 14" complete',
    supplier: "Camperonderdelen Spanje",
    stock: 8,
  },
  { code: "P-441", name: "Voortent rits zwart", supplier: "Tentdeals", stock: 12 },
  { code: "P-507", name: "Remblok-set", supplier: "Caravan Parts NL", stock: 4 },
];

export function ReparatieDemo() {
  return (
    <DemoShell
      brandName="Reparatie Spanje"
      brandSub="Werkplaats kantoor"
      accentColor="#3a2820"
      views={[
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "werkbonnen", label: "Werkbonnen", icon: Wrench, badge: 6 },
        { id: "ipad", label: "iPad-flow", icon: Tablet },
        { id: "voorraad", label: "Voorraad", icon: Package },
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
                <h1 className="mt-1 text-2xl text-(--color-text)">Werkplaats overzicht</h1>
                <p className="mt-1 text-[14px] text-(--color-muted)">
                  6 werkbonnen open · 2 wachten op onderdelen · Pedro en Diego in dienst
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <StatCard label="Open werkbonnen" value="6" hint="2 wacht op onderdelen" />
                <StatCard label="Klaar deze week" value="14" hint="+3 vs. vorige week" />
                <StatCard label="Doorlooptijd" value="3,2 dg" hint="gemiddeld" />
                <StatCard label="Omzet mei" value="€ 8.420" hint="64% van begroting" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-card border border-(--color-border) bg-(--color-surface) p-5">
                  <p className="font-mono text-[11px] tracking-widest text-(--color-muted) uppercase">
                    Vandaag in de werkplaats
                  </p>
                  <ul className="mt-3 space-y-2.5 text-[13.5px] text-(--color-text)">
                    <li>
                      <span className="font-medium">Pedro</span> · WO-1429 · Anna de Vries · lekkage
                    </li>
                    <li>
                      <span className="font-medium">Pedro</span> · WO-1425 · Eva Mulder · elektra
                    </li>
                    <li>
                      <span className="font-medium">Diego</span> · WO-1426 · Pieter van Dam · banden
                    </li>
                  </ul>
                </div>

                <div className="rounded-card border border-(--color-border) bg-(--color-surface) p-5">
                  <p className="font-mono text-[11px] tracking-widest text-(--color-muted) uppercase">
                    Wacht op…
                  </p>
                  <ul className="mt-3 space-y-2.5 text-[13.5px]">
                    <li className="flex items-center justify-between">
                      <span>WO-1428 · boiler</span>
                      <StatusBadge variant="warning">Onderdelen</StatusBadge>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>WO-1424 · voortent</span>
                      <StatusBadge variant="warning">Klant akkoord</StatusBadge>
                    </li>
                    <li className="flex items-center justify-between">
                      <span>WO-1421 · dakraam</span>
                      <StatusBadge variant="warning">Onderdelen</StatusBadge>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          );
        }

        if (view === "werkbonnen") {
          return (
            <div className="space-y-5">
              <div className="flex items-end justify-between">
                <div>
                  <h1 className="text-2xl text-(--color-text)">Werkbonnen</h1>
                  <p className="mt-1 text-[14px] text-(--color-muted)">
                    {ORDERS.length} actieve werkbonnen · filter op status of monteur
                  </p>
                </div>
                <button className="rounded-full bg-(--color-accent) px-4 py-2 text-[13px] font-medium text-white">
                  + Nieuwe werkbon
                </button>
              </div>
              <DemoTable
                headers={["Nr", "Klant", "Voertuig", "Status", "Monteur"]}
                rows={ORDERS}
                render={(o) => [
                  <span key="n" className="font-mono text-[12px]">
                    {o.nr}
                  </span>,
                  <div key="c">
                    <p className="font-medium">{o.customer}</p>
                    <p className="text-[11px] text-(--color-muted)">{o.issue}</p>
                  </div>,
                  <span key="v" className="text-[12.5px] text-(--color-muted)">
                    {o.vehicle}
                  </span>,
                  <StatusBadge
                    key="s"
                    variant={
                      o.status === "Klaar"
                        ? "success"
                        : o.status === "In behandeling"
                          ? "neutral"
                          : "warning"
                    }
                  >
                    {o.status}
                  </StatusBadge>,
                  o.monteur,
                ]}
              />
            </div>
          );
        }

        if (view === "ipad") {
          return (
            <div className="space-y-5">
              <div>
                <h1 className="text-2xl text-(--color-text)">iPad-flow · werkplaats</h1>
                <p className="mt-1 text-[14px] text-(--color-muted)">
                  Wat de monteurs op de tablet zien — gefilterd op &quot;mijn werkbonnen
                  vandaag&quot;.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {ORDERS.filter((o) => o.status === "In behandeling").map((o) => (
                  <div
                    key={o.nr}
                    className="rounded-card border border-(--color-border) bg-(--color-surface) p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-[11px] tracking-widest text-(--color-accent) uppercase">
                          {o.nr}
                        </p>
                        <p className="mt-1 text-[16px] font-medium text-(--color-text)">
                          {o.customer}
                        </p>
                        <p className="text-[12.5px] text-(--color-muted)">{o.vehicle}</p>
                      </div>
                      <StatusBadge variant="neutral">{o.monteur}</StatusBadge>
                    </div>
                    <p className="mt-4 rounded-md bg-(--color-bg) p-3 text-[13px] text-(--color-text)">
                      {o.issue}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button className="flex-1 rounded-md bg-emerald-600 py-2 text-[12px] font-medium text-white">
                        Markeren als klaar
                      </button>
                      <button className="rounded-md border border-(--color-border) px-3 py-2 text-[12px]">
                        Foto&apos;s
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        // voorraad
        return (
          <div className="space-y-5">
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-2xl text-(--color-text)">Voorraad</h1>
                <p className="mt-1 text-[14px] text-(--color-muted)">
                  Onderdelen die we op voorraad houden voor de werkplaats
                </p>
              </div>
              <button className="rounded-full bg-(--color-accent) px-4 py-2 text-[13px] font-medium text-white">
                + Onderdeel
              </button>
            </div>
            <DemoTable
              headers={["Code", "Onderdeel", "Leverancier", "Voorraad"]}
              rows={PARTS}
              render={(p) => [
                <span key="c" className="font-mono text-[12px]">
                  {p.code}
                </span>,
                <span key="n" className="font-medium">
                  {p.name}
                </span>,
                <span key="s" className="text-[12px] text-(--color-muted)">
                  {p.supplier}
                </span>,
                p.stock < 3 ? (
                  <StatusBadge key="st" variant="warning">
                    Laag · {p.stock}
                  </StatusBadge>
                ) : (
                  <span key="st">{p.stock}</span>
                ),
              ]}
            />
          </div>
        );
      }}
    </DemoShell>
  );
}
