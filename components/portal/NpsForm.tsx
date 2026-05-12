"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2, Check, Copy, Gift } from "lucide-react";
import { submitNpsResponse } from "@/app/actions/nps";

type Strings = {
  scoreLabel: string;
  scoreHelpLow: string;
  scoreHelpHigh: string;
  commentLabel: string;
  commentPlaceholder: string;
  submitLabel: string;
  submitting: string;
  errorToast: string;
  successToast: string;
};

/** Strings voor het "deel Webstability"-blok dat na een hoge score
 * (promotor, ≥ 9) verschijnt — het warmste moment om om een referral
 * te vragen. */
type PromoterStrings = {
  title: string; // "Fijn dat je het waardeert — ken je iemand met hetzelfde probleem?"
  body: string; // uitleg + €250-korting
  linkLabel: string; // "Jouw deelbare link"
  copyLabel: string; // "Kopieer link"
  copiedLabel: string; // "Gekopieerd!"
  fallback: string; // als er geen link is
};

const PROMOTER_THRESHOLD = 9;

export function NpsForm({
  token,
  strings,
  promoterStrings,
  referralLink,
}: {
  token: string;
  strings: Strings;
  locale: "nl" | "es";
  /** Strings voor het promotor-vervolgblok. */
  promoterStrings?: PromoterStrings;
  /** De /refer/[code]-link van deze org, als die er is. */
  referralLink?: string | null;
}) {
  const [score, setScore] = React.useState<number | null>(null);
  const [comment, setComment] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
  const [submittedScore, setSubmittedScore] = React.useState<number | null>(null);
  const [pending, startTransition] = React.useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (score === null) return;
    const fd = new FormData();
    fd.set("token", token);
    fd.set("score", String(score));
    fd.set("comment", comment);
    startTransition(async () => {
      const result = await submitNpsResponse(null, fd);
      if (result.ok) {
        toast.success(strings.successToast);
        setSubmittedScore(score);
        setSubmitted(true);
      } else {
        toast.error(strings.errorToast);
      }
    });
  };

  if (submitted) {
    const isPromoter = submittedScore !== null && submittedScore >= PROMOTER_THRESHOLD;
    return (
      <div className="mt-8 space-y-4">
        <p className="rounded-card border border-(--color-success)/30 bg-(--color-success)/5 px-5 py-4 text-[14px] text-(--color-text)">
          {strings.successToast}
        </p>
        {isPromoter && promoterStrings ? (
          <PromoterBlock strings={promoterStrings} referralLink={referralLink} />
        ) : null}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-6">
      <div>
        <p className="font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
          {strings.scoreLabel}
        </p>
        <div className="mt-3 grid grid-cols-11 gap-1.5">
          {Array.from({ length: 11 }, (_, i) => i).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setScore(n)}
              className={[
                "flex h-10 items-center justify-center rounded-lg border font-mono text-[13px] transition-colors",
                score === n
                  ? "border-(--color-accent) bg-(--color-accent) text-white"
                  : "border-(--color-border) bg-(--color-surface) text-(--color-text) hover:border-(--color-accent)/50",
              ].join(" ")}
            >
              {n}
            </button>
          ))}
        </div>
        <div className="mt-2 flex justify-between font-mono text-[10px] tracking-wide text-(--color-muted) uppercase">
          <span>{strings.scoreHelpLow}</span>
          <span>{strings.scoreHelpHigh}</span>
        </div>
      </div>

      <div>
        <label
          htmlFor="nps-comment"
          className="font-mono text-[10px] tracking-widest text-(--color-muted) uppercase"
        >
          {strings.commentLabel}
        </label>
        <textarea
          id="nps-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={strings.commentPlaceholder}
          rows={4}
          maxLength={1000}
          className="mt-2 block w-full rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-2 text-[14px] focus:border-(--color-accent)/60 focus:outline-none"
        />
      </div>

      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={score === null || pending}
          className="inline-flex items-center gap-2 rounded-full bg-(--color-text) px-5 py-2.5 text-[13px] font-medium text-(--color-bg) transition-colors hover:bg-(--color-text)/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          {pending ? strings.submitting : strings.submitLabel}
        </button>
      </div>
    </form>
  );
}

/**
 * Het "deel Webstability"-blok — verschijnt na een hoge NPS-score,
 * óf op de NPS-page als de bezoeker al eerder ≥ 9 scoorde. Toont de
 * deelbare /refer/[code]-link met kopieer-knop.
 */
export function PromoterBlock({
  strings,
  referralLink,
}: {
  strings: PromoterStrings;
  referralLink?: string | null;
}) {
  const [copied, setCopied] = React.useState(false);

  const onCopy = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard geblokkeerd — geen ramp, link staat zichtbaar
    }
  };

  return (
    <div className="rounded-card border border-t-2 border-(--color-border) border-t-(--color-wine) bg-(--color-surface) p-6">
      <p className="inline-flex items-center gap-2 font-mono text-[10px] tracking-widest text-(--color-wine) uppercase">
        <Gift className="h-3 w-3" strokeWidth={2.2} aria-hidden />
        {`// referral`}
      </p>
      <h2 className="mt-2 font-serif text-[18px] leading-tight text-(--color-text)">
        {strings.title}
      </h2>
      <p className="mt-2 text-[13px] leading-[1.55] text-(--color-muted)">{strings.body}</p>
      {referralLink ? (
        <div className="mt-4">
          <p className="font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
            {strings.linkLabel}
          </p>
          <div className="mt-2 flex items-stretch gap-2">
            <code className="min-w-0 flex-1 truncate rounded-md border border-(--color-border) bg-(--color-bg-warm) px-3 py-2 font-mono text-[12px] text-(--color-text)">
              {referralLink}
            </code>
            <button
              type="button"
              onClick={onCopy}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-(--color-accent) px-3 py-2 text-[12px] font-medium text-white transition-colors hover:bg-(--color-accent)/90"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
              ) : (
                <Copy className="h-3.5 w-3.5" strokeWidth={2} />
              )}
              {copied ? strings.copiedLabel : strings.copyLabel}
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-3 font-mono text-[11px] text-(--color-muted)">{strings.fallback}</p>
      )}
    </div>
  );
}
