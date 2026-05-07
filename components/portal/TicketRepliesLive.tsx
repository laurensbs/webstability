"use client";

import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Bell } from "lucide-react";

type Reply = {
  id: string;
  body: string;
  createdAt: string; // ISO
  author: { id: string; name: string | null; email: string; isStaff: boolean };
};

type Strings = {
  noReplies: string;
  staffBadge: string;
};

const POLL_MS = 10_000;

/**
 * Polling-driven reply-list voor portal én admin ticket-detail. Eerste
 * render = SSR-replies (props), daarna fetch /api/tickets/{id}/replies
 * elke 10s. Bij nieuwe reply: bell-pulse + auto-scroll naar onderaan.
 *
 * Polling is genoeg voor het volume (paar tickets per dag); WebSocket
 * is overkill. Bij visibilitychange pauseren we polling om server-load
 * te besparen.
 */
export function TicketRepliesLive({
  ticketId,
  initialReplies,
  strings,
  locale,
}: {
  ticketId: string;
  initialReplies: Reply[];
  strings: Strings;
  /** Locale-string ipv Intl.DateTimeFormat: classes zijn niet
   * serializable van server- naar client-component (Next 16). */
  locale: string;
}) {
  const dateFmt = React.useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    [locale],
  );
  const reduce = useReducedMotion();
  const [replies, setReplies] = React.useState<Reply[]>(initialReplies);
  const [pulse, setPulse] = React.useState(false);
  const lastIdsRef = React.useRef(new Set(initialReplies.map((r) => r.id)));
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    let alive = true;
    let timeout: number | null = null;

    async function tick() {
      if (document.visibilityState !== "visible") {
        timeout = window.setTimeout(tick, POLL_MS);
        return;
      }
      try {
        const res = await fetch(`/api/tickets/${ticketId}/replies`, {
          cache: "no-store",
        });
        if (!alive || !res.ok) return;
        const data = (await res.json()) as { replies: Reply[] };
        const incoming = data.replies;
        const known = lastIdsRef.current;
        const hasNew = incoming.some((r) => !known.has(r.id));
        if (hasNew) {
          lastIdsRef.current = new Set(incoming.map((r) => r.id));
          setReplies(incoming);
          setPulse(true);
          window.setTimeout(() => setPulse(false), 1800);
          // Auto-scroll naar onderaan
          window.setTimeout(() => {
            containerRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
          }, 80);
        }
      } catch {
        // network hiccup — volgende tick probeert opnieuw.
      }
      if (alive) timeout = window.setTimeout(tick, POLL_MS);
    }

    timeout = window.setTimeout(tick, POLL_MS);
    return () => {
      alive = false;
      if (timeout) window.clearTimeout(timeout);
    };
  }, [ticketId]);

  return (
    <div className="space-y-3">
      <header className="flex items-center gap-2">
        <h3 className="font-mono text-[11px] tracking-[0.08em] text-(--color-muted)">
          {replies.length === 0 ? strings.noReplies : `${replies.length} ↩`}
        </h3>
        <AnimatePresence>
          {pulse ? (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={
                reduce ? { scale: 1, opacity: 1 } : { scale: [0, 1.3, 1], opacity: [0, 1, 0.7] }
              }
              exit={{ opacity: 0 }}
              transition={{ duration: 1.4 }}
              className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-(--color-accent)/15 text-(--color-accent)"
            >
              <Bell className="h-2.5 w-2.5" />
            </motion.span>
          ) : null}
        </AnimatePresence>
      </header>

      {replies.length === 0 ? null : (
        <div ref={containerRef} className="space-y-3">
          <AnimatePresence>
            {replies.map((r) => (
              <motion.article
                key={r.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className={`rounded-xl border p-4 ${
                  r.author.isStaff
                    ? "border-(--color-accent)/30 bg-(--color-accent-soft)/40"
                    : "border-(--color-border) bg-(--color-surface)"
                }`}
              >
                <header className="mb-2 flex items-center justify-between gap-3 text-[12px]">
                  <p className="font-medium text-(--color-text)">
                    {r.author.name ?? r.author.email}
                    {r.author.isStaff ? (
                      <span className="ml-2 inline-flex items-center rounded-full bg-(--color-wine)/10 px-1.5 py-0.5 text-[10px] font-medium text-(--color-wine)">
                        {strings.staffBadge}
                      </span>
                    ) : null}
                  </p>
                  <time className="font-mono text-[11px] text-(--color-muted)">
                    {dateFmt.format(new Date(r.createdAt))}
                  </time>
                </header>
                <p className="text-[14px] leading-[1.55] whitespace-pre-wrap text-(--color-text)">
                  {r.body}
                </p>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
