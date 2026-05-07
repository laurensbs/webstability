"use client";

import * as React from "react";
import { Bug, Sparkles, HelpCircle } from "lucide-react";

type Strings = {
  bugLabel: string;
  bugBody: string;
  featureLabel: string;
  featureBody: string;
  questionLabel: string;
  questionBody: string;
};

const CATEGORIES = [
  {
    id: "bug" as const,
    icon: Bug,
    color: "wine",
    border: "border-(--color-wine)",
    bg: "bg-(--color-wine)/5",
    text: "text-(--color-wine)",
  },
  {
    id: "feature" as const,
    icon: Sparkles,
    color: "accent",
    border: "border-(--color-accent)",
    bg: "bg-(--color-accent)/5",
    text: "text-(--color-accent)",
  },
  {
    id: "question" as const,
    icon: HelpCircle,
    color: "teal",
    border: "border-(--color-teal)",
    bg: "bg-(--color-teal)/5",
    text: "text-(--color-teal)",
  },
];

/**
 * 3-pill category picker voor /portal/tickets/new. Wordt gerenderd
 * bovenaan het form; het server-side form leest `category` uit de
 * hidden input. Default = "question".
 */
export function TicketCategoryPicker({ strings }: { strings: Strings }) {
  const [selected, setSelected] = React.useState<"bug" | "feature" | "question">("question");

  return (
    <div className="space-y-3">
      <input type="hidden" name="category" value={selected} />
      <div className="grid gap-3 sm:grid-cols-3">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = selected === cat.id;
          const label =
            cat.id === "bug"
              ? strings.bugLabel
              : cat.id === "feature"
                ? strings.featureLabel
                : strings.questionLabel;
          const body =
            cat.id === "bug"
              ? strings.bugBody
              : cat.id === "feature"
                ? strings.featureBody
                : strings.questionBody;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelected(cat.id)}
              aria-pressed={isActive}
              className={`group relative flex flex-col items-start gap-2 rounded-xl border px-4 py-3 text-left transition-colors ${
                isActive
                  ? `${cat.border} ${cat.bg}`
                  : "border-(--color-border) bg-(--color-surface) hover:border-(--color-border)"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? cat.text : "text-(--color-muted)"}`} />
              <p
                className={`text-[14px] font-medium ${isActive ? cat.text : "text-(--color-text)"}`}
              >
                {label}
              </p>
              <p className="text-[12px] leading-snug text-(--color-muted)">{body}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
