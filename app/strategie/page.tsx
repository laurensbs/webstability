import type { Metadata } from "next";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Lock } from "lucide-react";
import { readStrategieDoc } from "@/lib/strategie-doc";
import { Callout } from "@/components/marketing/blog/Callout";
import { PullQuote } from "@/components/marketing/blog/PullQuote";
import { UnlockForm } from "./UnlockForm";

export const metadata: Metadata = {
  title: "Strategie · privé",
  robots: { index: false, follow: false, nocache: true },
};

const COOKIE_NAME = "webstability-strategie-unlock";

function hash(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

const mdxComponents = { Callout, PullQuote };

export default async function StrategiePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const expected = process.env.STRATEGIE_PASSWORD;
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value ?? "";

  const unlocked = !!expected && !!token && safeEqual(token, hash(expected));

  if (!unlocked) {
    return (
      <main className="relative flex min-h-screen items-center justify-center bg-(--color-text) px-6 py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "radial-gradient(60% 60% at 50% 30%, rgba(201,97,79,0.4) 0%, transparent 70%)",
          }}
        />
        <div className="relative w-full max-w-sm space-y-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-(--color-bg)/15 bg-(--color-bg)/5 px-3 py-1 font-mono text-[10px] tracking-widest text-(--color-bg)/60 uppercase">
            <Lock className="h-3 w-3" />
            privé
          </div>
          <div className="space-y-3">
            <h1 className="font-serif text-3xl text-(--color-bg)">Strategie-doc</h1>
            <p className="text-sm leading-relaxed text-(--color-bg)/60">
              Niet voor klanten, niet voor zoekmachines. Voer het wachtwoord in om verder te lezen.
            </p>
          </div>
          <div className="flex justify-center">
            <UnlockForm error={!!error} />
          </div>
        </div>
      </main>
    );
  }

  const doc = await readStrategieDoc();
  if (!doc) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-(--color-text) px-6 py-24 text-(--color-bg)/70">
        <p className="font-mono text-sm">Document niet gevonden.</p>
      </main>
    );
  }

  const dateFmt = new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="dotted-bg flex flex-1 flex-col">
      <article className="px-6 pt-24 pb-24 md:pt-32">
        <div className="mx-auto max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-(--color-border) bg-(--color-surface) px-3 py-1 font-mono text-[10px] tracking-widest text-(--color-muted) uppercase">
            <Lock className="h-3 w-3" />
            privé · v{doc.version}
          </div>

          <header className="mt-8 space-y-4">
            <h1 className="text-4xl leading-[1.1] md:text-6xl">{doc.title}</h1>
            <p className="font-mono text-xs tracking-widest text-(--color-muted) uppercase">
              Laatst bijgewerkt: {doc.lastUpdated ? dateFmt.format(new Date(doc.lastUpdated)) : "—"}
              {" · "}
              Volgende review: {doc.nextReview ? dateFmt.format(new Date(doc.nextReview)) : "—"}
            </p>
          </header>

          <div className="prose-wb mt-12 [&_a]:text-(--color-accent) [&_a]:underline [&_h2]:mt-12 [&_h2]:font-serif [&_h2]:text-3xl [&_h3]:mt-8 [&_h3]:font-serif [&_h3]:text-2xl [&_hr]:my-12 [&_hr]:border-(--color-border) [&_li]:my-2 [&_ol]:mt-5 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:text-(--color-muted) [&_p]:mt-5 [&_p]:leading-relaxed [&_p]:text-(--color-muted) [&_table]:mt-6 [&_table]:w-full [&_table]:border-collapse [&_td]:border-b [&_td]:border-(--color-border) [&_td]:px-3 [&_td]:py-2 [&_td]:text-sm [&_th]:border-b [&_th]:border-(--color-border) [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-mono [&_th]:text-[11px] [&_th]:tracking-widest [&_th]:uppercase [&_ul]:mt-5 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:text-(--color-muted)">
            <MDXRemote source={doc.content} components={mdxComponents} />
          </div>
        </div>
      </article>
    </main>
  );
}
