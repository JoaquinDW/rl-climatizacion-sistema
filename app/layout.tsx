import type { Metadata } from "next"
import { Barlow_Condensed, Inter } from "next/font/google"
import { GeistMono } from "geist/font/mono"
import { MARCA, SITIO_URL } from "@/lib/marca"
import "./globals.css"

// Titulares y números: condensada e industrial, tono técnico de climatización.
const barlowCondensed = Barlow_Condensed({
  weight: ["500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
})

// Cuerpo: neutra y muy legible.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
})

const DESCRIPCION =
  "Sorteos de RL Climatización. Comprá tus chances y participá por equipos de climatización."

export const metadata: Metadata = {
  metadataBase: new URL(SITIO_URL),
  title: MARCA,
  description: DESCRIPCION,
  icons: {
    icon: "/logo-rl.png",
    shortcut: "/logo-rl.png",
    apple: "/logo-rl.png",
  },
  openGraph: {
    type: "website",
    url: SITIO_URL,
    siteName: MARCA,
    title: MARCA,
    description: DESCRIPCION,
    images: [
      {
        url: "/og-rl.jpg",
        width: 1200,
        height: 630,
        alt: `Logo de ${MARCA}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: MARCA,
    description: DESCRIPCION,
    images: ["/og-rl.jpg"],
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
      className={`${barlowCondensed.variable} ${inter.variable} ${GeistMono.variable}`}
    >
      <body className="font-sans">{children}</body>
    </html>
  )
}
