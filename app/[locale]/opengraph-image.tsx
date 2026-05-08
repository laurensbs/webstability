import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Webstability";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OG({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isEs = locale === "es";

  // Match the homepage headline + accent emphasis. Two parts so the
  // accent half can render in italic terracotta.
  const lead = isEs ? "Tus clientes ven una web." : "Jouw klanten zien een website.";
  const accentLead = isEs ? "Tú" : "Jij";
  const accentTail = isEs ? "ves toda la empresa." : "ziet de hele zaak.";
  const tagline = isEs
    ? "un solo desarrollador · dos idiomas · costa brava"
    : "één ontwikkelaar · twee talen · costa brava";

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
        position: "relative",
      }}
    >
      {/* Soft accent blob, top-right */}
      <div
        style={{
          position: "absolute",
          top: -120,
          right: -120,
          width: 520,
          height: 520,
          borderRadius: 999,
          background: "radial-gradient(circle, rgba(201,97,79,0.35) 0%, rgba(201,97,79,0) 65%)",
        }}
      />

      {/* Top eyebrow — green dot + availability */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          fontFamily: "ui-monospace, monospace",
          fontSize: 18,
          letterSpacing: 4,
          color: "#6B645A",
          textTransform: "uppercase",
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: "#5A7A4A",
            boxShadow: "0 0 0 4px rgba(90,122,74,0.18)",
            display: "inline-block",
          }}
        />
        {isEs ? "costa brava · españa" : "costa brava · spanje"}
      </div>

      {/* Headline — two lines so the accent break is visible */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          fontSize: 76,
          lineHeight: 1.05,
          fontWeight: 500,
          maxWidth: 1040,
          letterSpacing: "-0.02em",
        }}
      >
        <span style={{ display: "flex" }}>{lead}</span>
        <span style={{ display: "flex" }}>
          <span
            style={{
              fontStyle: "italic",
              fontWeight: 300,
              color: "#C9614F",
              marginRight: "0.25em",
            }}
          >
            {accentLead}
          </span>
          <span>{accentTail}</span>
        </span>
      </div>

      {/* Footer row */}
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
