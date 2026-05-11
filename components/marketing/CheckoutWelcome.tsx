"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { ConfettiBurst } from "@/components/animate/ConfettiBurst";
import { Eyebrow } from "@/components/animate/Eyebrow";

/**
 * Celebration-scherm na een geslaagde Stripe-checkout (anon-flow). De
 * org + user zijn server-side al aangemaakt; dit is alleen het "je bent
 * binnen"-moment vóór de redirect naar /login waar de magic-link begint.
 * Auto-redirect na ~4,5s, of meteen via de knop.
 */
export function CheckoutWelcome({
  email,
  redirectTo,
  strings,
}: {
  email: string;
  redirectTo: string;
  strings: {
    eyebrow: string;
    title: string;
    body: string;
    cta: string;
    redirecting: string;
  };
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [fire, setFire] = React.useState(false);

  React.useEffect(() => {
    const burst = window.setTimeout(() => setFire(true), 250);
    const reset = window.setTimeout(() => setFire(false), 1900);
    const go = window.setTimeout(() => router.replace(redirectTo), 4500);
    return () => {
      window.clearTimeout(burst);
      window.clearTimeout(reset);
      window.clearTimeout(go);
    };
  }, [router, redirectTo]);

  return (
    <main className="dotted-bg flex min-h-screen items-center justify-center px-6 py-16">
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md text-center"
      >
        <ConfettiBurst fire={fire} anchor="top" variant="success" />
        <Eyebrow className="inline-block">{strings.eyebrow}</Eyebrow>
        <h1 className="mt-4 font-serif text-[clamp(28px,4vw,40px)] leading-tight">
          {strings.title}
        </h1>
        <p className="mt-4 text-[15px] leading-[1.6] text-(--color-muted)">
          {strings.body.replace("{email}", email)}
        </p>
        <div className="mt-8">
          <button
            type="button"
            onClick={() => router.replace(redirectTo)}
            className="inline-flex items-center gap-2 rounded-full bg-(--color-text) px-5 py-2.5 text-[14px] font-medium text-(--color-bg) transition-opacity hover:opacity-90"
          >
            {strings.cta}
          </button>
        </div>
        <p className="mt-4 font-mono text-[11px] tracking-wide text-(--color-muted)/70">
          {strings.redirecting}
        </p>
      </motion.div>
    </main>
  );
}
