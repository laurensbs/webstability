"use client";

import * as React from "react";
import {
  Bug,
  Sparkles,
  HelpCircle,
  PencilLine,
  ArrowUpCircle,
  type LucideIcon,
} from "lucide-react";

export type TicketCategoryId = "bug" | "feature" | "question" | "change" | "upgrade";

type Strings = {
  bugLabel: string;
  bugBody: string;
  featureLabel: string;
  featureBody: string;
  questionLabel: string;
  questionBody: string;
  changeLabel: string;
  changeBody: string;
  upgradeLabel: string;
  upgradeBody: string;
};

const META: Record<
  TicketCategoryId,
  { icon: LucideIcon; border: string; bg: string; text: string }
> = {
  change: {
    icon: PencilLine,
    border: "border-(--color-accent)",
    bg: "bg-(--color-accent)/5",
    text: "text-(--color-accent)",
  },
  bug: {
    icon: Bug,
    border: "border-(--color-wine)",
    bg: "bg-(--color-wine)/5",
    text: "text-(--color-wine)",
  },
  feature: {
    icon: Sparkles,
    border: "border-(--color-accent)",
    bg: "bg-(--color-accent)/5",
    text: "text-(--color-accent)",
  },
  upgrade: {
    icon: ArrowUpCircle,
    border: "border-(--color-wine)",
    bg: "bg-(--color-wine)/5",
    text: "text-(--color-wine)",
  },
  question: {
    icon: HelpCircle,
    border: "border-(--color-teal)",
    bg: "bg-(--color-teal)/5",
    text: "text-(--color-teal)",
  },
};

function labelFor(id: TicketCategoryId, s: Strings): string {
  return {
    bug: s.bugLabel,
    feature: s.featureLabel,
    question: s.questionLabel,
    change: s.changeLabel,
    upgrade: s.upgradeLabel,
  }[id];
}
function bodyFor(id: TicketCategoryId, s: Strings): string {
  return {
    bug: s.bugBody,
    feature: s.featureBody,
    question: s.questionBody,
    change: s.changeBody,
    upgrade: s.upgradeBody,
  }[id];
}

/**
 * Category-picker voor /portal/tickets/new. Volgorde zet "wijziging"
 * vooraan — voor website-abonnement-klanten de meest voorkomende
 * aanvraag. Het server-side form leest `category` uit de hidden input.
 */
export function TicketCategoryPicker({
  strings,
  defaultCategory = "question",
}: {
  strings: Strings;
  defaultCategory?: TicketCategoryId;
}) {
  const order: TicketCategoryId[] = ["change", "bug", "feature", "question", "upgrade"];
  const [selected, setSelected] = React.useState<TicketCategoryId>(defaultCategory);

  return (
    <div className="space-y-3">
      <input type="hidden" name="category" value={selected} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {order.map((id) => {
          const meta = META[id];
          const Icon = meta.icon;
          const isActive = selected === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setSelected(id)}
              aria-pressed={isActive}
              className={`group relative flex flex-col items-start gap-2 rounded-xl border px-4 py-3 text-left transition-colors ${
                isActive
                  ? `${meta.border} ${meta.bg}`
                  : "border-(--color-border) bg-(--color-surface) hover:border-(--color-border)"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? meta.text : "text-(--color-muted)"}`} />
              <p
                className={`text-[14px] font-medium ${isActive ? meta.text : "text-(--color-text)"}`}
              >
                {labelFor(id, strings)}
              </p>
              <p className="text-[12px] leading-snug text-(--color-muted)">
                {bodyFor(id, strings)}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
