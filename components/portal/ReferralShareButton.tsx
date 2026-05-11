"use client";

import * as React from "react";
import { Check, Copy } from "lucide-react";

/**
 * Toont de referral-link in een read-only veld met een kopieer-knop.
 * Na kopiëren wisselt het label kort naar "gekopieerd".
 */
export function ReferralShareButton({
  link,
  copyLabel,
  copiedLabel,
}: {
  link: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = React.useState(false);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard geblokkeerd — selecteer dan de tekst zodat de
      // gebruiker handmatig kan kopiëren.
    }
  };

  return (
    <div className="mt-2 flex items-stretch gap-2">
      <code className="min-w-0 flex-1 truncate rounded-md border border-(--color-border) bg-(--color-bg-warm) px-3 py-2 font-mono text-[12px] text-(--color-text)">
        {link}
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
        {copied ? copiedLabel : copyLabel}
      </button>
    </div>
  );
}
