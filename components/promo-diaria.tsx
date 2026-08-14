"use client"

import { useState, useEffect } from "react"
import { Gift, Trophy } from "lucide-react"
import { Reveal } from "@/components/reveal"
import { obtenerPromoDiaria, obtenerUltimoGanadorDiario } from "@/lib/database"
import type { PromoDiaria } from "@/lib/database"
import type { SorteoDiario } from "@/lib/supabase"

interface PromoDiariaProps {
  sorteoId?: string
  /** Si se pasa, se usa en lugar de hacer fetch (el padre ya la tiene) */
  promo?: PromoDiaria
}

export function PromoDiaria({ sorteoId, promo: promoProp }: PromoDiariaProps) {
  const [promoFetched, setPromoFetched] = useState<PromoDiaria | null>(null)
  const [ultimoGanador, setUltimoGanador] = useState<SorteoDiario | null>(null)

  const promo = promoProp ?? promoFetched

  useEffect(() => {
    let activo = true
    const cargar = async () => {
      const [g, p] = await Promise.all([
        sorteoId ? obtenerUltimoGanadorDiario(sorteoId) : Promise.resolve(null),
        promoProp ? Promise.resolve(null) : obtenerPromoDiaria(),
      ])
      if (!activo) return
      setUltimoGanador(g)
      if (p) setPromoFetched(p)
    }
    cargar()
    return () => {
      activo = false
    }
  }, [sorteoId, promoProp])

  if (!promo?.visible) return null

  return (
    <Reveal variant="right" delay={100}>
      <div className="card-rl p-6 md:p-8 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <Gift className="w-4 h-4 text-[#4fafc4]" />
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-teal-solid">
            {promo.titulo}
          </p>
        </div>

        <div className="mb-4">
          <p className="text-xs text-ice-muted uppercase tracking-[0.2em] mb-1">
            Premio de hoy
          </p>
          <p className="text-4xl md:text-5xl font-display font-semibold uppercase tracking-tight text-ice">
            {promo.premio}
          </p>
        </div>

        <p className="text-sm text-ice-muted leading-relaxed">
          {promo.descripcion}
        </p>

        {ultimoGanador?.ganador_nombre && (
          <div className="mt-auto pt-4">
            <div className="divider-rl mb-3" />
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#4fafc4] flex-shrink-0" />
              <p className="text-xs text-ice-muted">
                Último ganador:{" "}
                <span className="text-ice font-semibold">
                  {ultimoGanador.ganador_nombre}
                </span>{" "}
                — {ultimoGanador.premio}
              </p>
            </div>
          </div>
        )}
      </div>
    </Reveal>
  )
}
