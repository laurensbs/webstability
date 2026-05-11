import { Shimmer } from "@/components/animate/Shimmer";

/**
 * Layout-matchende skeletons voor de portal-list-pagina's. Worden door de
 * route-`loading.tsx` getoond terwijl de server-component z'n DB-query doet.
 * Afmetingen volgen de echte cards/rows zodat er geen layout-shift is.
 */

function PageHeaderSkeleton() {
  return (
    <header>
      <Shimmer width={220} height={34} rounded="md" />
    </header>
  );
}

/** Grid van project-cards (2 koloms op md+). */
export function ProjectsSkeleton() {
  return (
    <div className="space-y-8">
      <PageHeaderSkeleton />
      <ul className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <li
            key={i}
            className="rounded-lg border border-(--color-border) bg-(--color-surface) p-6"
          >
            <div className="flex items-baseline justify-between gap-4">
              <Shimmer width="55%" height={18} />
              <Shimmer width={56} height={10} />
            </div>
            <Shimmer className="mt-3" width={88} height={18} rounded="full" />
            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between">
                <Shimmer width={64} height={10} />
                <Shimmer width={28} height={10} />
              </div>
              <Shimmer height={6} rounded="full" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Lijst-rijen binnen één omkadering (tickets / facturen). */
export function ListRowsSkeleton({
  rows = 5,
  withHeaderAction = false,
}: {
  rows?: number;
  withHeaderAction?: boolean;
}) {
  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between gap-4">
        <Shimmer width={220} height={34} rounded="md" />
        {withHeaderAction ? <Shimmer width={120} height={40} rounded="md" /> : null}
      </header>
      <ul className="divide-y divide-(--color-border) overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface)">
        {Array.from({ length: rows }).map((_, i) => (
          <li key={i} className="flex items-center gap-4 px-5 py-4">
            <Shimmer width={40} height={40} rounded="md" />
            <div className="min-w-0 flex-1 space-y-2">
              <Shimmer width="40%" height={14} />
              <Shimmer width="28%" height={11} />
            </div>
            <Shimmer width={64} height={18} rounded="full" />
          </li>
        ))}
      </ul>
    </div>
  );
}
