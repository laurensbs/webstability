import { signOut } from "@/lib/auth";
import { LangSwitcher } from "@/components/shared/LangSwitcher";

export function Topbar({
  userEmail,
  orgName,
  logoutLabel,
}: {
  userEmail: string;
  orgName: string | null;
  logoutLabel: string;
}) {
  return (
    <header className="flex items-center justify-between border-b border-(--color-border) bg-(--color-bg)/80 px-6 py-4 backdrop-blur-sm">
      <div className="min-w-0">
        {orgName ? <p className="truncate text-sm font-medium">{orgName}</p> : null}
        <p className="truncate font-mono text-xs text-(--color-muted)">{userEmail}</p>
      </div>
      <div className="flex items-center gap-4">
        <LangSwitcher />
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="rounded-md border border-(--color-border) px-3 py-1.5 text-xs transition-colors hover:bg-(--color-bg-warm)"
          >
            {logoutLabel}
          </button>
        </form>
      </div>
    </header>
  );
}
