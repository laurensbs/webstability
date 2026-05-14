"use client";

import * as React from "react";
import { motion } from "motion/react";
import { Globe, ShoppingBag, KeyRound, Wrench, Users, Settings } from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Pre-step op /aanvragen: bezoeker kiest één van zes diensten.
 *
 * - website / webshop → opent de bestaande ProjectConfigurator (vaste-prijs
 *   richt-budget in 4 weken). Deze twee hebben een prijsmodel dat in een
 *   formulier past.
 * - verhuur / klantportaal / reparatie / admin → opent een eenvoudig
 *   intake-formulier (CustomServiceIntake). Maatwerk-trajecten: een
 *   richtprijs uit een formulier helpt niemand, dus we vragen kort waar
 *   het om gaat en plannen daarna een gesprek.
 *
 * Welke vorm getoond wordt is aan de parent — deze component meldt alleen
 * de keuze via onPick.
 */

export type ServiceKind =
  | "website"
  | "webshop"
  | "verhuur"
  | "klantportaal"
  | "reparatie"
  | "admin";

export type ServicePickerStrings = {
  eyebrow: string;
  title: string;
  lede: string;
  configFlowEyebrow: string; // boven website+webshop blok
  customFlowEyebrow: string; // boven de 4 maatwerk-diensten
  options: Record<ServiceKind, { label: string; body: string }>;
};

const ICONS: Record<ServiceKind, LucideIcon> = {
  website: Globe,
  webshop: ShoppingBag,
  verhuur: KeyRound,
  klantportaal: Users,
  reparatie: Wrench,
  admin: Settings,
};

// Welke flow elke service opent. Configurable houdt de bestaande
// ProjectConfigurator; custom routes naar het intake-formulier.
const FLOW: Record<ServiceKind, "configurable" | "custom"> = {
  website: "configurable",
  webshop: "configurable",
  verhuur: "custom",
  klantportaal: "custom",
  reparatie: "custom",
  admin: "custom",
};

const CONFIGURABLE: ServiceKind[] = ["website", "webshop"];
const CUSTOM: ServiceKind[] = ["verhuur", "klantportaal", "reparatie", "admin"];

export function ServicePicker({
  strings,
  onPick,
}: {
  strings: ServicePickerStrings;
  onPick: (kind: ServiceKind, flow: "configurable" | "custom") => void;
}) {
  return (
    <div className="space-y-10">
      {/* Configurable verticals — vaste-prijs */}
      <div>
        <p className="font-mono text-[11px] tracking-widest text-(--color-accent) uppercase">
          {strings.configFlowEyebrow}
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {CONFIGURABLE.map((kind, i) => (
            <ServiceCard
              key={kind}
              kind={kind}
              strings={strings.options[kind]}
              flow="configurable"
              index={i}
              onPick={onPick}
            />
          ))}
        </div>
      </div>

      {/* Custom verticals — maatwerk via intake + gesprek */}
      <div>
        <p className="font-mono text-[11px] tracking-widest text-(--color-wine) uppercase">
          {strings.customFlowEyebrow}
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CUSTOM.map((kind, i) => (
            <ServiceCard
              key={kind}
              kind={kind}
              strings={strings.options[kind]}
              flow="custom"
              index={i + 2}
              onPick={onPick}
              compact
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ServiceCard({
  kind,
  strings,
  flow,
  index,
  onPick,
  compact = false,
}: {
  kind: ServiceKind;
  strings: { label: string; body: string };
  flow: "configurable" | "custom";
  index: number;
  onPick: (kind: ServiceKind, flow: "configurable" | "custom") => void;
  compact?: boolean;
}) {
  const Icon = ICONS[kind];
  const isCustom = flow === "custom";
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 + index * 0.04, duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3 }}
      onClick={() => onPick(kind, flow)}
      className={`rounded-modal group flex flex-col items-start gap-3 border border-t-2 border-(--color-border) text-left transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--color-accent) ${
        isCustom
          ? "border-t-(--color-wine) bg-(--color-bg-warm)/40 p-5 hover:bg-(--color-wine)/5"
          : "border-t-(--color-accent) bg-(--color-surface) p-6 hover:bg-(--color-accent-soft)/30"
      }`}
    >
      <span
        className={`inline-flex items-center justify-center rounded-full ${
          isCustom
            ? "h-9 w-9 bg-(--color-wine)/10 text-(--color-wine)"
            : "h-11 w-11 bg-(--color-accent)/10 text-(--color-accent)"
        }`}
      >
        <Icon className={isCustom ? "h-4 w-4" : "h-5 w-5"} />
      </span>
      <p className={`font-medium text-(--color-text) ${compact ? "text-[14.5px]" : "text-[17px]"}`}>
        {strings.label}
      </p>
      <p
        className={`text-(--color-muted) ${compact ? "text-[12.5px] leading-snug" : "text-[14px] leading-snug"}`}
      >
        {strings.body}
      </p>
    </motion.button>
  );
}
