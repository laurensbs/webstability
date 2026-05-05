import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Webstability";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG({ params }: { params: { locale: string } }) {
  const isEs = params.locale === "es";
  const headline = isEs ? "Software que sigue funcionando." : "Software die blijft werken.";
  const tagline = isEs ? "un solo desarrollador · dos idiomas" : "één ontwikkelaar · twee talen";

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
        begur · costa brava
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 88,
          lineHeight: 1.05,
          fontWeight: 500,
          maxWidth: 980,
        }}
      >
        {headline}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
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
        <div
          style={{
            display: "flex",
            fontFamily: "ui-monospace, monospace",
            fontSize: 16,
            color: "#6B645A",
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          {tagline}
        </div>
      </div>
    </div>,
    size,
  );
}
