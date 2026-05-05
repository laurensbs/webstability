export function PageHeader({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string;
  title: React.ReactNode;
  lede?: string;
}) {
  return (
    <header className="px-6 pt-24 pb-16 md:pt-32">
      <div className="mx-auto max-w-4xl space-y-6">
        <p className="font-mono text-xs tracking-widest text-(--color-muted) uppercase">
          {eyebrow}
        </p>
        <h1 className="text-4xl leading-[1.1] md:text-6xl">{title}</h1>
        {lede ? <p className="max-w-2xl text-lg text-(--color-muted)">{lede}</p> : null}
      </div>
    </header>
  );
}
