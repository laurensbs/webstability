"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, Loader2 } from "lucide-react";

export type MailTemplateId = "short_update" | "invoice_reminder" | "quarterly_report";

type Strings = {
  title: string;
  body: string;
  templateLabel: string;
  templates: Record<MailTemplateId, { name: string; description: string }>;
  cancel: string;
  confirm: string;
  confirmHint: string;
  sending: string;
};

/**
 * Bulk-mail modal. Strategie: bulk-mailen is makkelijk fout te doen,
 * dus altijd door één bevestigingsstap ("X mensen, doorgaan?"). Geen
 * vrije tekst — alleen template-keuze. Drie templates: short update,
 * factuur-herinnering, kwartaal-rapport.
 *
 * `open` toggle remount via een unieke `key` op de inner form, zodat
 * de form-state (template + submitting) reset zonder useEffect met
 * setState.
 */
export function BulkMailModal({
  open,
  onClose,
  orgIds,
  bulkAction,
  strings,
}: {
  open: boolean;
  onClose: () => void;
  orgIds: string[];
  bulkAction: (formData: FormData) => Promise<void>;
  strings: Strings;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="bulk-mail-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-(--color-text)/40 px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <BulkMailForm
            onClose={onClose}
            orgIds={orgIds}
            bulkAction={bulkAction}
            strings={strings}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function BulkMailForm({
  onClose,
  orgIds,
  bulkAction,
  strings,
}: {
  onClose: () => void;
  orgIds: string[];
  bulkAction: (formData: FormData) => Promise<void>;
  strings: Strings;
}) {
  const [template, setTemplate] = React.useState<MailTemplateId>("short_update");
  const [submitting, setSubmitting] = React.useState(false);
  const templateIds: MailTemplateId[] = ["short_update", "invoice_reminder", "quarterly_report"];

  return (
    <motion.form
      role="dialog"
      aria-modal="true"
      aria-label={strings.title}
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.97 }}
      transition={{ duration: 0.18 }}
      action={async (fd) => {
        setSubmitting(true);
        try {
          await bulkAction(fd);
          onClose();
        } finally {
          setSubmitting(false);
        }
      }}
      className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-t-2 border-(--color-border) border-t-(--color-wine) bg-(--color-surface) p-6 md:p-8"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full text-(--color-muted) transition-colors hover:bg-(--color-bg-warm) hover:text-(--color-text)"
        aria-label={strings.cancel}
      >
        <X className="h-4 w-4" />
      </button>

      <h2 className="font-serif text-2xl">{strings.title}</h2>
      <p className="mt-2 text-[14px] text-(--color-muted)">
        {strings.body.replace("{n}", String(orgIds.length))}
      </p>

      <fieldset className="mt-6 space-y-2">
        <legend className="mb-2 font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
          {strings.templateLabel}
        </legend>
        {templateIds.map((id) => {
          const meta = strings.templates[id];
          return (
            <label
              key={id}
              className={`rounded-card flex cursor-pointer items-start gap-3 border p-3 transition-colors ${
                template === id
                  ? "border-(--color-accent) bg-(--color-accent-soft)/30"
                  : "border-(--color-border) bg-(--color-bg-warm)/40 hover:border-(--color-accent)/40"
              }`}
            >
              <input
                type="radio"
                name="template"
                value={id}
                checked={template === id}
                onChange={() => setTemplate(id)}
                className="mt-0.5 h-4 w-4 accent-(--color-accent)"
              />
              <div>
                <p className="text-[14px] font-medium text-(--color-text)">{meta.name}</p>
                <p className="mt-0.5 text-[12px] text-(--color-muted)">{meta.description}</p>
              </div>
            </label>
          );
        })}
      </fieldset>

      {orgIds.map((id) => (
        <input key={id} type="hidden" name="orgId" value={id} />
      ))}

      <p className="mt-4 font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
        {strings.confirmHint.replace("{n}", String(orgIds.length))}
      </p>

      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-(--color-border) px-4 py-2 text-[13px] text-(--color-muted) transition-colors hover:text-(--color-text)"
        >
          {strings.cancel}
        </button>
        <button
          type="submit"
          disabled={submitting || orgIds.length === 0}
          className="shadow-glow inline-flex items-center gap-1.5 rounded-full bg-(--color-accent) px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-(--color-accent)/90 disabled:opacity-60"
        >
          {submitting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {strings.sending}
            </>
          ) : (
            <>
              <Send className="h-3.5 w-3.5" />
              {strings.confirm}
            </>
          )}
        </button>
      </div>
    </motion.form>
  );
}
