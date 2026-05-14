"use client";

import * as React from "react";
import { motion } from "motion/react";
import { CalendarClock, LayoutDashboard, Wrench, LayoutGrid } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Pre-step op /aanvragen: bezoeker kiest één van vier panelen.
 *
 * Alle vier de panelen (verhuur, klantportaal, reparatie, admin) worden
 * als abonnement aangeboden — vaste maandprijs, geen losse projectkosten.
 * Na keuze opent CustomServiceIntake voor een korte intake + Cal-popup.
 *
 * Het oude website/webshop pad is verwijderd: die diensten bieden we
 * niet meer aan. Volledige positionering ligt nu op complete panelen
 * op abonnement.
 */

export type ServiceKind = "verhuur" | "klantportaal" | "reparatie" | "admin";

export type ServicePickerStrings = {
  eyebrow: string;
  title: string;
  lede: string;
  /** Header boven de paneelkaarten — vaak iets als "Vier panelen op abonnement". */
  panelsEyebrow: string;
  options: Record<ServiceKind, { label: string; body: string; price: string }>;
};

const ICONS: Record<ServiceKind, LucideIcon> = {
  verhuur: CalendarClock,
  klantportaal: LayoutDashboard,
  reparatie: Wrench,
  admin: LayoutGrid,
};

const PANELS: ServiceKind[] = ["verhuur", "klantportaal", "reparatie", "admin"];

export function ServicePicker({
  strings,
  onPick,
}: {
  strings: ServicePickerStrings;
  onPick: (kind: ServiceKind) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <p className="font-mono text-[11px] tracking-widest text-(--color-wine) uppercase">
          {strings.panelsEyebrow}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {PANELS.map((kind, i) => (
          <ServiceCard
            key={kind}
            kind={kind}
            strings={strings.options[kind]}
            index={i}
            onPick={onPick}
          />
        ))}
      </div>
    </div>
  );
}

function ServiceCard({
  kind,
  strings,
  index,
  onPick,
}: {
  kind: ServiceKind;
  strings: { label: string; body: string; price: string };
  index: number;
  onPick: (kind: ServiceKind) => void;
}) {
  const Icon = ICONS[kind];
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 + index * 0.04, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      onClick={() => onPick(kind)}
      className="rounded-modal group flex flex-col items-start gap-3 border border-t-2 border-(--color-border) border-t-(--color-wine) bg-(--color-surface) p-6 text-left transition-shadow hover:bg-(--color-wine)/5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent)"
    >
      <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-(--color-wine)/10 text-(--color-wine)">
        <Icon className="h-5 w-5" />
      </span>
      <div className="flex w-full items-baseline justify-between gap-3">
        <p className="text-[17px] font-medium text-(--color-text)">{strings.label}</p>
        <p className="font-mono text-[11px] tracking-widest whitespace-nowrap text-(--color-wine) uppercase">
          {strings.price}
        </p>
      </div>
      <p className="text-[14px] leading-snug text-(--color-muted)">{strings.body}</p>
    </motion.button>
  );
}
