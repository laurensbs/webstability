"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";

const SESSION_KEY = "ws-demo-followup-shown";

/**
 * Niet-blokkerende modal die getoond wordt zodra de demo-bezoeker
 * een cta_clicked event fire't (via een global 'demo-cta-clicked'
 * CustomEvent). Vraagt om email zodat we ze na de demo kunnen volgen.
 *
 * Toont maximaal één keer per sessie (sessionStorage) — niet
 * agressief, geen overlay, gewoon een floating card rechtsonder.
 * Plaats deze component één keer in een client-context (bv. portal
 * layout) zodat hij altijd luistert wanneer isDemo=true.
 */
export function DemoFollowUpModal({
  role,
  strings,
}: {
  role: "portal" | "admin";
  strings: {
    title: string;
    body: string;
    placeholder: string;
    submit: string;
    submitting: string;
    dismiss: string;
    successToast: string;
    errorToast: string;
    invalidEmail: string;
  };
}) {
  const [open, setOpen] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const onCta = () => {
      if (sessionStorage.getItem(SESSION_KEY) === "1") return;
      // Korte delay zodat de gebruiker eerst de CTA-actie ziet
      setTimeout(() => {
        sessionStorage.setItem(SESSION_KEY, "1");
        setOpen(true);
      }, 1500);
    };
    window.addEventListener("demo-cta-clicked", onCta);
    return () => window.removeEventListener("demo-cta-clicked", onCta);
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error(strings.invalidEmail);
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/demo/follow-up", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: trimmed, role, source: "demo_modal" }),
      });
      if (!res.ok) throw new Error("bad_response");
      toast.success(strings.successToast);
      setOpen(false);
    } catch {
      toast.error(strings.errorToast);
    } finally {
      setPending(false);
    }
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.25 }}
          className="rounded-card fixed right-4 bottom-4 z-50 w-[min(360px,calc(100vw-2rem))] border border-(--color-border) bg-(--color-surface) p-5 shadow-xl"
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={strings.dismiss}
            className="absolute top-3 right-3 inline-flex h-7 w-7 items-center justify-center rounded-full text-(--color-muted) transition-colors hover:bg-(--color-bg-warm) hover:text-(--color-text)"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2.2} />
          </button>
          <p className="font-mono text-[10px] tracking-widest text-(--color-accent) uppercase">
            {`// demo`}
          </p>
          <h2 className="mt-2 font-serif text-[18px] leading-tight text-(--color-text)">
            {strings.title}
          </h2>
          <p className="mt-2 text-[13px] leading-[1.55] text-(--color-muted)">{strings.body}</p>
          <form onSubmit={onSubmit} className="mt-3 flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={strings.placeholder}
              autoFocus
              className="block w-full rounded-md border border-(--color-border) bg-(--color-bg) px-3 py-2 text-[13px] focus:border-(--color-accent)/60 focus:outline-none"
            />
            <button
              type="submit"
              disabled={pending}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-(--color-text) px-3 py-2 text-[12px] font-medium text-(--color-bg) transition-colors hover:bg-(--color-text)/90 disabled:opacity-60"
            >
              {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              {pending ? strings.submitting : strings.submit}
            </button>
          </form>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
