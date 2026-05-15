import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Armocromia — I colori che ti fanno splendere";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(135deg, #FAF7F2 0%, #F0EBE3 50%, #D4A99A 100%)",
          padding: "80px",
          fontFamily: "Georgia, serif",
          position: "relative",
        }}
      >
        {/* Decorative orbs */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(139,84,67,0.15) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-100px",
            left: "-100px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(212,169,154,0.25) 0%, transparent 70%)",
          }}
        />

        {/* Eyebrow */}
        <div
          style={{
            display: "flex",
            fontSize: 26,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "#8B5443",
            fontWeight: 600,
            marginBottom: 30,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Analisi cromatica AI
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            fontSize: 90,
            color: "#2A1810",
            textAlign: "center",
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            marginBottom: 30,
          }}
        >
          I colori che ti
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 110,
            fontStyle: "italic",
            color: "#8B5443",
            textAlign: "center",
            lineHeight: 1,
            marginBottom: 50,
          }}
        >
          fanno splendere
        </div>

        {/* Subtitle */}
        <div
          style={{
            display: "flex",
            fontSize: 28,
            color: "#3D2B20",
            textAlign: "center",
            maxWidth: 900,
            fontFamily: "system-ui, sans-serif",
            lineHeight: 1.4,
          }}
        >
          Dossier visivo professionale in 90 secondi · €29 una tantum
        </div>

        {/* Palette dots */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 60,
          }}
        >
          {["#C27C5C", "#8B4513", "#B97A6A", "#D4A76A", "#6B4423", "#C9956B"].map(
            (color) => (
              <div
                key={color}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  background: color,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
              />
            )
          )}
        </div>

        {/* Footer brand */}
        <div
          style={{
            position: "absolute",
            bottom: 50,
            display: "flex",
            fontSize: 32,
            color: "#2A1810",
            letterSpacing: "0.05em",
            fontFamily: "Georgia, serif",
          }}
        >
          Armocromia
        </div>
      </div>
    ),
    { ...size }
  );
}
