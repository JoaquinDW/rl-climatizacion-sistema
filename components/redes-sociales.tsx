"use client"

import {
  Instagram,
  Facebook,
  Youtube,
  Twitter,
  Send,
  MessageCircle,
  Music2,
  Globe,
  type LucideIcon,
} from "lucide-react"
import type { ContenidoSitio, TipoRed } from "@/lib/contenido"
import { Reveal } from "@/components/reveal"

const ICONOS: Record<TipoRed, LucideIcon> = {
  instagram: Instagram,
  facebook: Facebook,
  tiktok: Music2,
  youtube: Youtube,
  x: Twitter,
  whatsapp: MessageCircle,
  telegram: Send,
  web: Globe,
}

export function RedesSociales({ contenido }: { contenido: ContenidoSitio }) {
  const redes = (contenido.redes ?? []).filter((red) => red.url.trim())

  if (redes.length === 0) return null

  return (
    <section className="py-20">
      <div className="divider-brand max-w-4xl mx-auto mb-16" />
      <div className="container mx-auto px-4 max-w-2xl text-center">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-brand-accent mb-3">
            {contenido.redes_kicker}
          </p>
          <h2 className="text-5xl lg:text-6xl font-display font-semibold uppercase tracking-tight text-brand-copy mb-3">
            {contenido.redes_titulo}
          </h2>
          {contenido.redes_descripcion && (
            <p className="text-brand-muted text-sm max-w-md mx-auto">
              {contenido.redes_descripcion}
            </p>
          )}
        </Reveal>

        <div className="mt-10 grid gap-3 sm:grid-cols-3">
          {redes.map((red, index) => {
            const Icono = ICONOS[red.tipo] ?? Globe
            return (
              <Reveal key={`${red.url}-${index}`} delay={Math.min(index, 5) * 70}>
                <a
                  href={red.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-brand-outline inline-flex w-full items-center justify-center gap-2.5 px-5 py-3 text-sm"
                >
                  <Icono className="h-4 w-4 text-[#ef4962]" />
                  {red.etiqueta || red.url}
                </a>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
