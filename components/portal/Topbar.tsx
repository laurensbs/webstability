import { signOut } from "@/lib/auth";
import { LangSwitcher } from "@/components/shared/LangSwitcher";
import { MobileNav } from "@/components/portal/Sidebar";
import { Link } from "@/i18n/navigation";

type Labels = React.ComponentProps<typeof MobileNav>["labels"];

export function Topbar({
  userEmail,
  orgName,
  logoutLabel,
  navLabels,
  isStaff = false,
}: {
  userEmail: string;
  orgName: string | null;
  logoutLabel: string;
  navLabels: Labels;
  isStaff?: boolean;
}) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-(--color-border) bg-(--color-bg)/80 px-4 py-3 backdrop-blur-sm md:px-6 md:py-4">
      <div className="flex min-w-0 items-center gap-3">
        <MobileNav labels={navLabels} />
        <div className="min-w-0">
          {orgName ? <p className="truncate text-sm font-medium">{orgName}</p> : null}
          <p className="truncate font-mono text-xs text-(--color-muted)">{userEmail}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {isStaff ? (
          <Link
            href="/admin"
            className="rounded-md border border-(--color-accent) px-3 py-1.5 font-mono text-xs tracking-widest text-(--color-accent) uppercase transition-colors hover:bg-(--color-accent-soft)"
          >
            admin
          </Link>
        ) : null}
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
