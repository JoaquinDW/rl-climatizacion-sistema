"use client"

import type React from "react"

import { useState } from "react"
import { Loader2, Plus } from "lucide-react"

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

interface NuevoSorteoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSorteoCreado: () => void
}

const INITIAL_FORM_DATA = {
  nombre: "",
  totalChances: 150,
  fechaSorteo: "",
  cantidadPack1: 6,
  cantidadPack2: 12,
  cantidadPack3: 24,
  precio6: 21000,
  precio12: 42000,
  precio24: 84000,
  descripcionPack1: "",
  descripcionPack2: "",
  descripcionPack3: "",
  pack1Visible: true,
  pack2Visible: true,
  pack3Visible: true,
  cantidadPack4: 0,
  precio4: 0,
  descripcionPack4: "",
  pack4Visible: false,
  cantidadPack5: 0,
  precio5: 0,
  descripcionPack5: "",
  pack5Visible: false,
  esGratis: false,
}

const formatearPrecio = (valor: string) => {
  const numeros = valor.replace(/\D/g, "")
  return numeros.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

const parsearPrecio = (valor: string) => {
  return Number.parseInt(valor.replace(/\./g, "")) || 0
}

interface PackCardProps {
  index: number
  description: string
  quantity: number
  price: number
  visible: boolean
  free: boolean
  descriptionPlaceholder: string
  pricePlaceholder: string
  popular?: boolean
  optional?: boolean
  onDescriptionChange: (value: string) => void
  onQuantityChange: (value: number) => void
  onPriceChange: (value: number) => void
  onVisibleChange: (value: boolean) => void
}

function PackCard({
  index,
  description,
  quantity,
  price,
  visible,
  free,
  descriptionPlaceholder,
  pricePlaceholder,
  popular,
  optional,
  onDescriptionChange,
  onQuantityChange,
  onPriceChange,
  onVisibleChange,
}: PackCardProps) {
  const id = `nuevo-pack${index}`

  return (
    <div
      className={
        optional
          ? "space-y-3 rounded-lg border border-dashed border-gray-300 bg-white p-4"
          : "space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4"
      }
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div>
            <h4 className="font-semibold text-gray-900">Pack {index}</h4>
            {optional && <p className="text-xs text-gray-500">Opcional</p>}
          </div>
          {popular && (
            <span className="rounded-full bg-gray-900 px-2 py-0.5 text-[11px] font-medium text-white">
              Popular
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id={`${id}-visible`}
            checked={visible}
            onChange={(event) => onVisibleChange(event.target.checked)}
            className="h-4 w-4 cursor-pointer accent-gray-900"
          />
          <Label
            htmlFor={`${id}-visible`}
            className="cursor-pointer text-sm text-gray-700"
          >
            Visible
          </Label>
        </div>
      </div>

      <div>
        <Label htmlFor={`${id}-descripcion`} className="text-gray-700">
          Descripción
        </Label>
        <Input
          id={`${id}-descripcion`}
          type="text"
          value={description}
          onChange={(event) => onDescriptionChange(event.target.value)}
          placeholder={descriptionPlaceholder}
          className="mt-1 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor={`${id}-cantidad`} className="text-gray-700">
            Cantidad de chances
          </Label>
          <Input
            id={`${id}-cantidad`}
            type="number"
            min="0"
            value={quantity}
            onChange={(event) =>
              onQuantityChange(Number.parseInt(event.target.value) || 0)
            }
            className="mt-1 border-gray-300 bg-white text-gray-900"
          />
        </div>

        <div>
          <Label htmlFor={`${id}-precio`} className="text-gray-700">
            Precio ($)
          </Label>
          <Input
            id={`${id}-precio`}
            type="text"
            value={free ? "Gratis" : formatearPrecio(price.toString())}
            onChange={(event) => onPriceChange(parsearPrecio(event.target.value))}
            disabled={free}
            placeholder={pricePlaceholder}
            className="mt-1 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 disabled:bg-gray-100 disabled:text-gray-600 disabled:opacity-100"
          />
        </div>
      </div>
    </div>
  )
}

export function NuevoSorteoModal({
  open,
  onOpenChange,
  onSorteoCreado,
}: NuevoSorteoModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState(INITIAL_FORM_DATA)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/crear-sorteo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          formData.esGratis
            ? {
                ...formData,
                precio6: 0,
                precio12: 0,
                precio24: 0,
                precio4: 0,
                precio5: 0,
              }
            : formData,
        ),
      })

      if (response.ok) {
        onSorteoCreado()
        onOpenChange(false)
        setFormData(INITIAL_FORM_DATA)
      }
    } catch (error) {
      console.error("Error creando sorteo:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100vh-2rem)] flex-col gap-0 overflow-hidden border-gray-200 bg-white p-0 text-gray-900 shadow-2xl sm:max-w-[600px]">
        <DialogHeader className="border-b border-gray-200 bg-gray-50 px-6 py-5 pr-12 text-left">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-900 text-white shadow-sm">
              <Plus className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-xl text-gray-900">
                Crear nuevo sorteo
              </DialogTitle>
              <DialogDescription className="text-sm text-gray-600">
                Completá los datos generales y configurá los packs de chances.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="space-y-6 overflow-y-auto px-6 py-5">
            <section
              className="space-y-4"
              aria-labelledby="datos-generales-heading"
            >
              <div>
                <h3
                  id="datos-generales-heading"
                  className="text-sm font-semibold text-gray-900"
                >
                  Datos generales
                </h3>
                <p className="mt-0.5 text-xs text-gray-500">
                  Esta información identifica el sorteo dentro del panel.
                </p>
              </div>

              <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <input
                  type="checkbox"
                  id="nuevo-sorteo-gratis"
                  checked={formData.esGratis}
                  onChange={(event) =>
                    setFormData({
                      ...formData,
                      esGratis: event.target.checked,
                    })
                  }
                  className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-emerald-700"
                />
                <div>
                  <Label
                    htmlFor="nuevo-sorteo-gratis"
                    className="cursor-pointer text-sm font-semibold text-emerald-900"
                  >
                    Sorteo gratis (sin pago)
                  </Label>
                  <p className="mt-1 text-xs leading-relaxed text-emerald-800">
                    Sin precios, datos bancarios ni comprobantes. Los packs sólo
                    definen cuántas chances recibe cada participante y las
                    participaciones se aprueban manualmente.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombre" className="text-gray-700">
                  Nombre del sorteo
                </Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(event) =>
                    setFormData({ ...formData, nombre: event.target.value })
                  }
                  placeholder="Ej: Sorteo Honda Wave 2026"
                  required
                  className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-400"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="totalChances" className="text-gray-700">
                    Total de chances
                  </Label>
                  <Input
                    id="totalChances"
                    type="number"
                    value={formData.totalChances}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        totalChances: Number(event.target.value),
                      })
                    }
                    min="1"
                    required
                    className="border-gray-300 bg-white text-gray-900"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fechaSorteo" className="text-gray-700">
                    Fecha del sorteo
                  </Label>
                  <Input
                    id="fechaSorteo"
                    type="date"
                    value={formData.fechaSorteo}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        fechaSorteo: event.target.value,
                      })
                    }
                    className="border-gray-300 bg-white text-gray-900"
                  />
                </div>
              </div>
            </section>

            <section
              className="space-y-3"
              aria-labelledby="packs-heading"
            >
              <div>
                <h3
                  id="packs-heading"
                  className="text-sm font-semibold text-gray-900"
                >
                  Packs de chances
                </h3>
                <p className="mt-0.5 text-xs text-gray-500">
                  Definí la cantidad, el precio y una descripción para cada
                  opción.
                </p>
              </div>

              <PackCard
                index={1}
                description={formData.descripcionPack1}
                quantity={formData.cantidadPack1}
                price={formData.precio6}
                visible={formData.pack1Visible}
                free={formData.esGratis}
                descriptionPlaceholder="Ej: Honda Wave 2026"
                pricePlaceholder="21.000"
                onDescriptionChange={(value) =>
                  setFormData({ ...formData, descripcionPack1: value })
                }
                onQuantityChange={(value) =>
                  setFormData({ ...formData, cantidadPack1: value })
                }
                onPriceChange={(value) =>
                  setFormData({ ...formData, precio6: value })
                }
                onVisibleChange={(value) =>
                  setFormData({ ...formData, pack1Visible: value })
                }
              />

              <PackCard
                index={2}
                popular
                description={formData.descripcionPack2}
                quantity={formData.cantidadPack2}
                price={formData.precio12}
                visible={formData.pack2Visible}
                free={formData.esGratis}
                descriptionPlaceholder="Ej: Honda Wave 2026 + 5 oportunidades en preventa"
                pricePlaceholder="42.000"
                onDescriptionChange={(value) =>
                  setFormData({ ...formData, descripcionPack2: value })
                }
                onQuantityChange={(value) =>
                  setFormData({ ...formData, cantidadPack2: value })
                }
                onPriceChange={(value) =>
                  setFormData({ ...formData, precio12: value })
                }
                onVisibleChange={(value) =>
                  setFormData({ ...formData, pack2Visible: value })
                }
              />

              <PackCard
                index={3}
                description={formData.descripcionPack3}
                quantity={formData.cantidadPack3}
                price={formData.precio24}
                visible={formData.pack3Visible}
                free={formData.esGratis}
                descriptionPlaceholder="Ej: Honda Wave 2026 + 5 chances de preventa"
                pricePlaceholder="84.000"
                onDescriptionChange={(value) =>
                  setFormData({ ...formData, descripcionPack3: value })
                }
                onQuantityChange={(value) =>
                  setFormData({ ...formData, cantidadPack3: value })
                }
                onPriceChange={(value) =>
                  setFormData({ ...formData, precio24: value })
                }
                onVisibleChange={(value) =>
                  setFormData({ ...formData, pack3Visible: value })
                }
              />

              <PackCard
                index={4}
                optional
                description={formData.descripcionPack4}
                quantity={formData.cantidadPack4}
                price={formData.precio4}
                visible={formData.pack4Visible}
                free={formData.esGratis}
                descriptionPlaceholder="Descripción del pack 4"
                pricePlaceholder="0"
                onDescriptionChange={(value) =>
                  setFormData({ ...formData, descripcionPack4: value })
                }
                onQuantityChange={(value) =>
                  setFormData({ ...formData, cantidadPack4: value })
                }
                onPriceChange={(value) =>
                  setFormData({ ...formData, precio4: value })
                }
                onVisibleChange={(value) =>
                  setFormData({ ...formData, pack4Visible: value })
                }
              />

              <PackCard
                index={5}
                optional
                description={formData.descripcionPack5}
                quantity={formData.cantidadPack5}
                price={formData.precio5}
                visible={formData.pack5Visible}
                free={formData.esGratis}
                descriptionPlaceholder="Descripción del pack 5"
                pricePlaceholder="0"
                onDescriptionChange={(value) =>
                  setFormData({ ...formData, descripcionPack5: value })
                }
                onQuantityChange={(value) =>
                  setFormData({ ...formData, cantidadPack5: value })
                }
                onPriceChange={(value) =>
                  setFormData({ ...formData, precio5: value })
                }
                onVisibleChange={(value) =>
                  setFormData({ ...formData, pack5Visible: value })
                }
              />
            </section>
          </div>

          <DialogFooter className="border-t border-gray-200 bg-gray-50 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="w-full border-gray-300 bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 text-white shadow-sm hover:bg-gray-800 sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  Crear sorteo
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
