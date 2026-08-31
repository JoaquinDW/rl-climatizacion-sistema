import type { Metadata } from "next"
import { Barlow, Barlow_Condensed } from "next/font/google"
import { GeistMono } from "geist/font/mono"
import { MARCA, SITIO_URL } from "@/lib/marca"
import "./globals.css"

// Titulares: condensada, contundente y con carácter automotor.
const barlowCondensed = Barlow_Condensed({
  weight: ["500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
})

// Cuerpo: la misma familia en su variante regular para mantener cohesión.
const barlow = Barlow({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const DESCRIPCION =
  "Sorteos oficiales de Faustino Motors. Comprá tus chances y participá por vehículos y premios."

export const metadata: Metadata = {
  metadataBase: new URL(SITIO_URL),
  title: MARCA,
  description: DESCRIPCION,
  icons: {
    icon: "/favicon-faustino.png",
    shortcut: "/favicon-faustino.png",
    apple: "/apple-touch-icon-faustino.png",
  },
  openGraph: {
    type: "website",
    url: SITIO_URL,
    siteName: MARCA,
    title: MARCA,
    description: DESCRIPCION,
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    title: MARCA,
    description: DESCRIPCION,
    images: ["/opengraph-image"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="es"
      className={`${barlowCondensed.variable} ${barlow.variable} ${GeistMono.variable}`}
    >
      <body className="font-sans">{children}</body>
    </html>
  )
}
