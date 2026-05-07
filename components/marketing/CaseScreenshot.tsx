"use client";

import { useState } from "react";

type Props = {
  url: string;
  alt: string;
  ratio?: "16/10" | "4/3";
  className?: string;
  /** Optioneel: Vimeo share-URL (bv. https://vimeo.com/1190126706/dae28da598).
   * Als gezet renderen we een muted background-loop player ipv microlink-
   * screenshot. Card voelt dan levend i.p.v. statisch. */
  videoUrl?: string;
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

export function CaseScreenshot({ url, alt, ratio = "16/10", className = "", videoUrl }: Props) {
  const [loaded, setLoaded] = useState(false);
  const embed = videoUrl ? toVimeoEmbed(videoUrl) : null;

  return (
    <div
      className={`relative w-full overflow-hidden rounded-[14px] border border-(--color-border) bg-(--color-bg-warm) ${className}`}
      style={{ aspectRatio: ratio }}
    >
      {!loaded ? (
        <div className="absolute inset-0 animate-pulse bg-(--color-bg-warm)" aria-hidden />
      ) : null}

      {embed ? (
        // Vimeo background-player — geen audio, geen controls, autoplay loop.
        <iframe
          src={embed}
          title={alt}
          loading="lazy"
          allow="autoplay; fullscreen; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={() => setLoaded(true)}
          className={`absolute inset-0 h-full w-full border-0 transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={microlink(url)}
          alt={alt}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
        />
      )}
    </div>
  );
}
