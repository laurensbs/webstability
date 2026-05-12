"use client";

import * as React from "react";
import { Check, MessageSquare, ExternalLink, Loader2 } from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { approveDeliverable, requestRevision } from "@/app/actions/files";

type Deliverable = {
  id: string;
  name: string;
  url: string;
  category: string;
  version: number;
  approvedAt: Date | null;
  revisionRequestedAt: Date | null;
  revisionNote: string | null;
  createdAt: Date;
  replacesFileId: string | null;
};

type Strings = {
  title: string;
  empty: string;
  approveLabel: string;
  approving: string;
  approvedLabel: string;
  reviseLabel: string;
  revising: string;
  reviseTitle: string;
  reviseNotePlaceholder: string;
  reviseSubmit: string;
  reviseCancel: string;
  reviewedLabel: string;
  versionLabel: string;
  approvedToast: string;
  revisionToast: string;
  errorToast: string;
  download: string;
};

const CATEGORY_BADGE: Record<string, string> = {
  brand_kit: "Brand kit",
  copy: "Copy",
  screenshot: "Screenshot",
  wireframe: "Wireframe",
  deliverable: "Oplevering",
  final_handover: "Eindoplevering",
  asset: "Asset",
  contract: "Contract",
  report: "Rapport",
};

/**
 * Toont deliverables aan de klant met akkoord-knop + revisie-flow.
 * Strategie: maak het traject formeel zonder DocuSeal-zwaarte.
 *
 * Render-states per item:
 * - Niet beoordeeld: "Akkoord" + "Reactie" knoppen
 * - Akkoord: groen vinkje + datum
 * - Revisie aangevraagd: wijn-rood label + note (klant)
 */
export function DeliverableApprovalCard({
  deliverables,
  strings,
  locale,
}: {
  deliverables: Deliverable[];
  strings: Strings;
  locale: string;
}) {
  const dateFmt = new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
  });

  if (deliverables.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-(--color-border) bg-(--color-bg-warm)/50 px-5 py-6 text-[14px] text-(--color-muted)">
        {strings.empty}
      </p>
    );
  }

  return (
    <ul className="rounded-card divide-y divide-(--color-border) overflow-hidden border border-(--color-border) bg-(--color-surface)">
      {deliverables.map((d) => (
        <DeliverableRow key={d.id} item={d} strings={strings} dateFmt={dateFmt} />
      ))}
    </ul>
  );
}

function DeliverableRow({
  item,
  strings,
  dateFmt,
}: {
  item: Deliverable;
  strings: Strings;
  dateFmt: Intl.DateTimeFormat;
}) {
  const reduce = useReducedMotion();
  const [pending, startTransition] = React.useTransition();
  const [showRevise, setShowRevise] = React.useState(false);
  const [reviseNote, setReviseNote] = React.useState("");
  const [reviseSubmitting, setReviseSubmitting] = React.useState(false);
  // Optimistic state — laat klant direct het resultaat zien zonder
  // op revalidate te wachten.
  const [optimistic, setOptimistic] = React.useState<{
    approved?: boolean;
    revisionAt?: Date;
    revisionNote?: string;
  }>({});

  const isApproved = item.approvedAt !== null || optimistic.approved === true;
  const revisionAt = item.revisionRequestedAt ?? optimistic.revisionAt ?? null;
  const revisionNote = item.revisionNote ?? optimistic.revisionNote ?? null;

  const onApprove = () => {
    startTransition(async () => {
      const result = await approveDeliverable(item.id);
      if (result.ok) {
        setOptimistic({ approved: true });
        toast.success(strings.approvedToast);
      } else {
        toast.error(strings.errorToast);
      }
    });
  };

  const onRevise = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviseSubmitting(true);
    const fd = new FormData();
    fd.set("fileId", item.id);
    fd.set("note", reviseNote);
    try {
      const result = await requestRevision(fd);
      if (result.ok) {
        setOptimistic({ revisionAt: new Date(), revisionNote: reviseNote });
        setShowRevise(false);
        setReviseNote("");
        toast.success(strings.revisionToast);
      } else {
        toast.error(strings.errorToast);
      }
    } catch {
      toast.error(strings.errorToast);
    } finally {
      setReviseSubmitting(false);
    }
  };

  return (
    <li className="px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-[14px] font-medium text-(--color-text)">
            <span className="truncate">{item.name}</span>
            {item.version > 1 ? (
              <span className="inline-flex shrink-0 items-center rounded-full bg-(--color-bg-warm) px-2 py-0.5 font-mono text-[10px] tracking-wide text-(--color-muted)">
                {strings.versionLabel.replace("{n}", String(item.version))}
              </span>
            ) : null}
          </p>
          <p className="mt-1 font-mono text-[10px] tracking-wide text-(--color-muted) uppercase">
            {CATEGORY_BADGE[item.category] ?? item.category} · {dateFmt.format(item.createdAt)}
          </p>
        </div>
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1 font-mono text-[11px] text-(--color-accent) transition-colors hover:text-(--color-wine)"
        >
          {strings.download}
          <ExternalLink className="h-3 w-3" strokeWidth={2.4} />
        </a>
      </div>

      {/* State-indicators */}
      {isApproved ? (
        <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-(--color-success)/10 px-2.5 py-1 font-mono text-[10px] tracking-widest text-(--color-success) uppercase">
          <Check className="h-3 w-3" strokeWidth={2.5} />
          {strings.approvedLabel}
          {item.approvedAt ? ` · ${dateFmt.format(item.approvedAt)}` : ""}
        </div>
      ) : revisionAt ? (
        <div className="mt-3 rounded-[10px] border border-(--color-wine)/30 bg-(--color-wine)/5 p-3">
          <p className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-widest text-(--color-wine) uppercase">
            <MessageSquare className="h-3 w-3" strokeWidth={2.4} />
            {strings.reviewedLabel} · {dateFmt.format(revisionAt)}
          </p>
          {revisionNote ? (
            <p className="mt-2 text-[13px] leading-[1.55] whitespace-pre-wrap text-(--color-text)">
              {revisionNote}
            </p>
          ) : null}
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onApprove}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-full bg-(--color-success) px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-(--color-success)/90 disabled:opacity-60"
          >
            {pending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Check className="h-3 w-3" strokeWidth={2.5} />
            )}
            {pending ? strings.approving : strings.approveLabel}
          </button>
          <button
            type="button"
            onClick={() => setShowRevise((s) => !s)}
            className="inline-flex items-center gap-1.5 rounded-full border border-(--color-border) bg-(--color-surface) px-3 py-1.5 text-[12px] font-medium text-(--color-muted) transition-colors hover:border-(--color-accent)/50 hover:text-(--color-text)"
          >
            <MessageSquare className="h-3 w-3" strokeWidth={2.4} />
            {strings.reviseLabel}
          </button>
        </div>
      )}

      <AnimatePresence>
        {showRevise ? (
          <motion.form
            initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, height: "auto" }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onSubmit={onRevise}
            className="mt-3 overflow-hidden"
          >
            <p className="mb-2 font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
              {strings.reviseTitle}
            </p>
            <textarea
              value={reviseNote}
              onChange={(e) => setReviseNote(e.target.value)}
              placeholder={strings.reviseNotePlaceholder}
              rows={3}
              maxLength={1000}
              className="block w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-[13px] focus:border-(--color-accent)/60 focus:outline-none"
            />
            <div className="mt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowRevise(false);
                  setReviseNote("");
                }}
                className="font-mono text-[11px] tracking-widest text-(--color-muted) uppercase hover:text-(--color-text)"
              >
                {strings.reviseCancel}
              </button>
              <button
                type="submit"
                disabled={reviseSubmitting}
                className="inline-flex items-center gap-1.5 rounded-full bg-(--color-accent) px-3 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-(--color-accent)/90 disabled:opacity-60"
              >
                {reviseSubmitting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <MessageSquare className="h-3 w-3" strokeWidth={2.4} />
                )}
                {reviseSubmitting ? strings.revising : strings.reviseSubmit}
              </button>
            </div>
          </motion.form>
        ) : null}
      </AnimatePresence>
    </li>
  );
}
