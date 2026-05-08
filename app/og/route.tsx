import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title")?.slice(0, 120) ?? "Webstability";
  const eyebrow = searchParams.get("eyebrow")?.slice(0, 60) ?? "costa brava · spanje";

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 80,
        background: "#F5F0E8",
        color: "#1F1B16",
        fontFamily: "ui-serif, Georgia, serif",
      }}
    >
      <div
        style={{
          display: "flex",
          fontFamily: "ui-monospace, monospace",
          fontSize: 18,
          letterSpacing: 4,
          color: "#6B645A",
          textTransform: "uppercase",
        }}
      >
        {eyebrow}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 76,
          lineHeight: 1.1,
          fontWeight: 500,
          maxWidth: 1000,
        }}
      >
        {title}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 36,
          fontFamily: "ui-sans-serif, system-ui",
          fontWeight: 800,
          letterSpacing: -1,
        }}
      >
        <span>webstability</span>
        <span style={{ color: "#C9614F" }}>.</span>
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}
