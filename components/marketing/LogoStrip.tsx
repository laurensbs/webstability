import { getTranslations } from "next-intl/server";

export async function LogoStrip() {
  const t = await getTranslations("home.logoStrip");
  const items = (await getTranslations()).raw("home.logoStrip.items") as string[];

  return (
    <section className="border-y border-(--color-border) bg-(--color-bg-warm)/40 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <p className="text-center font-mono text-xs tracking-widest text-(--color-muted) uppercase">
          {t("title")}
        </p>
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-(--color-muted)">
          {items.map((item) => (
            <li key={item} className="font-mono text-sm tracking-wide">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
