import { ImageResponse } from "next/og";

export const alt = "AIFM — Gestión financiera para alojamientos";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ background: "linear-gradient(135deg, #09090f, #251044)", color: "white", display: "flex", height: "100%", width: "100%", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", padding: "72px" }}>
          <div style={{ color: "#c084fc", fontSize: 32, letterSpacing: 8 }}>AIFM</div>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 72, fontWeight: 700, marginTop: 24 }}>
            <span>Gestión financiera</span>
            <span>para alojamientos</span>
          </div>
          <div style={{ color: "#cbd5e1", fontSize: 30, marginTop: 28 }}>Finanzas, reservas y rentabilidad en un solo lugar.</div>
        </div>
      </div>
    ),
    size,
  );
}
