"use client";

import * as React from "react";
import { Caravan, Wrench, MoreHorizontal } from "lucide-react";

type Ctx = "verhuur" | "reparatie" | "other";

/**
 * Lichte intake-routing boven de Cal-embed. Drie knoppen — verhuur,
 * reparatie of anders. Klik zet `?ctx=` in de URL zodat ik in de eerste
 * 30 seconden van het gesprek al weet welke rekenwijze ik aanga. Geen
 * formulier, geen DB-werk. Persistente keuze via URL zodat een refresh
 * 'm onthoudt en mensen 'm met een link kunnen delen.
 */
export function ContactIntakeSelector({
  strings,
}: {
  strings: {
    title: string;
    options: { verhuur: string; reparatie: string; other: string };
  };
}) {
  const [active, setActive] = React.useState<Ctx | null>(() => {
    if (typeof window === "undefined") return null;
    const ctx = new URLSearchParams(window.location.search).get("ctx");
    return ctx === "verhuur" || ctx === "reparatie" || ctx === "other" ? ctx : null;
  });

  const pick = (next: Ctx) => {
    setActive(next);
    const url = new URL(window.location.href);
    url.searchParams.set("ctx", next);
    window.history.replaceState(null, "", url.toString());
  };

  const opts: Array<{ id: Ctx; icon: React.ElementType; label: string }> = [
    { id: "verhuur", icon: Caravan, label: strings.options.verhuur },
    { id: "reparatie", icon: Wrench, label: strings.options.reparatie },
    { id: "other", icon: MoreHorizontal, label: strings.options.other },
  ];

  return (
    <div className="rounded-panel border border-(--color-border) bg-(--color-surface) p-5">
      <p className="mb-4 font-mono text-[11px] tracking-widest text-(--color-muted) uppercase">
        {strings.title}
      </p>
      <div className="grid gap-2 sm:grid-cols-3">
        {opts.map(({ id, icon: Icon, label }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => pick(id)}
              className={`flex items-center gap-2.5 rounded-full border px-4 py-2.5 text-left text-[13px] transition-all duration-200 ${
                isActive
                  ? "shadow-glow border-(--color-accent) bg-(--color-accent) text-white"
                  : "border-(--color-border) bg-(--color-bg-warm) text-(--color-text) hover:border-(--color-accent)/50 hover:bg-(--color-accent-soft)/40"
              }`}
              aria-pressed={isActive}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
              <span className="font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
