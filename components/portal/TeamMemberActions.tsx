"use client";

import * as React from "react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { changeMemberRole, removeMember } from "@/app/actions/team";

type Role = "owner" | "member" | "read_only";

/**
 * Owner-only controls naast elk teamlid: rol-picker + verwijder-knop.
 * Browser-`confirm()` is hier prima — destructive maar niet onomkeerbaar
 * (gewoon de organizationId nulled; lid kan opnieuw uitgenodigd worden).
 * Voor de role-change geen confirm, dat is gewoon een select-onChange.
 */
export function TeamMemberActions({
  userId,
  currentRole,
  isSelf,
  labels,
}: {
  userId: string;
  currentRole: Role;
  isSelf: boolean;
  labels: {
    owner: string;
    member: string;
    read_only: string;
    remove: string;
    confirmRemove: string;
    selfDemoteBlocked: string;
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [role, setRole] = React.useState<Role>(currentRole);

  function onRoleChange(next: Role) {
    if (next === role) return;
    // Self-demote blokkeren we ook in de UI — server doet 'm óók maar
    // we willen geen toast-fout als de gebruiker per ongeluk klikt.
    if (isSelf && next !== "owner") {
      alert(labels.selfDemoteBlocked);
      return;
    }
    setRole(next);
    startTransition(async () => {
      try {
        await changeMemberRole(userId, next);
        router.refresh();
      } catch {
        setRole(currentRole);
      }
    });
  }

  function onRemove() {
    if (!confirm(labels.confirmRemove)) return;
    startTransition(async () => {
      try {
        await removeMember(userId);
        router.refresh();
      } catch {
        // swallow — eventually we add a toast
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={role}
        disabled={pending}
        onChange={(e) => onRoleChange(e.target.value as Role)}
        className="rounded-md border border-(--color-border) bg-(--color-bg) px-2 py-1 font-mono text-[11px] tracking-wider uppercase disabled:opacity-50"
      >
        <option value="owner">{labels.owner}</option>
        <option value="member">{labels.member}</option>
        <option value="read_only">{labels.read_only}</option>
      </select>
      {isSelf ? null : (
        <button
          type="button"
          onClick={onRemove}
          disabled={pending}
          className="rounded-md border border-(--color-border) px-2 py-1 font-mono text-[11px] tracking-wider text-(--color-muted) uppercase transition-colors hover:border-(--color-wine) hover:text-(--color-wine) disabled:opacity-50"
        >
          {labels.remove}
        </button>
      )}
    </div>
  );
}
