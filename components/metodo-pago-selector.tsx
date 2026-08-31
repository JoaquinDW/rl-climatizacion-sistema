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
        <h3 className="font-display text-2xl font-semibold uppercase tracking-tight text-brand-copy">
          Transferencia bancaria
        </h3>
        <p className="mt-1 text-sm text-brand-muted">
          <span className="num-display font-semibold text-brand-accent">
            {pack.chances}
          </span>{" "}
          chances por{" "}
          <span className="num-display font-semibold text-brand-accent">
            ${pack.precio.toLocaleString("es-AR")}
          </span>
        </p>
      </div>

      <div className="card-brand p-5">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-[#cf1834]/15 ring-1 ring-[#ef4962]/25">
            <Banknote className="h-5 w-5 text-brand-accent" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-brand-copy">Transferí desde tu banco</p>
            <p className="mt-1 text-sm leading-relaxed text-brand-muted">
              Hacés la transferencia y subís el comprobante. Te asignamos los
              números en cuanto lo aprobamos.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onTransferencia}
          className="btn-brand mt-5 w-full px-5 py-3 text-sm font-semibold tracking-wide"
        >
          Continuar con transferencia
        </button>
      </div>
    </div>
  )
}
