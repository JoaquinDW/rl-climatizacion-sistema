"use client"

import { useEffect, useRef, useState } from "react"
import { Clock } from "lucide-react"

interface CountdownCierreProps {
  /** ISO de `sorteo.fecha_cierre_ventas` */
  fechaCierre: string
  /** Se llama una sola vez, cuando el contador llega a cero */
  onExpirado: () => void
  /** "hero" = bloque grande en la portada | "barra" = barra fija en mobile */
  variant?: "hero" | "barra"
  /** Texto arriba del contador (contenido.cierre_kicker) */
  kicker?: string
  /** Línea opcional con la fecha del sorteo, ya formateada */
  notaSorteo?: string
}

interface Restante {
  dias: number
  horas: number
  minutos: number
  segundos: number
  total: number
}

function calcularRestante(objetivo: number): Restante {
  const total = Math.max(0, objetivo - Date.now())
  const segundosTotales = Math.floor(total / 1000)

  return {
    dias: Math.floor(segundosTotales / 86400),
    horas: Math.floor((segundosTotales % 86400) / 3600),
    minutos: Math.floor((segundosTotales % 3600) / 60),
    segundos: segundosTotales % 60,
    total,
  }
}

const dosDigitos = (n: number) => n.toString().padStart(2, "0")

/** "2 días y 4 horas" / "14 minutos" — para lectores de pantalla */
function textoAccesible(r: Restante): string {
  if (r.dias > 0) {
    return `Faltan ${r.dias} ${r.dias === 1 ? "día" : "días"} y ${r.horas} ${r.horas === 1 ? "hora" : "horas"}`
  }
  if (r.horas > 0) {
    return `Faltan ${r.horas} ${r.horas === 1 ? "hora" : "horas"} y ${r.minutos} minutos`
  }
  return `Faltan ${r.minutos} minutos`
}

export function CountdownCierre({
  fechaCierre,
  onExpirado,
  variant = "hero",
  kicker = "Las ventas cierran en",
  notaSorteo,
}: CountdownCierreProps) {
  // Arranca en null y se calcula recién en el efecto: el servidor y el cliente
  // nunca coinciden en Date.now(), así se evita el mismatch de hidratación.
  const [restante, setRestante] = useState<Restante | null>(null)
  const yaExpiro = useRef(false)

  useEffect(() => {
    const objetivo = new Date(fechaCierre).getTime()
    if (Number.isNaN(objetivo)) return

    const tick = () => {
      const actual = calcularRestante(objetivo)
      setRestante(actual)

      if (actual.total <= 0 && !yaExpiro.current) {
        yaExpiro.current = true
        onExpirado()
      }
    }

    tick()
    const intervalo = setInterval(tick, 1000)
    return () => clearInterval(intervalo)
  }, [fechaCierre, onExpirado])

  if (restante && restante.total <= 0) return null

  // Última hora: se resalta en ámbar/rojo para marcar urgencia
  const urgente = restante !== null && restante.total < 60 * 60 * 1000
  const mostrarDias = restante === null || restante.dias > 0

  if (variant === "barra") {
    const tiempo = restante
      ? `${restante.dias > 0 ? `${restante.dias}d ` : ""}${dosDigitos(restante.horas)}:${dosDigitos(restante.minutos)}:${dosDigitos(restante.segundos)}`
      : "--:--:--"

    return (
      <div
        className="fixed bottom-0 inset-x-0 z-40 sm:hidden border-t border-[#ef4962]/20 bg-[#08090b]/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
        role="timer"
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.2em] text-brand-muted">
              {kicker}
            </p>
            <p
              className={`font-mono text-lg font-semibold tabular-nums leading-tight ${
                urgente ? "text-[#f4b3bd]" : "text-brand-accent"
              }`}
              aria-hidden="true"
            >
              {tiempo}
            </p>
            <span className="sr-only">
              {restante ? textoAccesible(restante) : ""} para que cierren las ventas
            </span>
          </div>
          <a
            href="#packs"
            className="btn-brand shrink-0 rounded-full px-5 py-2.5 text-xs font-semibold tracking-wide"
          >
            Comprar
          </a>
        </div>
      </div>
    )
  }

  const bloques = [
    { valor: restante?.dias, etiqueta: "Días", visible: mostrarDias },
    { valor: restante?.horas, etiqueta: "Horas", visible: true },
    { valor: restante?.minutos, etiqueta: "Min", visible: true },
    { valor: restante?.segundos, etiqueta: "Seg", visible: true },
  ].filter((b) => b.visible)

  return (
    <div
      className={`card-brand p-5 sm:p-6 space-y-4 text-left ${
        urgente ? "border-[#f4b3bd]/40" : ""
      }`}
      role="timer"
    >
      <div className="flex items-center gap-2">
        <Clock
          className={`w-3.5 h-3.5 shrink-0 ${urgente ? "text-[#f4b3bd]" : "text-brand-accent"}`}
        />
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-muted">
          {kicker}
        </span>
      </div>

      <div
        className={`grid gap-2 sm:gap-3 ${bloques.length === 4 ? "grid-cols-4" : "grid-cols-3"}`}
        aria-hidden="true"
      >
        {bloques.map((bloque, index) => (
          <div
            key={bloque.etiqueta}
            className={`rounded-xl border px-2 py-3 text-center ${
              urgente
                ? "border-[#f4b3bd]/25 bg-[#f4b3bd]/[0.06]"
                : "border-[#ef4962]/15 bg-[#ef4962]/[0.04]"
            } ${
              urgente && index === bloques.length - 1
                ? "animate-pulse motion-reduce:animate-none"
                : ""
            }`}
          >
            <span
              className={`block num-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-none ${
                urgente ? "text-[#f4b3bd]" : "text-brand-display"
              }`}
            >
              {bloque.valor === undefined ? "--" : dosDigitos(bloque.valor)}
            </span>
            <span className="mt-1.5 block text-[10px] uppercase tracking-[0.2em] text-brand-muted">
              {bloque.etiqueta}
            </span>
          </div>
        ))}
      </div>

      <span className="sr-only">
        {restante ? textoAccesible(restante) : ""} para que cierren las ventas
      </span>

      {notaSorteo && (
        <p className="text-sm text-brand-muted leading-relaxed">{notaSorteo}</p>
      )}
    </div>
  )
}
