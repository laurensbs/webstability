"use client";

import * as React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ServicePicker, type ServiceKind, type ServicePickerStrings } from "./ServicePicker";
import { CustomServiceIntake, type CustomServiceIntakeStrings } from "./CustomServiceIntake";
import type { CustomServiceKind } from "@/app/actions/custom-intake";

/**
 * Top-level wrapper voor /aanvragen.
 *
 * Stap 1: bezoeker kiest een paneel (ServicePicker — 4 keuzes).
 * Stap 2: korte intake voor het gekozen paneel (CustomServiceIntake)
 *         → bedankscherm met directe Cal-popup voor kennismaking.
 *
 * Sinds de pivot naar abonnementsmodel zijn website/webshop verwijderd
 * en daarmee de configurator-tak. Alle vier de panelen lopen nu door
 * dezelfde intake-flow — uniform aanbod = uniforme funnel.
 */

type Step = { kind: "picker" } | { kind: "custom"; service: CustomServiceKind };

export function AanvragenWizard({
  locale,
  pickerStrings,
  customStrings,
}: {
  locale: string;
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
            onPick={(kind: ServiceKind) => {
              setStep({ kind: "custom", service: kind });
            }}
          />
        </motion.div>
      ) : (
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
      )}
    </AnimatePresence>
  );
}
