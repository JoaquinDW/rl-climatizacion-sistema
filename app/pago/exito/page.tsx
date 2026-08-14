"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { CheckCircle, XCircle, Clock, Home } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"
import dynamic from "next/dynamic"

const IphoneCarousel = dynamic(() => import("@/components/iphone-carousel"), {
  ssr: false,
})

function PagoExitoContent() {
  const [estado, setEstado] = useState<"loading" | "success" | "error">(
    "loading"
  )
  const [datosCompra, setDatosCompra] = useState<any>(null)
  const [numerosAsignados, setNumerosAsignados] = useState<number[]>([])
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const paymentId =
    searchParams.get("payment_id") || searchParams.get("collection_id")
  const status =
    searchParams.get("status") || searchParams.get("collection_status")
  const preferenceId = searchParams.get("preference_id")
  const externalReference = searchParams.get("external_reference")

  console.log("URL Params:", {
    paymentId,
    status,
    preferenceId,
    externalReference,
    allParams: Object.fromEntries(searchParams.entries()),
  })

  useEffect(() => {
    confirmarPago()
  }, [])

  const confirmarPago = async () => {
    try {
      // Obtener datos del localStorage
      const datosGuardados = localStorage.getItem("sorteo_compra_pendiente")
      if (!datosGuardados) {
        setEstado("error")
        return
      }

      let datos
      try {
        datos = JSON.parse(datosGuardados)
      } catch (error) {
        console.error("Error parsing localStorage data:", error)
        localStorage.removeItem("sorteo_compra_pendiente")
        setEstado("error")
        return
      }

      setDatosCompra(datos)

      // Verificar que el status sea approved
      if (status !== "approved") {
        setEstado("error")
        return
      }

      // Confirmar el pago con nuestro servidor
      const response = await fetch("/api/confirmar-pago", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentId,
          preferenceId,
          status,
          datosCompra: datos,
        }),
      })

      if (!response.ok) {
        throw new Error("Error confirmando pago")
      }

      const result = await response.json()

      if (result.success) {
        setNumerosAsignados(result.numerosAsignados)
        setEstado("success")

        // Limpiar localStorage
        localStorage.removeItem("sorteo_compra_pendiente")

        toast({
          title: "¡Pago confirmado! 🎉",
          description: "Tu compra se procesó correctamente",
        })
      } else {
        setEstado("error")
      }
    } catch (error) {
      console.error("Error confirmando pago:", error)
      setEstado("error")
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo confirmar el pago",
      })
    }
  }

  if (estado === "loading") {
    return <PantallaCargando texto="Estamos verificando tu pago con MercadoPago" />
  }

  if (estado === "error") {
    return (
      <div className="bg-rl flex min-h-screen items-center justify-center px-4">
        <div className="card-rl-soft w-full max-w-md p-7 sm:p-9">
          <div className="text-center">
            <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/12 ring-1 ring-red-500/30">
              <XCircle className="h-7 w-7 text-red-400" />
            </span>
            <h1 className="font-display text-3xl font-semibold uppercase tracking-tight text-ice">
              Error en el pago
            </h1>
          </div>
          <p className="mt-5 text-center text-sm text-ice-muted">
            Hubo un problema procesando tu pago. Puede ser que:
          </p>
          <ul className="mt-3 space-y-1.5 text-sm text-ice-muted">
            <li>• El pago fue rechazado</li>
            <li>• La sesión expiró</li>
            <li>• Hubo un error técnico</li>
          </ul>
          <div className="divider-soft my-6" />
          <Link
            href="/"
            className="btn-cta-outline flex w-full items-center justify-center gap-2 px-5 py-3 text-sm tracking-wide"
          >
            <Home className="h-4 w-4" />
            Volver al inicio
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-rl flex min-h-screen items-center justify-center px-4 py-10">
      <div className="card-rl w-full max-w-lg p-6 sm:p-8">
        <div className="text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/12 ring-1 ring-emerald-500/30">
            <CheckCircle className="h-7 w-7 text-emerald-400" />
          </span>
          <h1 className="font-display text-3xl font-semibold uppercase tracking-tight text-brand sm:text-4xl">
            ¡Pago exitoso!
          </h1>
          <p className="mt-2 text-base font-semibold text-ice">
            ¡Gracias por tu compra, {datosCompra?.nombre}!
          </p>
          <p className="mt-1 text-sm text-ice-muted">
            Tu pago se procesó correctamente y ya tenés tus números asignados.
          </p>
        </div>

        <div className="my-6 overflow-hidden rounded-md">
          <IphoneCarousel />
        </div>

        <div className="card-rl-soft space-y-3 p-4">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm text-ice-muted">Chances compradas</span>
            <span className="num-display text-lg font-semibold text-ice">
              {datosCompra?.chances}
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-sm text-ice-muted">Precio pagado</span>
            <span className="num-display text-lg font-semibold text-teal-solid">
              ${datosCompra?.precio?.toLocaleString("es-AR")}
            </span>
          </div>

          <div className="divider-soft !my-4" />

          <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-ice-muted">
            Tus números
          </span>
          <div className="flex flex-wrap gap-2">
            {numerosAsignados.map((numero) => (
              <span
                key={numero}
                className="chip-rl num-display rounded px-3 py-1 font-semibold"
              >
                #{numero}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-5 rounded-md border border-[#4fafc4]/22 bg-[#007e95]/[0.08] p-4">
          <p className="text-sm leading-relaxed text-ice-muted">
            <strong className="text-teal-solid">Importante:</strong> vas a
            recibir un email de confirmación con todos los detalles de tu compra.
          </p>
        </div>

        <div className="mt-5 rounded-md border border-[#e5813f]/25 bg-[#d25e23]/[0.07] p-4 text-center">
          <p className="text-sm font-semibold text-[#f3ae7f]">
            El ganador se anuncia al vender el 100% de los números
          </p>
        </div>

        <Link
          href="/"
          className="btn-cta mt-6 flex w-full items-center justify-center gap-2 px-5 py-3 text-sm font-semibold tracking-wide"
        >
          <Home className="h-4 w-4" />
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}

function PantallaCargando({ texto }: { texto: string }) {
  return (
    <div className="bg-rl flex min-h-screen items-center justify-center px-4">
      <div className="card-rl-soft w-full max-w-md p-9 text-center">
        <div className="mx-auto mb-5 h-11 w-11 animate-spin rounded-full border-2 border-[#4fafc4] border-t-transparent opacity-80" />
        <h2 className="font-display text-2xl font-semibold uppercase tracking-tight text-ice">
          Confirmando pago
        </h2>
        <p className="mt-2 text-sm text-ice-muted">{texto}</p>
      </div>
    </div>
  )
}

function LoadingFallback() {
  return <PantallaCargando texto="Preparando la confirmación de tu pago" />
}

export default function PagoExitoPage() {
  return (
    <>
      <Suspense fallback={<LoadingFallback />}>
        <PagoExitoContent />
      </Suspense>
      <Toaster />
    </>
  )
}
