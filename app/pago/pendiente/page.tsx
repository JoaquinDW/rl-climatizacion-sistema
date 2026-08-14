"use client"

import { Clock, Home, RefreshCw } from "lucide-react"
import Link from "next/link"

export default function PagoPendientePage() {
  return (
    <div className="bg-rl flex min-h-screen items-center justify-center px-4">
      <div className="card-rl-soft w-full max-w-md p-7 sm:p-9">
        <div className="text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#d25e23]/14 ring-1 ring-[#e5813f]/35">
            <Clock className="h-7 w-7 text-[#f3ae7f]" />
          </span>
          <h1 className="font-display text-3xl font-semibold uppercase tracking-tight text-ice">
            Pago pendiente
          </h1>
        </div>

        <p className="mt-5 text-center text-sm text-ice-muted">
          Tu pago está siendo procesado. Esto puede tomar unos minutos.
        </p>

        <div className="mt-5 rounded-md border border-[#e5813f]/25 bg-[#d25e23]/[0.07] p-4">
          <p className="text-sm leading-relaxed text-ice-muted">
            <strong className="text-[#f3ae7f]">¿Qué hacer?</strong>
            <br />
            Recibirás un email de confirmación una vez que se apruebe el pago.
            También podés revisar el estado en tu cuenta de MercadoPago.
          </p>
        </div>

        <div className="divider-soft my-6" />

        <div className="space-y-3">
          <Link
            href="/pago/exito"
            className="btn-cta flex w-full items-center justify-center gap-2 px-5 py-3 text-sm font-semibold tracking-wide"
          >
            <RefreshCw className="h-4 w-4" />
            Verificar estado del pago
          </Link>
          <Link
            href="/"
            className="btn-cta-outline flex w-full items-center justify-center gap-2 px-5 py-3 text-sm tracking-wide"
          >
            <Home className="h-4 w-4" />
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
