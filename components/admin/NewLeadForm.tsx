"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createLead } from "@/app/actions/leads";
import { LEAD_SOURCES, LEAD_SOURCE_LABEL_NL } from "@/lib/leads";

const FIELD =
  "block w-full rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-2 text-[14px] focus:border-(--color-accent)/60 focus:outline-none";
const LABEL = "font-mono text-[10px] tracking-widest text-(--color-muted) uppercase";

export function NewLeadForm() {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createLead(null, fd);
      if (result.ok && result.leadId) {
        toast.success("Lead aangemaakt");
        router.push(`/admin/leads/${result.leadId}`);
      } else {
        toast.error(result.messageKey === "missing_fields" ? "Vul e-mail in" : "Mislukt");
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label htmlFor="email" className={LABEL}>
          E-mail *
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="off"
          className={`mt-2 ${FIELD}`}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={LABEL}>
            Naam
          </label>
          <input id="name" name="name" type="text" className={`mt-2 ${FIELD}`} />
        </div>
        <div>
          <label htmlFor="company" className={LABEL}>
            Bedrijf
          </label>
          <input id="company" name="company" type="text" className={`mt-2 ${FIELD}`} />
        </div>
      </div>

      <div>
        <label htmlFor="source" className={LABEL}>
          Bron
        </label>
        <select id="source" name="source" defaultValue="manual" className={`mt-2 ${FIELD}`}>
          {LEAD_SOURCES.map((s) => (
            <option key={s} value={s}>
              {LEAD_SOURCE_LABEL_NL[s]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="notes" className={LABEL}>
          Notitie (markdown)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={4}
          className={`mt-2 ${FIELD}`}
          placeholder="Waar komen ze vandaan, wat is hun pijn, etc."
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="nextActionAt" className={LABEL}>
            Volgende actie — wanneer
          </label>
          <input
            id="nextActionAt"
            name="nextActionAt"
            type="datetime-local"
            className={`mt-2 ${FIELD}`}
          />
        </div>
        <div>
          <label htmlFor="nextActionLabel" className={LABEL}>
            Volgende actie — wat
          </label>
          <input
            id="nextActionLabel"
            name="nextActionLabel"
            type="text"
            className={`mt-2 ${FIELD}`}
            placeholder="Stuur intro-mail"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-full bg-(--color-text) px-4 py-2 text-[13px] font-medium text-(--color-bg) transition-colors hover:bg-(--color-text)/90 disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {pending ? "Aanmaken…" : "Lead aanmaken"}
        </button>
      </div>
    </form>
  );
}
