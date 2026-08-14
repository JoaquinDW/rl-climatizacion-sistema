"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { CalendarClock, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { actualizarFechasSorteo } from "@/lib/database"
import {
  OFFSET_AR,
  ZONA_AR,
  formatearFechaHoraAR,
  inputLocalAISO,
  isoAInputLocal,
} from "@/lib/fechas"
import type { Sorteo } from "@/lib/supabase"

interface EditarFechaSorteoModalProps {
  isOpen: boolean
  onClose: () => void
  sorteo: Sorteo
  onFechaActualizada: () => void
}

/** Horas en punto y y media, para el desplegable */
const HORAS = Array.from({ length: 48 }, (_, i) => {
  const hora = Math.floor(i / 2)
  const minutos = i % 2 === 0 ? "00" : "30"
  return `${hora.toString().padStart(2, "0")}:${minutos}`
})

/** Las que más se usan: se ofrecen como botones para no abrir el desplegable */
const HORAS_FRECUENTES = ["19:00", "20:00", "21:00", "22:00"]

const HORA_SORTEO_POR_DEFECTO = "21:00"

/** Los próximos 7 días, con etiqueta corta ("Hoy", "Mañana", "jue 14/08") */
function proximosDias(cantidad = 7) {
  const hoy = isoAInputLocal(new Date().toISOString()).slice(0, 10)
  // Mediodía para que sumar días nunca cruce de fecha por el offset
  const base = new Date(`${hoy}T12:00:00${OFFSET_AR}`)

  return Array.from({ length: cantidad }, (_, i) => {
    const fecha = new Date(base.getTime() + i * 24 * 60 * 60 * 1000)
    const valor = isoAInputLocal(fecha.toISOString()).slice(0, 10)
    const [, mes, dia] = valor.split("-")

    const diaSemana = new Intl.DateTimeFormat("es-AR", {
      timeZone: ZONA_AR,
      weekday: "short",
    })
      .format(fecha)
      .replace(".", "")

    const etiqueta =
      i === 0 ? "Hoy" : i === 1 ? "Mañana" : `${diaSemana} ${dia}/${mes}`

    return { valor, etiqueta }
  })
}

const combinar = (dia: string, hora: string) => (dia && hora ? `${dia}T${hora}` : "")

/** Resta minutos a un "YYYY-MM-DDTHH:mm" y devuelve las partes por separado */
function restarMinutos(dia: string, hora: string, minutos: number) {
  const iso = inputLocalAISO(combinar(dia, hora))
  if (!iso) return null

  const local = isoAInputLocal(
    new Date(new Date(iso).getTime() - minutos * 60 * 1000).toISOString(),
  )

  return { dia: local.slice(0, 10), hora: local.slice(11) }
}

/** El desplegable siempre tiene que poder mostrar el valor cargado */
function opcionesHora(valorActual: string) {
  if (!valorActual || HORAS.includes(valorActual)) return HORAS
  return [...HORAS, valorActual].sort()
}

interface SelectorFechaHoraProps {
  idPrefijo: string
  dia: string
  hora: string
  onCambio: (dia: string, hora: string) => void
  disabled?: boolean
  /** Chips con los próximos días (sólo para el sorteo) */
  mostrarDias?: boolean
}

function SelectorFechaHora({
  idPrefijo,
  dia,
  hora,
  onCambio,
  disabled,
  mostrarDias,
}: SelectorFechaHoraProps) {
  return (
    <div className="space-y-2">
      {mostrarDias && (
        <div className="flex flex-wrap gap-1.5">
          {proximosDias().map((opcion) => (
            <Button
              key={opcion.valor}
              type="button"
              size="sm"
              variant={dia === opcion.valor ? "default" : "outline"}
              className="h-7 px-2.5 text-xs capitalize"
              disabled={disabled}
              onClick={() =>
                onCambio(opcion.valor, hora || HORA_SORTEO_POR_DEFECTO)
              }
            >
              {opcion.etiqueta}
            </Button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-[1fr_auto] gap-2">
        <Input
          id={`${idPrefijo}-dia`}
          type="date"
          value={dia}
          onChange={(e) => onCambio(e.target.value, hora)}
          disabled={disabled}
        />
        <Select
          value={hora}
          onValueChange={(valor) => onCambio(dia, valor)}
          disabled={disabled}
        >
          <SelectTrigger id={`${idPrefijo}-hora`} className="w-[104px]">
            <SelectValue placeholder="Hora" />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {opcionesHora(hora).map((opcion) => (
              <SelectItem key={opcion} value={opcion}>
                {opcion} hs
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {HORAS_FRECUENTES.map((opcion) => (
          <Button
            key={opcion}
            type="button"
            size="sm"
            variant={hora === opcion ? "default" : "outline"}
            className="h-7 px-2.5 text-xs"
            disabled={disabled}
            onClick={() => onCambio(dia, opcion)}
          >
            {opcion} hs
          </Button>
        ))}
      </div>
    </div>
  )
}

export function EditarFechaSorteoModal({
  isOpen,
  onClose,
  sorteo,
  onFechaActualizada,
}: EditarFechaSorteoModalProps) {
  const sorteoLocal = isoAInputLocal(sorteo.fecha_sorteo_programada)
  const cierreLocal = isoAInputLocal(sorteo.fecha_cierre_ventas)

  const [sorteoDia, setSorteoDia] = useState(sorteoLocal.slice(0, 10))
  const [sorteoHora, setSorteoHora] = useState(sorteoLocal.slice(11))
  const [cierreDia, setCierreDia] = useState(cierreLocal.slice(0, 10))
  const [cierreHora, setCierreHora] = useState(cierreLocal.slice(11))
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const isoSorteo = inputLocalAISO(combinar(sorteoDia, sorteoHora))
  const isoCierre = inputLocalAISO(combinar(cierreDia, cierreHora))

  const hayCierreIncompleto = (!!cierreDia && !cierreHora) || (!cierreDia && !!cierreHora)
  const haySorteoIncompleto = (!!sorteoDia && !sorteoHora) || (!sorteoDia && !!sorteoHora)
  const cierrePosterior =
    !!isoCierre && !!isoSorteo && new Date(isoCierre) > new Date(isoSorteo)
  const cierreYaPaso = !!isoCierre && new Date(isoCierre) <= new Date()

  const puedeGuardar = !cierrePosterior && !hayCierreIncompleto && !haySorteoIncompleto

  const aplicarSorteo = (dia: string, hora: string) => {
    setSorteoDia(dia)
    setSorteoHora(hora)

    // Atajo para el caso habitual: "sorteamos 21hs, se compra hasta las 20hs".
    // Sólo se autocompleta si el cierre todavía está vacío.
    if (dia && hora && !cierreDia && !cierreHora) {
      const previo = restarMinutos(dia, hora, 60)
      if (previo) {
        setCierreDia(previo.dia)
        setCierreHora(previo.hora)
      }
    }
  }

  const adelantarCierre = (minutos: number) => {
    const previo = restarMinutos(sorteoDia, sorteoHora, minutos)
    if (!previo) return
    setCierreDia(previo.dia)
    setCierreHora(previo.hora)
  }

  const vaciarCierre = () => {
    setCierreDia("")
    setCierreHora("")
  }

  const vaciarSorteo = () => {
    setSorteoDia("")
    setSorteoHora("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!puedeGuardar) return

    setLoading(true)

    try {
      const success = await actualizarFechasSorteo(sorteo.id, {
        fechaCierreVentas: isoCierre,
        fechaSorteoProgramada: isoSorteo,
      })

      if (success) {
        toast({
          title: "Fechas actualizadas",
          description: isoCierre
            ? `Las ventas cierran el ${formatearFechaHoraAR(isoCierre)}`
            : "El sorteo queda sin cierre programado",
        })
        onFechaActualizada()
        onClose()
      } else {
        throw new Error("No se pudieron actualizar las fechas")
      }
    } catch (error) {
      console.error("Error actualizando fechas:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron actualizar las fechas. Intenta nuevamente.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-blue-600" />
            Fechas y cierre de ventas
          </DialogTitle>
          <DialogDescription>
            Elegí cuándo se sortea y hasta qué hora se puede comprar. Los dos
            campos son opcionales.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="sorteo-dia">¿Cuándo se sortea?</Label>
              {(sorteoDia || sorteoHora) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-gray-500"
                  onClick={vaciarSorteo}
                  disabled={loading}
                >
                  Vaciar
                </Button>
              )}
            </div>

            <SelectorFechaHora
              idPrefijo="sorteo"
              dia={sorteoDia}
              hora={sorteoHora}
              onCambio={aplicarSorteo}
              disabled={loading}
              mostrarDias
            />

            <p className="text-xs text-gray-500">
              Sólo informativo: se muestra en la portada y en las preguntas
              frecuentes. Al elegirlo, el cierre se completa 1 hora antes.
            </p>
          </div>

          <div className="border-t pt-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="cierre-dia">¿Hasta cuándo se puede comprar?</Label>
              {(cierreDia || cierreHora) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-gray-500"
                  onClick={vaciarCierre}
                  disabled={loading}
                >
                  Vaciar
                </Button>
              )}
            </div>

            {isoSorteo && (
              <div className="flex flex-wrap gap-1.5">
                {[
                  { minutos: 30, etiqueta: "30 min antes" },
                  { minutos: 60, etiqueta: "1 h antes" },
                  { minutos: 120, etiqueta: "2 h antes" },
                  { minutos: 1440, etiqueta: "1 día antes" },
                ].map((atajo) => (
                  <Button
                    key={atajo.minutos}
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="h-7 px-2.5 text-xs"
                    disabled={loading}
                    onClick={() => adelantarCierre(atajo.minutos)}
                  >
                    {atajo.etiqueta}
                  </Button>
                ))}
              </div>
            )}

            <SelectorFechaHora
              idPrefijo="cierre"
              dia={cierreDia}
              hora={cierreHora}
              onCambio={(dia, hora) => {
                setCierreDia(dia)
                setCierreHora(hora)
              }}
              disabled={loading}
            />

            <p className="text-xs text-gray-500">
              Dejalo vacío para vender hasta llegar al 100% de las chances, como
              siempre.
            </p>
          </div>

          {(haySorteoIncompleto || hayCierreIncompleto) && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
              <p className="text-sm text-yellow-800">
                Falta completar {haySorteoIncompleto ? "el día o la hora del sorteo" : "el día o la hora del cierre"}.
              </p>
            </div>
          )}

          {cierrePosterior && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-sm text-red-800">
                El cierre de ventas no puede ser posterior al sorteo.
              </p>
            </div>
          )}

          {!cierrePosterior && cierreYaPaso && (
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
              <p className="text-sm text-yellow-800">
                <strong>Atención:</strong> esa fecha de cierre ya pasó. Al
                guardar, las ventas quedan cerradas de inmediato.
              </p>
            </div>
          )}

          {(isoCierre || isoSorteo) && !cierrePosterior && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-1">
              {isoCierre && (
                <p className="text-sm text-blue-900">
                  Se podrá comprar hasta el {formatearFechaHoraAR(isoCierre)}.
                </p>
              )}
              {isoSorteo && (
                <p className="text-sm text-blue-900">
                  El sorteo se realiza el {formatearFechaHoraAR(isoSorteo)}.
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !puedeGuardar}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar fechas"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
