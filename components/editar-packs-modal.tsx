"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { actualizarPreciosYCantidadesSorteo } from "@/lib/database"
import type { Sorteo } from "@/lib/supabase"

interface EditarPacksModalProps {
  isOpen: boolean
  onClose: () => void
  sorteo: Sorteo
  onSuccess: () => void
}

export function EditarPacksModal({
  isOpen,
  onClose,
  sorteo,
  onSuccess,
}: EditarPacksModalProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const [pack1, setPack1] = useState({
    cantidad: sorteo.cantidad_pack_1 || 6,
    precio: sorteo.precio_6_chances || 21000,
    visible: sorteo.pack_1_visible ?? true,
    descripcion: sorteo.descripcion_pack_1 || "Honda Wave 2025",
  })
  const [pack2, setPack2] = useState({
    cantidad: sorteo.cantidad_pack_2 || 12,
    precio: sorteo.precio_12_chances || 42000,
    visible: sorteo.pack_2_visible ?? true,
    descripcion:
      sorteo.descripcion_pack_2 ||
      "Honda Wave 2025 + 5 oportunidades en pre-venta Nueva Titan 2018",
  })
  const [pack3, setPack3] = useState({
    cantidad: sorteo.cantidad_pack_3 || 24,
    precio: sorteo.precio_24_chances || 84000,
    visible: sorteo.pack_3_visible ?? true,
    descripcion:
      sorteo.descripcion_pack_3 ||
      "Honda Wave 2025 + 5 chances pre-venta New Titan 2018",
  })
  const [pack4, setPack4] = useState({
    cantidad: sorteo.cantidad_pack_4 || 0,
    precio: sorteo.precio_pack_4 || 0,
    visible: sorteo.pack_4_visible ?? false,
    descripcion: sorteo.descripcion_pack_4 || "",
  })
  const [pack5, setPack5] = useState({
    cantidad: sorteo.cantidad_pack_5 || 0,
    precio: sorteo.precio_pack_5 || 0,
    visible: sorteo.pack_5_visible ?? false,
    descripcion: sorteo.descripcion_pack_5 || "",
  })
  // Sorteo gratuito: la landing esconde precios, alias y comprobante. Los packs
  // siguen definiendo cuántas chances recibe cada participante.
  const [esGratis, setEsGratis] = useState(sorteo.es_gratis ?? false)

  const formatearPrecio = (valor: string) => {
    const numeros = valor.replace(/\D/g, "")
    return numeros.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  }

  const parsearPrecio = (valor: string) => {
    return Number.parseInt(valor.replace(/\./g, "")) || 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validaciones: sólo importan los packs que se muestran en la landing.
      // Un pack oculto puede quedar en 0 (por ejemplo, un sorteo gratis con
      // una sola opción de participación).
      const packsVisibles = [pack1, pack2, pack3, pack4, pack5].filter(
        (p) => p.visible
      )

      if (packsVisibles.length === 0) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Tiene que haber al menos un pack visible",
        })
        return
      }

      if (packsVisibles.some((p) => p.cantidad <= 0)) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Las cantidades de los packs visibles deben ser mayores a 0",
        })
        return
      }

      if (!esGratis && packsVisibles.some((p) => p.precio <= 0)) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Los precios de los packs visibles deben ser mayores a 0",
        })
        return
      }

      // Verificar que las cantidades visibles sean diferentes entre sí: son
      // las que identifican al pack cuando llega una compra o participación
      const cantidades = packsVisibles.map((p) => p.cantidad)
      const cantidadesUnicas = new Set(cantidades)
      if (cantidadesUnicas.size !== cantidades.length) {
        toast({
          variant: "destructive",
          title: "Error",
          description:
            "Las cantidades de chances deben ser diferentes entre sí",
        })
        return
      }

      const exito = await actualizarPreciosYCantidadesSorteo(
        sorteo.id,
        pack1,
        pack2,
        pack3,
        pack4,
        pack5,
        esGratis
      )

      if (exito) {
        toast({
          title: "¡Actualizado!",
          description: "Los packs han sido actualizados correctamente",
        })
        onSuccess()
        onClose()
      } else {
        throw new Error("Error actualizando packs")
      }
    } catch (error) {
      console.error("Error:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron actualizar los packs",
      })
    } finally {
      setLoading(false)
    }
  }

  const PackCard = ({
    id,
    label,
    color,
    pack,
    setPack,
    placeholderDesc,
    placeholderPrecio,
  }: {
    id: string
    label: string
    color: string
    pack: { cantidad: number; precio: number; visible: boolean; descripcion: string }
    setPack: (p: typeof pack) => void
    placeholderDesc: string
    placeholderPrecio: string
  }) => (
    <div className="space-y-3 p-3 border rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className={`font-semibold text-sm ${color}`}>{label}</h3>
        <div className="flex items-center space-x-1.5">
          <input
            type="checkbox"
            id={`${id}-visible`}
            checked={pack.visible}
            onChange={(e) => setPack({ ...pack, visible: e.target.checked })}
            className="w-3.5 h-3.5 cursor-pointer"
          />
          <Label htmlFor={`${id}-visible`} className="text-xs cursor-pointer">
            Visible
          </Label>
        </div>
      </div>
      <div>
        <Label htmlFor={`${id}-desc`} className="text-xs">Descripción</Label>
        <Input
          id={`${id}-desc`}
          type="text"
          value={pack.descripcion}
          onChange={(e) => setPack({ ...pack, descripcion: e.target.value })}
          placeholder={placeholderDesc}
          className="mt-1 h-8 text-sm"
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label htmlFor={`${id}-cantidad`} className="text-xs">Chances</Label>
          <Input
            id={`${id}-cantidad`}
            type="number"
            min={0}
            max="100"
            value={pack.cantidad}
            onChange={(e) =>
              setPack({ ...pack, cantidad: Number.parseInt(e.target.value) || 0 })
            }
            className="mt-1 h-8 text-sm"
          />
        </div>
        <div>
          <Label htmlFor={`${id}-precio`} className="text-xs">Precio ($)</Label>
          <Input
            id={`${id}-precio`}
            type="text"
            value={esGratis ? "Gratis" : formatearPrecio(pack.precio.toString())}
            onChange={(e) =>
              setPack({ ...pack, precio: parsearPrecio(e.target.value) })
            }
            placeholder={placeholderPrecio}
            disabled={esGratis}
            className="mt-1 h-8 text-sm disabled:opacity-60"
          />
        </div>
      </div>
    </div>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Editar Packs de Chances</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 overflow-hidden">
          <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <input
              type="checkbox"
              id="sorteo-gratis"
              checked={esGratis}
              onChange={(e) => setEsGratis(e.target.checked)}
              className="mt-0.5 w-4 h-4 cursor-pointer"
            />
            <div>
              <Label
                htmlFor="sorteo-gratis"
                className="text-sm font-semibold cursor-pointer text-emerald-900"
              >
                Sorteo gratis (sin pago)
              </Label>
              <p className="text-xs text-emerald-800 mt-0.5">
                La página deja de mostrar precios y datos bancarios, y el
                formulario no pide comprobante. Las participaciones igual quedan
                pendientes de tu aprobación.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 overflow-y-auto pr-1">
            <PackCard
              id="pack1"
              label="Pack 1"
              color="text-green-400"
              pack={pack1}
              setPack={setPack1}
              placeholderDesc="Ej: Honda Wave 2025"
              placeholderPrecio="21.000"
            />
            <PackCard
              id="pack2"
              label="Pack 2 (Popular)"
              color="text-lime-400"
              pack={pack2}
              setPack={setPack2}
              placeholderDesc="Ej: Honda Wave + extras"
              placeholderPrecio="42.000"
            />
            <PackCard
              id="pack3"
              label="Pack 3"
              color="text-emerald-400"
              pack={pack3}
              setPack={setPack3}
              placeholderDesc="Ej: Honda Wave + más extras"
              placeholderPrecio="84.000"
            />
            <PackCard
              id="pack4"
              label="Pack 4"
              color="text-red-600"
              pack={pack4}
              setPack={setPack4}
              placeholderDesc="Descripción del pack 4"
              placeholderPrecio="0"
            />
            <PackCard
              id="pack5"
              label="Pack 5"
              color="text-cyan-400"
              pack={pack5}
              setPack={setPack5}
              placeholderDesc="Descripción del pack 5"
              placeholderPrecio="0"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Actualizando..." : "Actualizar Packs"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
