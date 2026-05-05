import { getTranslations } from "next-intl/server";

export async function LogoStrip() {
  const t = await getTranslations("home.logoStrip");
  const items = (await getTranslations()).raw("home.logoStrip.items") as string[];
  // Duplicate so the marquee can loop seamlessly.
  const loop = [...items, ...items];

  return (
    <section className="border-y border-(--color-border) bg-(--color-bg-warm)/40 py-10">
      <div className="mx-auto max-w-6xl px-6">
        <p className="text-center font-mono text-xs tracking-widest text-(--color-muted) uppercase">
          {t("title")}
        </p>
      </div>
      <div className="relative mt-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <ul
          className="flex w-max items-center gap-x-12 motion-safe:animate-[wb-marquee_28s_linear_infinite]"
          aria-hidden={false}
        >
          {loop.map((item, i) => (
            <li
              key={`${item}-${i}`}
              className="font-mono text-sm tracking-wide whitespace-nowrap text-(--color-muted)"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
