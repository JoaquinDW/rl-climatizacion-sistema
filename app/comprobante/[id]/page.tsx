"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import {
  generarComprobante,
  generarComprobanteDataURL,
  type ComprobanteComprador,
} from "@/lib/comprobante"
import { MARCA } from "@/lib/marca"

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
    <div className="min-h-screen bg-[#08151a] text-[#c4d5db] flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-[#4fafc4]/40 bg-[#0e2129] p-6 text-center shadow-xl">
        <div className="mx-auto mb-6 inline-block rounded-xl bg-gradient-to-r from-[#9ad5e1] via-[#4fafc4] to-[#00637a] px-6 py-2 font-bold text-[#08151a]">
          {MARCA.toUpperCase()}
        </div>

        {cargando && <p className="text-[#8ca4ad]">Cargando comprobante…</p>}

        {!cargando && error && (
          <div>
            <h1 className="mb-2 text-xl font-bold text-[#d8eef3]">
              Comprobante no disponible
            </h1>
            <p className="text-[#8ca4ad]">{error}</p>
          </div>
        )}

        {!cargando && !error && data && (
          <div>
            <h1 className="mb-1 text-2xl font-bold text-[#d8eef3]">
              ¡Tu comprobante!
            </h1>
            <p className="mb-4 text-sm text-[#8ca4ad]">
              Estás participando por{" "}
              <span className="text-[#9ad5e1]">{data.premio}</span>
            </p>

            {imgUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imgUrl}
                alt="Comprobante de compra"
                className="mb-4 w-full rounded-xl border border-[#4fafc4]/20"
              />
            ) : (
              <div className="mb-4 space-y-2 rounded-xl border border-[#4fafc4]/20 bg-[#08151a] p-4 text-left">
                <p>
                  <span className="text-[#8ca4ad]">Comprador:</span>{" "}
                  <span className="text-[#9ad5e1]">
                    {data.comprador.nombre}
                  </span>
                </p>
                <p>
                  <span className="text-[#8ca4ad]">Chances:</span>{" "}
                  {data.comprador.cantidad_chances}
                </p>
                <p className="break-words">
                  <span className="text-[#8ca4ad]">Tus números:</span>{" "}
                  {[...data.comprador.numeros_asignados]
                    .sort((a, b) => a - b)
                    .join(", ")}
                </p>
              </div>
            )}

            <button
              onClick={descargar}
              disabled={descargando}
              className="w-full rounded-xl bg-gradient-to-r from-[#9ad5e1] via-[#4fafc4] to-[#00637a] px-6 py-3 font-bold text-[#08151a] transition hover:opacity-90 disabled:opacity-60"
            >
              {descargando ? "Generando…" : "Descargar comprobante"}
            </button>

            <p className="mt-3 text-xs text-[#8ca4ad]">
              En el celular podés mantener presionada la imagen para guardarla.
              🍀
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
