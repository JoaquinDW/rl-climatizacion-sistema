"use client"

import { Clock, Home, RefreshCw } from "lucide-react"
import Link from "next/link"
import { BrandSignature } from "@/components/brand-signature"

export default function PagoPendientePage() {
  return (
    <div className="bg-brand flex min-h-screen items-center justify-center px-4">
      <div className="card-brand-soft w-full max-w-md p-7 sm:p-9">
        <BrandSignature className="mb-7" />
        <div className="text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#cf1834]/14 ring-1 ring-[#ef4962]/35">
            <Clock className="h-7 w-7 text-[#f4b3bd]" />
          </span>
          <h1 className="font-display text-3xl font-semibold uppercase tracking-tight text-brand-copy">
            Pago pendiente
          </h1>
        </div>

        <p className="mt-5 text-center text-sm text-brand-muted">
          Tu pago está siendo procesado. Esto puede tomar unos minutos.
        </p>

        <div className="mt-5 rounded-md border border-[#ef4962]/25 bg-[#cf1834]/[0.07] p-4">
          <p className="text-sm leading-relaxed text-brand-muted">
            <strong className="text-[#f4b3bd]">¿Qué hacer?</strong>
            <br />
            Recibirás un email de confirmación una vez que se apruebe el pago.
            También podés revisar el estado en tu cuenta de MercadoPago.
          </p>
        </div>

        <div className="divider-brand-soft my-6" />

        <div className="space-y-3">
          <Link
            href="/pago/exito"
            className="btn-brand flex w-full items-center justify-center gap-2 px-5 py-3 text-sm font-semibold tracking-wide"
          >
            <RefreshCw className="h-4 w-4" />
            Verificar estado del pago
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
