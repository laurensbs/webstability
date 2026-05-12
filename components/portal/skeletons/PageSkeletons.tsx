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

/** Eén card-blok (header + een paar regels). Bouwsteen voor andere skeletons. */
function CardBlockSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-lg border border-(--color-border) bg-(--color-surface) p-6">
      <div className="flex items-center justify-between gap-4">
        <Shimmer width={140} height={16} />
        <Shimmer width={48} height={10} />
      </div>
      <div className="mt-4 space-y-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <Shimmer key={i} width={i === lines - 1 ? "60%" : "100%"} height={12} />
        ))}
      </div>
    </div>
  );
}

/** Dashboard: 4 stat-cards bovenaan + een 2-koloms grid van content-cards. */
export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <Shimmer width={200} height={30} rounded="md" />
        <Shimmer width={320} height={14} />
      </header>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-(--color-border) bg-(--color-surface) p-5"
          >
            <Shimmer width={64} height={10} />
            <Shimmer className="mt-3" width={56} height={28} />
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardBlockSkeleton key={i} lines={i % 2 ? 4 : 3} />
        ))}
      </div>
    </div>
  );
}

/** Detail-pagina (ticket-thread, project-detail): header + grote card + zijblok. */
export function DetailSkeleton() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <Shimmer width={120} height={12} />
        <Shimmer width="60%" height={30} rounded="md" />
      </header>
      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardBlockSkeleton key={i} lines={4} />
          ))}
        </div>
        <div className="space-y-4">
          <CardBlockSkeleton lines={2} />
          <CardBlockSkeleton lines={3} />
        </div>
      </div>
    </div>
  );
}

/** Formulier-pagina (nieuwe ticket, instellingen): header + gestapelde velden. */
export function FormSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header className="space-y-2">
        <Shimmer width={200} height={30} rounded="md" />
        <Shimmer width="80%" height={14} />
      </header>
      <div className="space-y-5 rounded-lg border border-(--color-border) bg-(--color-surface) p-6 md:p-8">
        {Array.from({ length: fields }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Shimmer width={120} height={11} />
            <Shimmer height={i === fields - 1 ? 96 : 40} rounded="md" />
          </div>
        ))}
        <Shimmer width={140} height={40} rounded="md" />
      </div>
    </div>
  );
}

/** Generieke kaarten-pagina (monitoring / seo): header + losse content-cards. */
export function CardsPageSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <Shimmer width={200} height={30} rounded="md" />
        <Shimmer width={300} height={14} />
      </header>
      <div className="space-y-4">
        {Array.from({ length: cards }).map((_, i) => (
          <CardBlockSkeleton key={i} lines={4} />
        ))}
      </div>
    </div>
  );
}
