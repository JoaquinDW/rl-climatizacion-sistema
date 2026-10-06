"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Hash, Loader2, TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { actualizarTotalChancesSorteo } from "@/lib/database"
import type { Sorteo } from "@/lib/supabase"

interface EditarTotalChancesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sorteo: Sorteo
  chancesVendidas: number
  onTotalActualizado: (sorteo: Sorteo) => void
}

const formatearNumero = (valor: string | number) => {
  const numero = typeof valor === "number" ? valor : Number(valor)
  return Number.isFinite(numero) ? numero.toLocaleString("es-AR") : ""
}

export function EditarTotalChancesModal({
  open,
  onOpenChange,
  sorteo,
  chancesVendidas,
  onTotalActualizado,
}: EditarTotalChancesModalProps) {
  const [total, setTotal] = useState(sorteo.total_chances.toString())
  const [guardando, setGuardando] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (open) setTotal(sorteo.total_chances.toString())
  }, [open, sorteo.total_chances])

  const nuevoTotal = Number(total)
  const totalValido =
    Number.isSafeInteger(nuevoTotal) &&
    nuevoTotal > 0 &&
    nuevoTotal >= chancesVendidas &&
    nuevoTotal !== sorteo.total_chances
  const estaReduciendo = totalValido && nuevoTotal < sorteo.total_chances

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!totalValido) return

    setGuardando(true)
    const resultado = await actualizarTotalChancesSorteo(sorteo.id, nuevoTotal)
    setGuardando(false)

    if (!resultado.exitoso || !resultado.sorteo) {
      toast({
        variant: "destructive",
        title: "No se pudo actualizar",
        description: resultado.mensaje,
      })
      return
    }

    onTotalActualizado(resultado.sorteo)
    toast({ title: "Total actualizado", description: resultado.mensaje })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden border-gray-200 bg-white p-0 text-gray-900 shadow-2xl sm:max-w-md">
        <DialogHeader className="border-b border-gray-200 bg-gray-50 px-6 py-5 pr-12 text-left">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-900 text-white shadow-sm">
              <Hash className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-xl text-gray-900">
                Editar total de chances
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                Ampliá o reducí el rango disponible del sorteo actual.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5 px-6 py-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Total actual
                </p>
                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {formatearNumero(sorteo.total_chances)}
                </p>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Vendidas
                </p>
                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {formatearNumero(chancesVendidas)}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nuevo-total-chances" className="text-gray-700">
                Nuevo total de chances
              </Label>
              <Input
                id="nuevo-total-chances"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={formatearNumero(total)}
                onChange={(event) =>
                  setTotal(event.target.value.replace(/\D/g, ""))
                }
                placeholder="30.000"
                className="h-11 border-gray-300 bg-white text-lg font-semibold text-gray-900"
                autoFocus
                required
              />
              {nuevoTotal > 0 && nuevoTotal < chancesVendidas ? (
                <p className="text-xs text-red-600">
                  Debe ser igual o mayor a las {formatearNumero(chancesVendidas)}
                  {" "}
                  chances ya vendidas.
                </p>
              ) : (
                <p className="text-xs leading-relaxed text-gray-500">
                  La página y la generación de números usarán este nuevo límite
                  apenas guardes el cambio.
                </p>
              )}
            </div>

            {estaReduciendo && (
              <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  Antes de reducirlo se verificará que ningún número ya
                  asignado quede fuera del nuevo rango.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="border-t border-gray-200 bg-gray-50 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={guardando}
              className="border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={guardando || !totalValido}
              className="bg-gray-900 text-white hover:bg-gray-800"
            >
              {guardando ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar cambio"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
