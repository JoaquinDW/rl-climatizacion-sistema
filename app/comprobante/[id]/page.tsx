"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import {
  generarComprobante,
  generarComprobanteDataURL,
  type ComprobanteComprador,
} from "@/lib/comprobante"
import { LOGO_PATH, MARCA } from "@/lib/marca"

interface ComprobanteResponse {
  premio: string
  comprador: ComprobanteComprador
}

export default function ComprobantePage() {
  const params = useParams<{ id: string }>()
  const id = params?.id

  const [data, setData] = useState<ComprobanteResponse | null>(null)
  const [imgUrl, setImgUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)
  const [descargando, setDescargando] = useState(false)

  useEffect(() => {
    if (!id) return
    let activo = true
    ;(async () => {
      try {
        const res = await fetch(`/api/comprobante/${id}`)
        const body = await res.json()
        if (!activo) return
        if (!res.ok) {
          setError(body?.error || "No se pudo cargar el comprobante")
        } else {
          setData(body)
          // Renderizar el comprobante como imagen para verlo en pantalla.
          setImgUrl(generarComprobanteDataURL(body.premio, body.comprador))
        }
      } catch {
        if (activo) setError("No se pudo cargar el comprobante")
      } finally {
        if (activo) setCargando(false)
      }
    })()
    return () => {
      activo = false
    }
  }, [id])

  const descargar = () => {
    if (!data) return
    setDescargando(true)
    generarComprobante(data.premio, data.comprador, () => setDescargando(false))
  }

  return (
    <div className="bg-brand flex min-h-screen items-center justify-center p-4 text-brand-copy">
      <div className="card-brand w-full max-w-md p-6 text-center">
        <div className="mx-auto mb-6 flex items-center justify-center gap-3">
          <span className="h-16 w-16 overflow-hidden rounded-md border border-white/15 bg-[#08090b]">
            <img
              src={LOGO_PATH}
              alt={`Logo de ${MARCA}`}
              className="h-full w-full object-cover"
            />
          </span>
          <span className="font-display text-xl font-bold uppercase tracking-[0.08em] text-brand-display">
            {MARCA}
          </span>
        </div>

        {cargando && <p className="text-[#9a9da3]">Cargando comprobante…</p>}

        {!cargando && error && (
          <div>
            <h1 className="mb-2 text-xl font-bold text-[#f4f4f2]">
              Comprobante no disponible
            </h1>
            <p className="text-[#9a9da3]">{error}</p>
          </div>
        )}

        {!cargando && !error && data && (
          <div>
            <h1 className="mb-1 text-2xl font-bold text-[#f4f4f2]">
              ¡Tu comprobante!
            </h1>
            <p className="mb-4 text-sm text-[#9a9da3]">
              Estás participando por{" "}
              <span className="text-[#c0c0c0]">{data.premio}</span>
            </p>

            {imgUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imgUrl}
                alt="Comprobante de compra"
                className="mb-4 w-full rounded-md border border-[#ef4962]/20"
              />
            ) : (
              <div className="mb-4 space-y-2 rounded-md border border-[#ef4962]/20 bg-[#08090b] p-4 text-left">
                <p>
                  <span className="text-[#9a9da3]">Comprador:</span>{" "}
                  <span className="text-[#c0c0c0]">
                    {data.comprador.nombre}
                  </span>
                </p>
                <p>
                  <span className="text-[#9a9da3]">Chances:</span>{" "}
                  {data.comprador.cantidad_chances}
                </p>
                <p className="break-words">
                  <span className="text-[#9a9da3]">Tus números:</span>{" "}
                  {[...data.comprador.numeros_asignados]
                    .sort((a, b) => a - b)
                    .join(", ")}
                </p>
              </div>
            )}

            <button
              onClick={descargar}
              disabled={descargando}
              className="btn-brand w-full px-6 py-3 font-bold disabled:opacity-60"
            >
              {descargando ? "Generando…" : "Descargar comprobante"}
            </button>

            <p className="mt-3 text-xs text-[#9a9da3]">
              En el celular podés mantener presionada la imagen para guardarla.
              🍀
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
