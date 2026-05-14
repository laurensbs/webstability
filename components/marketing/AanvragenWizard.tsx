"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ServicePicker, type ServiceKind, type ServicePickerStrings } from "./ServicePicker";
import { ProjectConfigurator } from "./ProjectConfigurator";
import { CustomServiceIntake, type CustomServiceIntakeStrings } from "./CustomServiceIntake";
import type { CustomServiceKind } from "@/app/actions/custom-intake";
import type { ConfiguratorStrings } from "@/lib/configurator-strings";

/**
 * Top-level wrapper voor /aanvragen.
 *
 * Stap 1: bezoeker kiest dienst (ServicePicker — 6 keuzes).
 * Stap 2a: website/webshop → bestaande ProjectConfigurator (ongewijzigd).
 * Stap 2b: maatwerk-dienst → CustomServiceIntake (kort formulier + Cal-popup).
 *
 * State leeft hier zodat we tussen stappen heen en weer kunnen navigeren
 * zonder URL-changes (één pagina = één flow). AnimatePresence wisselt
 * tussen views met dezelfde easing als de rest van de site.
 */

type Step =
  | { kind: "picker" }
  | { kind: "configurator"; service: "website" | "webshop" }
  | { kind: "custom"; service: CustomServiceKind };

const CUSTOM_KINDS: ReadonlyArray<CustomServiceKind> = [
  "verhuur",
  "klantportaal",
  "reparatie",
  "admin",
];

function isCustom(kind: ServiceKind): kind is CustomServiceKind {
  return (CUSTOM_KINDS as readonly ServiceKind[]).includes(kind);
}

export function AanvragenWizard({
  locale,
  calLink,
  configuratorStrings,
  pickerStrings,
  customStrings,
}: {
  locale: string;
  calLink: string | null;
  configuratorStrings: ConfiguratorStrings;
  pickerStrings: ServicePickerStrings;
  /** Per kind een complete intake strings-set. */
  customStrings: Record<CustomServiceKind, CustomServiceIntakeStrings>;
}) {
  const [step, setStep] = React.useState<Step>({ kind: "picker" });

  return (
    <AnimatePresence mode="wait">
      {step.kind === "picker" ? (
        <motion.div
          key="picker"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <ServicePicker
            strings={pickerStrings}
            onPick={(kind, flow) => {
              if (flow === "configurable" && (kind === "website" || kind === "webshop")) {
                setStep({ kind: "configurator", service: kind });
              } else if (isCustom(kind)) {
                setStep({ kind: "custom", service: kind });
              }
            }}
          />
        </motion.div>
      ) : null}

      {step.kind === "configurator" ? (
        <motion.div
          key="configurator"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Terug-link naar picker */}
          <button
            type="button"
            onClick={() => setStep({ kind: "picker" })}
            className="mb-4 inline-flex items-center gap-1 font-mono text-[11px] tracking-widest text-(--color-muted) uppercase transition-colors hover:text-(--color-text)"
          >
            ← {pickerStrings.eyebrow}
          </button>
          <ProjectConfigurator
            calLink={calLink}
            locale={locale}
            strings={configuratorStrings}
            defaultKind={step.service}
          />
        </motion.div>
      ) : null}

      {step.kind === "custom" ? (
        <motion.div
          key={`custom-${step.service}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        >
          <CustomServiceIntake
            kind={step.service}
            locale={locale}
            strings={customStrings[step.service]}
            onBack={() => setStep({ kind: "picker" })}
          />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
