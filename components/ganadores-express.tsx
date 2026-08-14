"use client"

import { useState, useEffect } from "react"
import { obtenerGanadoresExpress } from "@/lib/database"
import type { GanadorExpress } from "@/lib/supabase"
import { Trophy } from "lucide-react"
import { CONTENIDO_DEFAULTS, type ContenidoSitio } from "@/lib/contenido"
import { Reveal } from "@/components/reveal"

interface GanadoresExpressProps {
  sorteoId?: string
  contenido?: ContenidoSitio
}

export function GanadoresExpress({
  sorteoId,
  contenido = CONTENIDO_DEFAULTS,
}: GanadoresExpressProps) {
  const [ganadores, setGanadores] = useState<GanadorExpress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarGanadores()
  }, [sorteoId])

  const cargarGanadores = async () => {
    try {
      const data = await obtenerGanadoresExpress(sorteoId)
      setGanadores(data)
    } catch (error) {
      console.error("Error cargando ganadores express:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || ganadores.length === 0) {
    return null
  }

  return (
    <section className="py-16">
      <div className="divider-rl max-w-4xl mx-auto mb-16" />
      <div className="container mx-auto px-4">
        <Reveal className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-teal-solid mb-3">
            {contenido.express_kicker}
          </p>
          <h2 className="text-5xl lg:text-6xl font-display font-semibold uppercase tracking-tight text-ice flex items-center justify-center gap-3">
            <Trophy className="w-7 h-7 text-[#4fafc4]" />
            {contenido.express_titulo}
          </h2>
        </Reveal>

        <div className="max-w-3xl mx-auto space-y-2.5">
          {ganadores.map((ganador, index) => (
            <Reveal key={ganador.id} delay={Math.min(index, 5) * 70}>
              <div className="card-rl-soft px-4 py-3 md:px-6 md:py-4 flex items-center justify-between gap-3">
                {/* Número */}
                <div className="chip-rl rounded-lg px-3 py-2 flex-shrink-0 min-w-[60px] text-center">
                  <p className="font-mono font-bold text-base md:text-xl">
                    {ganador.numero_ganador}
                  </p>
                </div>

                {/* Premio */}
                <div className="flex-1 text-center">
                  <p className="text-ice font-semibold text-sm md:text-base">
                    {ganador.premio_monto}
                  </p>
                </div>

                {/* Nombre */}
                <div className="flex items-center gap-2 flex-shrink-0 max-w-[160px]">
                  <p className="text-ice-muted text-sm font-medium truncate">
                    {ganador.nombre_ganador || "Anónimo"}
                  </p>
                  <Trophy className="w-4 h-4 text-[#4fafc4]/70 flex-shrink-0" />
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
