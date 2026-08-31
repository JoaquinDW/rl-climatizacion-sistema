"use client"

import { useEffect } from "react"
import { XCircle, Home, RefreshCw } from "lucide-react"
import Link from "next/link"
import { BrandSignature } from "@/components/brand-signature"

export default function PagoErrorPage() {
  useEffect(() => {
    // Limpiar localStorage ya que el pago falló
    localStorage.removeItem("sorteo_compra_pendiente")
  }, [])

  return (
    <div className="bg-brand flex min-h-screen items-center justify-center px-4">
      <div className="card-brand-soft w-full max-w-md p-7 sm:p-9">
        <BrandSignature className="mb-7" />
        <div className="text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/12 ring-1 ring-red-500/30">
            <XCircle className="h-7 w-7 text-red-400" />
          </span>
          <h1 className="font-display text-3xl font-semibold uppercase tracking-tight text-brand-copy">
            Pago no completado
          </h1>
        </div>

        <p className="mt-5 text-center text-sm text-brand-muted">
          Tu pago no pudo ser procesado. Esto puede deberse a:
        </p>
        <ul className="mt-3 space-y-1.5 text-sm text-brand-muted">
          <li>• Fondos insuficientes</li>
          <li>• Problema con la tarjeta</li>
          <li>• Pago cancelado por el usuario</li>
          <li>• Error temporal del sistema</li>
        </ul>

        <div className="divider-brand-soft my-6" />

        <div className="space-y-3">
          <Link
            href="/"
            className="btn-brand flex w-full items-center justify-center gap-2 px-5 py-3 text-sm font-semibold tracking-wide"
          >
            <RefreshCw className="h-4 w-4" />
            Intentar nuevamente
          </Link>
          <Link
            href="/"
            className="btn-brand-outline flex w-full items-center justify-center gap-2 px-5 py-3 text-sm tracking-wide"
          >
            <Home className="h-4 w-4" />
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
