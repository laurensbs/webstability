"use client";

import * as React from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { Check } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/Button";
import { useToastFormStatus } from "@/components/portal/ToastForm";

type Props = Omit<ButtonProps, "type" | "loading"> & {
  /** Tekst die verschijnt na succes — bv. "verzonden", "opgeslagen". */
  successLabel?: string;
};

const SUCCESS_HOLD_MS = 1800;

/**
 * Submit-knop met vloeiende state-feedback voor admin/portal-forms.
 * Drie zichtbare states: idle (default Button), pending (spinner), en
 * success (checkmark + "verzonden"-tekst die na ~1.8s terug fade'd
 * naar idle). Read pending uit ToastForm-context, dus drop-in
 * vervanger voor `<ToastSubmitButton>` met extra knipoog.
 *
 * Geen error-state — die wordt al door ToastForm via sonner getoond,
 * zou hier dubbel zijn.
 */
export function SubmitFeedback({ successLabel, children, ...rest }: Props) {
  const reduce = useReducedMotion();
  const { pending } = useToastFormStatus();
  const [showSuccess, setShowSuccess] = React.useState(false);
  const wasPendingRef = React.useRef(false);

  React.useEffect(() => {
    // Detecteer overgang pending → !pending = succesmoment.
    if (wasPendingRef.current && !pending) {
      setShowSuccess(true);
      const timer = window.setTimeout(() => setShowSuccess(false), SUCCESS_HOLD_MS);
      return () => window.clearTimeout(timer);
    }
    wasPendingRef.current = pending;
  }, [pending]);

  return (
    <Button {...rest} type="submit" loading={pending}>
      <AnimatePresence mode="wait" initial={false}>
        {showSuccess && !pending ? (
          <motion.span
            key="success"
            initial={reduce ? false : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-1.5"
          >
            <Check className="h-3.5 w-3.5" />
            {successLabel ?? "verzonden"}
          </motion.span>
        ) : (
          <motion.span
            key="idle"
            initial={false}
            animate={{ opacity: 1 }}
            exit={reduce ? undefined : { opacity: 0 }}
            className="inline-flex items-center gap-1.5"
          >
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
}
