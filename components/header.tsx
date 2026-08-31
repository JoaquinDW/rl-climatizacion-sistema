"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu, X } from "lucide-react"
import Image from "next/image"
import { LOGO_PATH, MARCA } from "@/lib/marca"

const NAV_LINKS = [
  { href: "#packs", label: "Packs" },
  { href: "#premios", label: "Premios" },
  { href: "#consulta", label: "Mis números" },
  { href: "#ganadores", label: "Ganadores" },
]

export function Header({ marca = MARCA }: { marca?: string }) {
  const [menuAbierto, setMenuAbierto] = useState(false)

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#08090b]/90 backdrop-blur-xl">
      <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#cf1834] to-transparent opacity-80" />
      <div className="container mx-auto px-4">
        <div className="flex h-[4.75rem] items-center justify-between">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-3">
            <span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-white/15 bg-[#08090b] shadow-[0_10px_28px_rgba(0,0,0,.45)] transition-all duration-300 group-hover:border-[#cf1834]/70 group-hover:shadow-[0_10px_32px_rgba(207,24,52,.18)]">
              <Image
                src={LOGO_PATH}
                alt={`Logo de ${marca}`}
                width={150}
                height={150}
                className="h-full w-full object-cover"
                priority
              />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-display text-xl font-bold uppercase tracking-[0.06em] text-brand-display sm:text-2xl">
                {marca}
              </span>
              <span className="mt-1 hidden text-[9px] font-semibold uppercase tracking-[0.34em] text-brand-muted sm:block">
                Sorteos oficiales
              </span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center space-x-8 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-muted transition-colors duration-200 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuAbierto(!menuAbierto)}
            aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
            className="p-2 text-brand-muted transition-colors hover:text-brand-accent md:hidden"
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
          <div className="border-t border-white/10 py-4 md:hidden">
            <nav className="flex flex-col space-y-1">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-2 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-brand-muted transition-colors duration-200 hover:text-brand-accent"
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
