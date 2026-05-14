"use client";

import { useState } from "react";

type Props = {
  url: string;
  alt: string;
  ratio?: "16/10" | "4/3" | "5/3" | "3/2";
  className?: string;
  /** Optioneel: Vimeo share-URL (bv. https://vimeo.com/1190126706/dae28da598).
   * Als gezet renderen we een muted background-loop player ipv microlink-
   * screenshot. Card voelt dan levend i.p.v. statisch. */
  videoUrl?: string;
  /** Forceer placeholder-mode i.p.v. live screenshot. Microlink-screenshots
   * zijn vaak van twijfelachtige kwaliteit (mobile/dark-mode missers,
   * lazy-loaded content niet zichtbaar). Voor cases zonder eigen video
   * is een minimalistische gradient + URL-label vaak betrouwbaarder dan
   * een rommelige live-screenshot.
   *
   * Default: true (placeholder is veiliger dan microlink).
   * Zet expliciet op false om de oude microlink-screenshot te krijgen. */
  useScreenshot?: boolean;
  /** Optioneel: korte sub-tekst onder de URL (bv. "verhuurplatform"). */
  subtitle?: string;
};

const microlink = (url: string) =>
  `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url&viewport.width=1280&viewport.height=800`;

/**
 * Vimeo share-URLs zoals https://vimeo.com/{id}/{hash} omzetten naar de
 * background-player embed. background=1 verbergt UI, autoplay+loop+muted
 * implicit — exact het gedrag dat we voor een case-card willen.
 */
function toVimeoEmbed(shareUrl: string): string | null {
  try {
    const u = new URL(shareUrl);
    if (!u.hostname.includes("vimeo.com")) return null;
    const parts = u.pathname.split("/").filter(Boolean);
    const id = parts[0];
    const hash = parts[1];
    if (!id) return null;
    const params = new URLSearchParams({
      background: "1",
      autoplay: "1",
      loop: "1",
      muted: "1",
      dnt: "1",
    });
    if (hash) params.set("h", hash);
    return `https://player.vimeo.com/video/${id}?${params.toString()}`;
  } catch {
    return null;
  }
}

/** Strip protocol + trailing slash voor mooi label. */
function prettyHost(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
}

export function CaseScreenshot({
  url,
  alt,
  ratio = "4/3",
  className = "",
  videoUrl,
  useScreenshot = false,
  subtitle,
}: Props) {
  const [loaded, setLoaded] = useState(false);
  const embed = videoUrl ? toVimeoEmbed(videoUrl) : null;

  return (
    <div
      className={`rounded-card relative w-full overflow-hidden border border-(--color-border) bg-(--color-bg-warm) ${className}`}
      style={{ aspectRatio: ratio }}
    >
      {embed ? (
        <>
          {!loaded ? (
            <div className="absolute inset-0 animate-pulse bg-(--color-bg-warm)" aria-hidden />
          ) : null}
          {/* Vimeo background-player — geen audio, geen controls, autoplay loop. */}
          <iframe
            src={embed}
            title={alt}
            loading="lazy"
            allow="autoplay; fullscreen; picture-in-picture"
            referrerPolicy="strict-origin-when-cross-origin"
            onLoad={() => setLoaded(true)}
            className={`absolute inset-0 h-full w-full border-0 transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
          />
        </>
      ) : useScreenshot ? (
        <>
          {!loaded ? (
            <div className="absolute inset-0 animate-pulse bg-(--color-bg-warm)" aria-hidden />
          ) : null}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={microlink(url)}
            alt={alt}
            loading="lazy"
            onLoad={() => setLoaded(true)}
            className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
          />
        </>
      ) : (
        // Minimalistische placeholder: gradient + URL-label + browser-chrome
        // header. Bewust niet-een-screenshot — schoner dan een rommelige
        // microlink-render, en consistent over alle cases. Stijl matched
        // de bestaande site (warm cream → soft accent).
        <div
          className="absolute inset-0 flex flex-col"
          style={{
            background:
              "linear-gradient(135deg, var(--color-bg-warm) 0%, var(--color-accent-soft) 100%)",
          }}
          aria-label={alt}
          role="img"
        >
          {/* Browser chrome strook bovenin — herinnert aan een echt scherm
              zonder een lelijke screenshot te tonen. */}
          <div className="flex items-center gap-1.5 border-b border-(--color-border)/50 bg-(--color-surface)/60 px-3 py-2 backdrop-blur-sm">
            <span aria-hidden className="h-2 w-2 rounded-full bg-(--color-border)" />
            <span aria-hidden className="h-2 w-2 rounded-full bg-(--color-border)" />
            <span aria-hidden className="h-2 w-2 rounded-full bg-(--color-border)" />
            <span className="ml-2 truncate font-mono text-[11px] text-(--color-muted)">
              {prettyHost(url)}
            </span>
          </div>

          {/* Center label */}
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <p className="font-mono text-[10px] tracking-widest text-(--color-accent) uppercase">
              {prettyHost(url)}
            </p>
            {subtitle ? (
              <p className="mt-2 font-serif text-lg text-(--color-text)/70 italic">{subtitle}</p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
