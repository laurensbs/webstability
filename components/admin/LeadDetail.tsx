"use client";

import * as React from "react";
import NextLink from "next/link";
import { Loader2, MessageSquare, ListChecks, Building2, Send } from "lucide-react";
import { toast } from "sonner";
import { updateLead, addLeadNote, markLeadAsCustomer, sendLeadOutreach } from "@/app/actions/leads";
import {
  LEAD_STATUSES,
  LEAD_STATUS_LABEL_NL,
  OUTREACH_TEMPLATES,
  OUTREACH_LABEL_NL,
  type LeadStatus,
  type OutreachTemplate,
} from "@/lib/leads";
import { LeadActivityTimeline } from "@/components/admin/LeadActivityTimeline";

const FIELD =
  "block w-full rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-2 text-[14px] focus:border-(--color-accent)/60 focus:outline-none";
const LABEL = "font-mono text-[10px] tracking-widest text-(--color-muted) uppercase";

type Activity = {
  id: string;
  kind: string;
  summary: string;
  createdAt: string;
  actorName: string | null;
};

export type ConfiguratorRequest = {
  kind: "website" | "webshop";
  pages: number;
  /** Webshop: gekozen product-staffel (label) — null bij website of 'small'. */
  productTierLabel: string | null;
  paletteLabel: string;
  customColor: string | null;
  languages: string;
  optionLabels: string[];
  message: string | null;
  lowEur: number;
  highEur: number;
  lines: { label: string; eur: number }[];
  /** Prefill-querystring voor /admin/orgs/new ("?name=…&email=…&projectType=website"). */
  newOrgQuery: string;
};

export function LeadDetail({
  leadId,
  initial,
  staffOptions,
  orgOptions,
  activity,
  createdAtLabel,
  configuratorRequest,
}: {
  leadId: string;
  initial: {
    status: LeadStatus;
    notes: string;
    nextActionAt: string;
    nextActionLabel: string;
    ownerStaffId: string;
    linkedOrgId: string;
  };
  staffOptions: { id: string; label: string }[];
  orgOptions: { id: string; label: string }[];
  activity: Activity[];
  createdAtLabel: string;
  configuratorRequest?: ConfiguratorRequest | null;
}) {
  const [savingMain, startMain] = React.useTransition();
  const [savingNote, startNote] = React.useTransition();
  const [convertingPending, startConvert] = React.useTransition();
  const [sendingMail, startSend] = React.useTransition();
  const [noteDraft, setNoteDraft] = React.useState("");
  const [showConvert, setShowConvert] = React.useState(false);
  const [template, setTemplate] = React.useState<OutreachTemplate>(OUTREACH_TEMPLATES[0]);
  const [customSubject, setCustomSubject] = React.useState("");
  const [customBody, setCustomBody] = React.useState("");

  const onSaveMain = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startMain(async () => {
      const result = await updateLead(leadId, null, fd);
      if (result.ok) {
        toast.success("Opgeslagen");
      } else {
        toast.error("Mislukt");
      }
    });
  };

  const onAddNote = () => {
    if (!noteDraft.trim()) return;
    const fd = new FormData();
    fd.set("note", noteDraft);
    startNote(async () => {
      const result = await addLeadNote(leadId, null, fd);
      if (result.ok) {
        toast.success("Notitie opgeslagen");
        setNoteDraft("");
      } else {
        toast.error("Mislukt");
      }
    });
  };

  const onSendMail = () => {
    const fd = new FormData();
    fd.set("template", template);
    if (customSubject.trim()) fd.set("subject", customSubject);
    if (customBody.trim()) fd.set("body", customBody);
    startSend(async () => {
      const result = await sendLeadOutreach(leadId, null, fd);
      if (result.ok) {
        toast.success("Mail verzonden");
        setCustomSubject("");
        setCustomBody("");
      } else {
        toast.error("Mislukt");
      }
    });
  };

  const onConvert = (orgId: string) => {
    const fd = new FormData();
    fd.set("linkedOrgId", orgId);
    startConvert(async () => {
      const result = await markLeadAsCustomer(leadId, null, fd);
      if (result.ok) {
        toast.success("Gekoppeld aan klant");
        setShowConvert(false);
      } else {
        toast.error("Mislukt");
      }
    });
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      {/* Main: edit-form + activity */}
      <div className="space-y-8">
        {configuratorRequest ? (
          <section className="rounded-card border border-(--color-accent)/40 bg-(--color-accent-soft)/30 p-6">
            <p className="inline-flex items-center gap-2 font-mono text-[10px] tracking-widest text-(--color-wine) uppercase">
              {"// configurator-aanvraag"}
            </p>
            <p className="mt-2 font-serif text-[20px]">
              {configuratorRequest.kind === "webshop" ? "Webshop" : "Website"} ·{" "}
              {configuratorRequest.pages} pagina&apos;s · richtprijs €{configuratorRequest.lowEur}–€
              {configuratorRequest.highEur}
            </p>
            <dl className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2">
              {[
                ...(configuratorRequest.productTierLabel
                  ? [["Producten", configuratorRequest.productTierLabel] as const]
                  : []),
                [
                  "Look",
                  configuratorRequest.paletteLabel +
                    (configuratorRequest.customColor
                      ? ` — wens: ${configuratorRequest.customColor}`
                      : ""),
                ] as const,
                ["Talen", configuratorRequest.languages] as const,
                [
                  "Opties",
                  configuratorRequest.optionLabels.length
                    ? configuratorRequest.optionLabels.join(", ")
                    : "—",
                ] as const,
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
                    {k}
                  </dt>
                  <dd className="mt-0.5 text-[13px] text-(--color-text)">{v}</dd>
                </div>
              ))}
            </dl>
            {configuratorRequest.message ? (
              <div className="mt-4">
                <p className="font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
                  Bericht
                </p>
                <p className="mt-1 text-[13px] leading-[1.55] whitespace-pre-wrap text-(--color-text)">
                  {configuratorRequest.message}
                </p>
              </div>
            ) : null}
            <div className="mt-4 border-t border-(--color-accent)/20 pt-3">
              <p className="font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
                Prijs-opbouw
              </p>
              <ul className="mt-1.5 space-y-1 text-[13px]">
                {configuratorRequest.lines.map((l, i) => (
                  <li key={i} className="flex items-baseline justify-between gap-3">
                    <span className="text-(--color-muted)">{l.label}</span>
                    <span className="tabular-nums">€{l.eur}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-5">
              <NextLink
                href={`/admin/orgs/new?${configuratorRequest.newOrgQuery}`}
                className="inline-flex items-center gap-1.5 rounded-full bg-(--color-text) px-4 py-2 text-[13px] font-medium text-(--color-bg) transition-opacity hover:opacity-90"
              >
                Maak hier een org + project van →
              </NextLink>
            </div>
          </section>
        ) : null}
        <form
          onSubmit={onSaveMain}
          className="rounded-card space-y-5 border border-(--color-border) bg-(--color-surface) p-6"
        >
          <p className="inline-flex items-center gap-2 font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
            <ListChecks className="h-3 w-3" strokeWidth={2.4} />
            Lead bijwerken
          </p>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="status" className={LABEL}>
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={initial.status}
                className={`mt-2 ${FIELD}`}
              >
                {LEAD_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {LEAD_STATUS_LABEL_NL[s]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="ownerStaffId" className={LABEL}>
                Eigenaar
              </label>
              <select
                id="ownerStaffId"
                name="ownerStaffId"
                defaultValue={initial.ownerStaffId}
                className={`mt-2 ${FIELD}`}
              >
                <option value="">— onbeheerd —</option>
                {staffOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
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
                defaultValue={initial.nextActionAt ? initial.nextActionAt.slice(0, 16) : ""}
                className={`mt-2 ${FIELD}`}
              />
              {/* Snel-prik knoppen — zetten het datetime-veld op 09:00 over X dagen */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {(
                  [
                    ["+2d", 2],
                    ["volgende week", 7],
                    ["+2 wkn", 14],
                  ] as Array<[string, number]>
                ).map(([label, days]) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + days);
                      d.setHours(9, 0, 0, 0);
                      const pad = (n: number) => String(n).padStart(2, "0");
                      const v = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
                      const el = document.getElementById("nextActionAt") as HTMLInputElement | null;
                      if (el) el.value = v;
                    }}
                    className="rounded-full border border-(--color-border) px-2.5 py-1 font-mono text-[10px] tracking-wide text-(--color-muted) uppercase transition-colors hover:border-(--color-accent)/40 hover:text-(--color-text)"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="nextActionLabel" className={LABEL}>
                Volgende actie — wat
              </label>
              <input
                id="nextActionLabel"
                name="nextActionLabel"
                type="text"
                defaultValue={initial.nextActionLabel}
                className={`mt-2 ${FIELD}`}
                placeholder="Stuur opvolg-mail"
              />
            </div>
          </div>

          <div>
            <label htmlFor="notes" className={LABEL}>
              Sticky notes (markdown)
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={5}
              defaultValue={initial.notes}
              className={`mt-2 ${FIELD}`}
            />
          </div>

          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={savingMain}
              className="inline-flex items-center gap-2 rounded-full bg-(--color-text) px-4 py-2 text-[13px] font-medium text-(--color-bg) transition-colors hover:bg-(--color-text)/90 disabled:opacity-60"
            >
              {savingMain ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              {savingMain ? "Opslaan…" : "Opslaan"}
            </button>
          </div>
        </form>

        {/* Outreach mailer */}
        <section className="rounded-card space-y-3 border border-(--color-border) bg-(--color-surface) p-6">
          <p className="inline-flex items-center gap-2 font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
            <Send className="h-3 w-3" strokeWidth={2.4} />
            Outreach mail
          </p>
          <p className="text-[12px] leading-[1.55] text-(--color-muted)">
            Pak een template; vul optioneel subject/body in om de defaults te overrijden.
          </p>

          <div>
            <label htmlFor="template" className={LABEL}>
              Template
            </label>
            <select
              id="template"
              value={template}
              onChange={(e) => setTemplate(e.target.value as OutreachTemplate)}
              className={`mt-2 ${FIELD}`}
            >
              {OUTREACH_TEMPLATES.map((tpl) => (
                <option key={tpl} value={tpl}>
                  {OUTREACH_LABEL_NL[tpl]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="customSubject" className={LABEL}>
              Subject (override — laat leeg voor default)
            </label>
            <input
              id="customSubject"
              type="text"
              value={customSubject}
              onChange={(e) => setCustomSubject(e.target.value)}
              className={`mt-2 ${FIELD}`}
            />
          </div>

          <div>
            <label htmlFor="customBody" className={LABEL}>
              Body (override — laat leeg voor default)
            </label>
            <textarea
              id="customBody"
              value={customBody}
              onChange={(e) => setCustomBody(e.target.value)}
              rows={5}
              className={`mt-2 ${FIELD}`}
              placeholder="Eigen tekst — gebruik \\n voor regels. Geen markdown, geen HTML."
            />
          </div>

          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={onSendMail}
              disabled={sendingMail}
              className="inline-flex items-center gap-2 rounded-full bg-(--color-accent) px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-(--color-accent)/90 disabled:opacity-60"
            >
              {sendingMail ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" strokeWidth={2.2} />
              )}
              {sendingMail ? "Versturen…" : "Verstuur mail"}
            </button>
          </div>
        </section>

        {/* Activity */}
        <section>
          <p className="mb-3 inline-flex items-center gap-2 font-mono text-[10px] tracking-widest text-(--color-text) uppercase">
            <MessageSquare className="h-3 w-3 text-(--color-accent)" strokeWidth={2.4} />
            Tijdlijn
          </p>

          <div className="rounded-card border border-(--color-border) bg-(--color-surface) p-5">
            <textarea
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              rows={3}
              placeholder="Korte notitie — wat is er gebeurd / besproken / besloten?"
              className={FIELD}
              maxLength={2000}
            />
            <div className="mt-3 flex justify-end">
              <button
                type="button"
                onClick={onAddNote}
                disabled={savingNote || noteDraft.trim().length === 0}
                className="inline-flex items-center gap-2 rounded-full bg-(--color-accent) px-4 py-1.5 text-[12px] font-medium text-white transition-colors hover:bg-(--color-accent)/90 disabled:opacity-60"
              >
                {savingNote ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                {savingNote ? "Opslaan…" : "Notitie toevoegen"}
              </button>
            </div>
          </div>

          <LeadActivityTimeline activity={activity} />
        </section>
      </div>

      {/* Sidebar: metadata + convert */}
      <aside className="space-y-5">
        <div className="rounded-card border border-(--color-border) bg-(--color-bg-warm)/50 p-5">
          <p className="font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
            Aangemaakt
          </p>
          <p className="mt-1 text-[13px] text-(--color-text)">{createdAtLabel}</p>
        </div>

        {!initial.linkedOrgId ? (
          <div className="rounded-card border border-(--color-border) bg-(--color-surface) p-5">
            <p className="inline-flex items-center gap-2 font-mono text-[10px] tracking-widest text-(--color-text) uppercase">
              <Building2 className="h-3 w-3 text-(--color-success)" strokeWidth={2.4} />
              Markeer als klant
            </p>
            <p className="mt-2 text-[12px] leading-[1.55] text-(--color-muted)">
              Koppel deze lead aan een bestaande org. Doe dit pas zodra Stripe-checkout afgerond is.
            </p>
            {showConvert ? (
              <select
                onChange={(e) => {
                  if (e.target.value) onConvert(e.target.value);
                }}
                disabled={convertingPending}
                defaultValue=""
                className={`mt-3 ${FIELD}`}
              >
                <option value="" disabled>
                  Kies org…
                </option>
                {orgOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : (
              <button
                type="button"
                onClick={() => setShowConvert(true)}
                className="mt-3 inline-flex items-center gap-2 rounded-full border border-(--color-success)/40 bg-(--color-success)/5 px-3 py-1.5 font-mono text-[11px] tracking-widest text-(--color-success) uppercase transition-colors hover:bg-(--color-success)/10"
              >
                Kies org…
              </button>
            )}
          </div>
        ) : null}
      </aside>
    </div>
  );
}
