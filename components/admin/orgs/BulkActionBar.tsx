"use client";

import { Mail, X } from "lucide-react";

/**
 * Floating bulk-bar onderaan /admin/orgs zodra ≥1 org geselecteerd.
 * Strategie: bulk-acties besparen elke werkdag minuten (mail naar 5
 * klanten tegelijk, niet 5x klikken). Eerste actie = mail; status-update
 * en factuur-genereren komen later.
 */
export function BulkActionBar({
  selectedCount,
  onClear,
  onMail,
  strings,
}: {
  selectedCount: number;
  onClear: () => void;
  onMail: () => void;
  strings: { selected: string; mailAction: string; clear: string };
}) {
  if (selectedCount === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-30 flex justify-center px-4">
      <div className="shadow-modal pointer-events-auto inline-flex items-center gap-3 rounded-full border border-(--color-border) bg-(--color-text) px-4 py-2 text-(--color-bg)">
        <span className="font-mono text-[11px] tracking-widest text-(--color-bg)/60 uppercase">
          {strings.selected.replace("{n}", String(selectedCount))}
        </span>
        <span className="h-4 w-px bg-(--color-bg)/20" aria-hidden />
        <button
          type="button"
          onClick={onMail}
          className="inline-flex items-center gap-1.5 rounded-full bg-(--color-accent) px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-(--color-accent)/90"
        >
          <Mail className="h-3 w-3" strokeWidth={2.4} />
          {strings.mailAction}
        </button>
        <button
          type="button"
          onClick={onClear}
          aria-label={strings.clear}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-(--color-bg)/55 transition-colors hover:bg-(--color-bg)/10 hover:text-(--color-bg)"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}
