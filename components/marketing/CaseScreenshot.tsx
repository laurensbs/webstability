"use client";

import { useState } from "react";

type Props = {
  url: string;
  alt: string;
  ratio?: "16/10" | "4/3";
  className?: string;
};

const microlink = (url: string) =>
  `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url&viewport.width=1280&viewport.height=800`;

export function CaseScreenshot({ url, alt, ratio = "16/10", className = "" }: Props) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div
      className={`relative w-full overflow-hidden rounded-[14px] border border-(--color-border) bg-(--color-bg-warm) ${className}`}
      style={{ aspectRatio: ratio }}
    >
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
    </div>
  );
}
