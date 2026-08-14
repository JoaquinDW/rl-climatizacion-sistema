"use client"

import { Banknote } from "lucide-react"

interface MetodoPagoSelectorProps {
  pack: {
    chances: number
    precio: number
  } | null
  onMercadoPago: () => void
  onTransferencia: () => void
  alias?: string
  titular?: string
}

export function MetodoPagoSelector({
  pack,
  onTransferencia,
}: MetodoPagoSelectorProps) {
  if (!pack) return null

  return (
    <div className="space-y-5">
      <div className="text-center">
        <h3 className="font-display text-2xl font-semibold uppercase tracking-tight text-ice">
          Transferencia bancaria
        </h3>
        <p className="mt-1 text-sm text-ice-muted">
          <span className="num-display font-semibold text-teal-solid">
            {pack.chances}
          </span>{" "}
          chances por{" "}
          <span className="num-display font-semibold text-teal-solid">
            ${pack.precio.toLocaleString("es-AR")}
          </span>
        </p>
      </div>

      <div className="card-rl p-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#007e95]/15 ring-1 ring-[#4fafc4]/25">
            <Banknote className="h-5 w-5 text-teal-solid" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-ice">Transferí desde tu banco</p>
            <p className="mt-1 text-sm leading-relaxed text-ice-muted">
              Hacés la transferencia y subís el comprobante. Te asignamos los
              números en cuanto lo aprobamos.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onTransferencia}
          className="btn-cta mt-5 w-full px-5 py-3 text-sm font-semibold tracking-wide"
        >
          Continuar con transferencia
        </button>
      </div>
    </div>
  )
}
