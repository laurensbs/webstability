"use client";

import * as React from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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

export function NpsForm({
  token,
  strings,
}: {
  token: string;
  strings: Strings;
  locale: "nl" | "es";
}) {
  const [score, setScore] = React.useState<number | null>(null);
  const [comment, setComment] = React.useState("");
  const [submitted, setSubmitted] = React.useState(false);
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
        setSubmitted(true);
      } else {
        toast.error(strings.errorToast);
      }
    });
  };

  if (submitted) {
    return (
      <p className="mt-8 rounded-[14px] border border-(--color-success)/30 bg-(--color-success)/5 px-5 py-4 text-[14px] text-(--color-text)">
        {strings.successToast}
      </p>
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
