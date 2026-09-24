import { ImageResponse } from "next/og"
import { headers } from "next/headers"
import logoFaustino from "@/public/logo-faustino.jpeg"
import { MARCA } from "@/lib/marca"

export const runtime = "edge"
export const alt = "Faustino Motors — Sorteos oficiales"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OpenGraphImage() {
  const requestHeaders = await headers()
  const host = requestHeaders.get("host") || "localhost:3000"
  const protocol = requestHeaders.get("x-forwarded-proto") || "http"
  const logoUrl = new URL(logoFaustino.src, `${protocol}://${host}`).toString()

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          overflow: "hidden",
          color: "#FFF9E8",
          background:
            "radial-gradient(circle at 72% 20%, rgba(214, 168, 47,.24), transparent 34%), linear-gradient(135deg, #050505 0%, #0d0c09 58%, #050505 100%)",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            opacity: 0.16,
            backgroundImage:
              "repeating-linear-gradient(135deg, transparent 0, transparent 19px, rgba(255,255,255,.12) 20px, transparent 21px)",
          }}
        />
        <div
          style={{
            width: 1040,
            display: "flex",
            alignItems: "center",
            gap: 64,
            padding: "52px 64px",
            border: "1px solid rgba(215, 193, 128,.24)",
            borderTop: "6px solid #D6A82F",
            background: "rgba(17,19,24,.86)",
            boxShadow: "0 32px 90px rgba(0,0,0,.46)",
          }}
        >
          {/* Se coloca el raster oficial sin modificar su geometría. */}
          <img
            src={logoUrl}
            width="320"
            height="240"
            alt=""
            style={{ objectFit: "contain" }}
          />
          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
            <div
              style={{
                color: "#D6A82F",
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: 8,
                textTransform: "uppercase",
              }}
            >
              Sorteos oficiales
            </div>
            <div
              style={{
                marginTop: 12,
                fontSize: 72,
                lineHeight: 0.92,
                fontWeight: 800,
                letterSpacing: -2,
                textTransform: "uppercase",
              }}
            >
              {MARCA}
            </div>
            <div
              style={{
                width: 110,
                height: 7,
                marginTop: 32,
                background: "#D6A82F",
                transform: "skewX(-28deg)",
              }}
            />
            <div
              style={{
                marginTop: 24,
                color: "#D7C180",
                fontSize: 27,
                letterSpacing: 1,
              }}
            >
              Vehículos · premios · transmisiones en vivo
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  )
}
