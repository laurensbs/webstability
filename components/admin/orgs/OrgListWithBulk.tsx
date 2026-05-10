"use client";

import * as React from "react";
import { toast } from "sonner";
import { OrgTable, type OrgRow } from "@/components/admin/OrgTable";
import { BulkActionBar } from "@/components/admin/orgs/BulkActionBar";
import { BulkMailModal } from "@/components/admin/orgs/BulkMailModal";
import type { ActionResult } from "@/lib/action-result";

type Strings = {
  table: React.ComponentProps<typeof OrgTable>["strings"];
  selectionLabel: string;
  bulk: {
    selected: string;
    mailAction: string;
    clear: string;
  };
  modal: React.ComponentProps<typeof BulkMailModal>["strings"];
  toast: { success: string; error: string };
};

/**
 * Wrapper rond OrgTable die multi-select + bulk-mail aan elkaar
 * koppelt. Selection-state is local; URL-persistentie zou onnodige
 * complexiteit zijn (admin werkt aan één tabblad tegelijk).
 *
 * `bulkMail` is een server-action die een ActionResult teruggeeft;
 * BulkMailModal verwacht echter `(fd) => Promise<void>`, dus we wrappen
 * 'm hier en toasten op het resultaat.
 */
export function OrgListWithBulk({
  orgs,
  locale,
  strings,
  bulkMail,
}: {
  orgs: OrgRow[];
  locale: string;
  strings: Strings;
  bulkMail: (formData: FormData) => Promise<ActionResult>;
}) {
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [modalOpen, setModalOpen] = React.useState(false);

  const onToggle = React.useCallback((orgId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(orgId)) next.delete(orgId);
      else next.add(orgId);
      return next;
    });
  }, []);

  const onClear = React.useCallback(() => setSelected(new Set()), []);

  const wrappedBulkAction = React.useCallback(
    async (formData: FormData) => {
      const result = await bulkMail(formData);
      if (result.ok) {
        toast.success(strings.toast.success);
        setSelected(new Set());
      } else {
        toast.error(strings.toast.error);
      }
    },
    [bulkMail, strings.toast.success, strings.toast.error],
  );

  return (
    <>
      <OrgTable
        orgs={orgs}
        locale={locale}
        strings={strings.table}
        selection={{
          selected,
          onToggle,
          label: strings.selectionLabel,
        }}
      />

      <BulkActionBar
        selectedCount={selected.size}
        onClear={onClear}
        onMail={() => setModalOpen(true)}
        strings={strings.bulk}
      />

      <BulkMailModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        orgIds={Array.from(selected)}
        bulkAction={wrappedBulkAction}
        strings={strings.modal}
      />
    </>
  );
}
