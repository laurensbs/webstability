"use client";

import * as React from "react";
import { toast } from "sonner";
import { Sparkles, Copy, Check, X, RotateCcw, ChevronDown } from "lucide-react";

type Draft = {
  id: string;
  slug: string;
  title: string;
  targetKeywords: string;
  priority: number;
  status: "pending" | "generated" | "published" | "skipped" | "failed";
  bodyMdx: string | null;
  model: string | null;
  error: string | null;
  createdAt: Date;
  generatedAt: Date | null;
};

type Actions = {
  generate: () => Promise<{ ok: boolean; generated?: string | null; reason?: string }>;
  markPublished: (id: string) => Promise<{ ok: boolean }>;
  markSkipped: (id: string) => Promise<{ ok: boolean }>;
  retry: (id: string) => Promise<{ ok: boolean }>;
};

const STATUS_META: Record<Draft["status"], { label: string; tone: string }> = {
  pending: { label: "In de wachtrij", tone: "bg-(--color-bg-warm) text-(--color-muted)" },
  generated: {
    label: "Concept klaar — review",
    tone: "bg-(--color-accent)/15 text-(--color-wine)",
  },
  published: { label: "Gepubliceerd", tone: "bg-(--color-success)/15 text-(--color-success)" },
  skipped: { label: "Afgekeurd", tone: "bg-(--color-bg-warm) text-(--color-muted)/70" },
  failed: { label: "Mislukt", tone: "bg-red-100 text-red-700" },
};

export function BlogDraftQueue({ drafts, actions }: { drafts: Draft[]; actions: Actions }) {
  const [generating, setGenerating] = React.useState(false);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [openId, setOpenId] = React.useState<string | null>(null);

  const dateFmt = new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  const onGenerate = async () => {
    setGenerating(true);
    try {
      const res = await actions.generate();
      if (res.ok && res.generated) toast.success(`Concept gegenereerd: ${res.generated}`);
      else if (res.ok && res.reason === "queue-empty")
        toast.info("Wachtrij is leeg — voeg een onderwerp toe in lib/blog/topics.ts");
      else if (res.reason === "no-api-key")
        toast.error("ANTHROPIC_API_KEY ontbreekt in de omgeving");
      else toast.error(`Generatie mislukt${res.reason ? ` (${res.reason})` : ""}`);
    } catch {
      toast.error("Generatie mislukt");
    } finally {
      setGenerating(false);
    }
  };

  const wrap = async (id: string, fn: (id: string) => Promise<{ ok: boolean }>, okMsg: string) => {
    setBusyId(id);
    try {
      const res = await fn(id);
      if (res.ok) toast.success(okMsg);
      else toast.error("Mislukt");
    } catch {
      toast.error("Mislukt");
    } finally {
      setBusyId(null);
    }
  };

  const copyMdx = async (mdx: string) => {
    try {
      await navigator.clipboard.writeText(mdx);
      toast.success("MDX gekopieerd — plak in content/blog/nl/[slug].mdx");
    } catch {
      toast.error("Kopiëren mislukt");
    }
  };

  const pendingCount = drafts.filter((d) => d.status === "pending").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4 rounded-[18px] border border-(--color-border) bg-(--color-surface) p-5">
        <div className="min-w-0">
          <p className="text-[14px] text-(--color-text)">
            {pendingCount} onderwerp{pendingCount === 1 ? "" : "en"} in de wachtrij. De cron pakt er
            elke maandag één; je kunt er hier ook nu één laten genereren.
          </p>
        </div>
        <button
          type="button"
          onClick={onGenerate}
          disabled={generating || pendingCount === 0}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-(--color-text) px-4 py-2 text-[13px] font-medium text-(--color-bg) transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          <Sparkles
            className={`h-3.5 w-3.5 ${generating ? "animate-pulse" : ""}`}
            strokeWidth={2.2}
          />
          {generating ? "Bezig…" : "Genereer nu"}
        </button>
      </div>

      <ul className="space-y-2.5">
        {drafts.map((d) => {
          const meta = STATUS_META[d.status];
          const open = openId === d.id;
          return (
            <li
              key={d.id}
              className="rounded-[14px] border border-(--color-border) bg-(--color-surface) p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 font-mono text-[10px] tracking-wide uppercase ${meta.tone}`}
                    >
                      {meta.label}
                    </span>
                    <code className="font-mono text-[11px] text-(--color-muted)">{d.slug}</code>
                  </div>
                  <h3 className="mt-1.5 text-[15px] leading-snug text-(--color-text)">{d.title}</h3>
                  <p className="mt-1 font-mono text-[10px] tracking-wide text-(--color-muted)/80 uppercase">
                    {d.targetKeywords}
                  </p>
                  {d.status === "failed" && d.error ? (
                    <p className="mt-1.5 text-[12px] text-red-700">Fout: {d.error}</p>
                  ) : null}
                  {d.generatedAt ? (
                    <p className="mt-1 font-mono text-[10px] text-(--color-muted)/70">
                      gegenereerd {dateFmt.format(d.generatedAt)}
                      {d.model ? ` · ${d.model}` : ""}
                    </p>
                  ) : null}
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  {d.status === "generated" && d.bodyMdx ? (
                    <>
                      <button
                        type="button"
                        onClick={() => copyMdx(d.bodyMdx as string)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-(--color-border) bg-(--color-bg-warm) px-2.5 py-1 font-mono text-[10px] tracking-wide text-(--color-text) transition-colors hover:border-(--color-accent)/50"
                      >
                        <Copy className="h-3 w-3" strokeWidth={2.2} /> Kopieer MDX
                      </button>
                      <button
                        type="button"
                        onClick={() => setOpenId(open ? null : d.id)}
                        className="inline-flex items-center gap-1 font-mono text-[10px] tracking-wide text-(--color-muted) hover:text-(--color-text)"
                      >
                        <ChevronDown
                          className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
                          strokeWidth={2.2}
                        />
                        {open ? "verberg" : "bekijk"}
                      </button>
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          disabled={busyId === d.id}
                          onClick={() =>
                            wrap(d.id, actions.markPublished, "Gemarkeerd als gepubliceerd")
                          }
                          className="inline-flex items-center gap-1 rounded-full border border-(--color-success)/40 bg-(--color-success)/10 px-2 py-1 font-mono text-[10px] tracking-wide text-(--color-success) transition-colors hover:bg-(--color-success)/20 disabled:opacity-50"
                          title="Markeer als gepubliceerd (nadat je 'm in de repo hebt gezet)"
                        >
                          <Check className="h-3 w-3" strokeWidth={2.4} /> Gepubliceerd
                        </button>
                        <button
                          type="button"
                          disabled={busyId === d.id}
                          onClick={() => wrap(d.id, actions.markSkipped, "Afgekeurd")}
                          className="inline-flex items-center gap-1 rounded-full border border-(--color-border) px-2 py-1 font-mono text-[10px] tracking-wide text-(--color-muted) transition-colors hover:text-(--color-text) disabled:opacity-50"
                        >
                          <X className="h-3 w-3" strokeWidth={2.4} /> Afkeuren
                        </button>
                      </div>
                    </>
                  ) : null}
                  {d.status === "failed" || d.status === "skipped" ? (
                    <button
                      type="button"
                      disabled={busyId === d.id}
                      onClick={() => wrap(d.id, actions.retry, "Teruggezet in de wachtrij")}
                      className="inline-flex items-center gap-1 rounded-full border border-(--color-border) px-2 py-1 font-mono text-[10px] tracking-wide text-(--color-muted) transition-colors hover:text-(--color-text) disabled:opacity-50"
                    >
                      <RotateCcw className="h-3 w-3" strokeWidth={2.2} /> Opnieuw
                    </button>
                  ) : null}
                </div>
              </div>
              {open && d.bodyMdx ? (
                <pre className="mt-3 max-h-[420px] overflow-auto rounded-lg bg-(--color-text) p-4 font-mono text-[11px] leading-relaxed whitespace-pre-wrap text-(--color-bg)/90">
                  {d.bodyMdx}
                </pre>
              ) : null}
            </li>
          );
        })}
        {drafts.length === 0 ? (
          <li className="rounded-[14px] border border-dashed border-(--color-border) p-8 text-center text-[13px] text-(--color-muted)">
            Nog geen onderwerpen. Voeg er een toe in{" "}
            <code className="font-mono">lib/blog/topics.ts</code> en klik &ldquo;Genereer nu&rdquo;
            (of wacht op de maandag-cron).
          </li>
        ) : null}
      </ul>
    </div>
  );
}
