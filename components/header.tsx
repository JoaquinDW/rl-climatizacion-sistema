"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu, X } from "lucide-react"
import Image from "next/image"
import { MARCA } from "@/lib/marca"

const NAV_LINKS = [
  { href: "#packs", label: "Packs" },
  { href: "#premios", label: "Premios" },
  { href: "#consulta", label: "Mis números" },
  { href: "#ganadores", label: "Ganadores" },
]

export function Header({ marca = MARCA }: { marca?: string }) {
  const [menuAbierto, setMenuAbierto] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-[#08151a]/90 backdrop-blur-md border-b border-[#4fafc4]/15">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            {/* TODO: el logo actual tiene fondo blanco (se recortó de una
                captura), así que necesita esta placa. Con un SVG o PNG con
                transparencia de RL se puede quitar el fondo y el padding. */}
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white p-1 ring-1 ring-[#4fafc4]/25 transition-all duration-300 group-hover:ring-[#4fafc4]/60">
              <Image
                src="/logo-rl-wave.png"
                alt=""
                aria-hidden="true"
                width={240}
                height={189}
                className="h-auto w-full object-contain"
                priority
              />
            </span>
            <span className="font-display text-xl font-semibold uppercase tracking-[0.06em] text-brand">
              {marca}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-ice-muted hover:text-teal-solid transition-colors duration-200 text-sm tracking-wide"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuAbierto(!menuAbierto)}
            aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
            className="md:hidden text-ice-muted hover:text-teal-solid transition-colors p-2"
          >
            {menuAbierto ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {menuAbierto && (
          <div className="md:hidden py-4 border-t border-[#4fafc4]/10">
            <nav className="flex flex-col space-y-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-ice-muted hover:text-teal-solid transition-colors duration-200 px-2 py-2 text-sm tracking-wide"
                  onClick={() => setMenuAbierto(false)}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
