"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Loader2 } from "lucide-react"

interface NuevoSorteoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSorteoCreado: () => void
}

export function NuevoSorteoModal({ open, onOpenChange, onSorteoCreado }: NuevoSorteoModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
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
    cantidadPack4: 0,
    precio4: 0,
    descripcionPack4: "",
    pack4Visible: false,
    cantidadPack5: 0,
    precio5: 0,
    descripcionPack5: "",
    pack5Visible: false,
  })

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
      const response = await fetch("/api/crear-sorteo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        onSorteoCreado()
        onOpenChange(false)
        setFormData({
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
          cantidadPack4: 0,
          precio4: 0,
          descripcionPack4: "",
          pack4Visible: false,
          cantidadPack5: 0,
          precio5: 0,
          descripcionPack5: "",
          pack5Visible: false,
        })
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
            <section className="space-y-4" aria-labelledby="datos-generales-heading">
              <div>
                <h3 id="datos-generales-heading" className="text-sm font-semibold text-gray-900">
                  Datos generales
                </h3>
                <p className="mt-0.5 text-xs text-gray-500">
                  Esta información identifica el sorteo dentro del panel.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nombre" className="text-gray-700">
                  Nombre del sorteo
                </Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
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
                    onChange={(e) => setFormData({ ...formData, totalChances: Number(e.target.value) })}
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
                    onChange={(e) => setFormData({ ...formData, fechaSorteo: e.target.value })}
                    className="border-gray-300 bg-white text-gray-900"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-3" aria-labelledby="packs-heading">
              <div>
                <h3 id="packs-heading" className="text-sm font-semibold text-gray-900">
                  Packs de chances
                </h3>
                <p className="mt-0.5 text-xs text-gray-500">
                  Definí la cantidad, el precio y una descripción para cada opción.
                </p>
              </div>

              {/* Pack 1 */}
              <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h4 className="font-semibold text-gray-900">Pack 1</h4>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="pack1-descripcion" className="text-gray-700">Descripción</Label>
                    <Input
                      id="pack1-descripcion"
                      type="text"
                      value={formData.descripcionPack1}
                      onChange={(e) => setFormData({ ...formData, descripcionPack1: e.target.value })}
                      placeholder="Ej: Honda Wave 2026"
                      className="mt-1 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="pack1-cantidad" className="text-gray-700">Cantidad de chances</Label>
                      <Input
                        id="pack1-cantidad"
                        type="number"
                        min="1"
                        value={formData.cantidadPack1}
                        onChange={(e) => setFormData({ ...formData, cantidadPack1: Number.parseInt(e.target.value) || 0 })}
                        className="mt-1 border-gray-300 bg-white text-gray-900"
                      />
                    </div>
                    <div>
                      <Label htmlFor="pack1-precio" className="text-gray-700">Precio ($)</Label>
                      <Input
                        id="pack1-precio"
                        type="text"
                        value={formatearPrecio(formData.precio6.toString())}
                        onChange={(e) => setFormData({ ...formData, precio6: parsearPrecio(e.target.value) })}
                        placeholder="21.000"
                        className="mt-1 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pack 2 */}
              <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-gray-900">Pack 2</h4>
                  <span className="rounded-full bg-gray-900 px-2 py-0.5 text-[11px] font-medium text-white">
                    Popular
                  </span>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="pack2-descripcion" className="text-gray-700">Descripción</Label>
                    <Input
                      id="pack2-descripcion"
                      type="text"
                      value={formData.descripcionPack2}
                      onChange={(e) => setFormData({ ...formData, descripcionPack2: e.target.value })}
                      placeholder="Ej: Honda Wave 2026 + 5 oportunidades en preventa"
                      className="mt-1 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="pack2-cantidad" className="text-gray-700">Cantidad de chances</Label>
                      <Input
                        id="pack2-cantidad"
                        type="number"
                        min="1"
                        value={formData.cantidadPack2}
                        onChange={(e) => setFormData({ ...formData, cantidadPack2: Number.parseInt(e.target.value) || 0 })}
                        className="mt-1 border-gray-300 bg-white text-gray-900"
                      />
                    </div>
                    <div>
                      <Label htmlFor="pack2-precio" className="text-gray-700">Precio ($)</Label>
                      <Input
                        id="pack2-precio"
                        type="text"
                        value={formatearPrecio(formData.precio12.toString())}
                        onChange={(e) => setFormData({ ...formData, precio12: parsearPrecio(e.target.value) })}
                        placeholder="42.000"
                        className="mt-1 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pack 3 */}
              <div className="space-y-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <h4 className="font-semibold text-gray-900">Pack 3</h4>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="pack3-descripcion" className="text-gray-700">Descripción</Label>
                    <Input
                      id="pack3-descripcion"
                      type="text"
                      value={formData.descripcionPack3}
                      onChange={(e) => setFormData({ ...formData, descripcionPack3: e.target.value })}
                      placeholder="Ej: Honda Wave 2026 + 5 chances de preventa"
                      className="mt-1 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="pack3-cantidad" className="text-gray-700">Cantidad de chances</Label>
                      <Input
                        id="pack3-cantidad"
                        type="number"
                        min="1"
                        value={formData.cantidadPack3}
                        onChange={(e) => setFormData({ ...formData, cantidadPack3: Number.parseInt(e.target.value) || 0 })}
                        className="mt-1 border-gray-300 bg-white text-gray-900"
                      />
                    </div>
                    <div>
                      <Label htmlFor="pack3-precio" className="text-gray-700">Precio ($)</Label>
                      <Input
                        id="pack3-precio"
                        type="text"
                        value={formatearPrecio(formData.precio24.toString())}
                        onChange={(e) => setFormData({ ...formData, precio24: parsearPrecio(e.target.value) })}
                        placeholder="84.000"
                        className="mt-1 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pack 4 */}
              <div className="space-y-3 rounded-lg border border-dashed border-gray-300 bg-white p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">Pack 4</h4>
                    <p className="text-xs text-gray-500">Opcional</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="nuevo-pack4-visible"
                      checked={formData.pack4Visible}
                      onChange={(e) => setFormData({ ...formData, pack4Visible: e.target.checked })}
                      className="h-4 w-4 cursor-pointer accent-gray-900"
                    />
                    <Label htmlFor="nuevo-pack4-visible" className="cursor-pointer text-sm text-gray-700">
                      Visible
                    </Label>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="nuevo-pack4-descripcion" className="text-gray-700">Descripción</Label>
                    <Input
                      id="nuevo-pack4-descripcion"
                      type="text"
                      value={formData.descripcionPack4}
                      onChange={(e) => setFormData({ ...formData, descripcionPack4: e.target.value })}
                      placeholder="Descripción del pack 4"
                      className="mt-1 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="nuevo-pack4-cantidad" className="text-gray-700">Cantidad de chances</Label>
                      <Input
                        id="nuevo-pack4-cantidad"
                        type="number"
                        min="0"
                        value={formData.cantidadPack4}
                        onChange={(e) => setFormData({ ...formData, cantidadPack4: Number.parseInt(e.target.value) || 0 })}
                        className="mt-1 border-gray-300 bg-white text-gray-900"
                      />
                    </div>
                    <div>
                      <Label htmlFor="nuevo-pack4-precio" className="text-gray-700">Precio ($)</Label>
                      <Input
                        id="nuevo-pack4-precio"
                        type="text"
                        value={formatearPrecio(formData.precio4.toString())}
                        onChange={(e) => setFormData({ ...formData, precio4: parsearPrecio(e.target.value) })}
                        placeholder="0"
                        className="mt-1 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Pack 5 */}
              <div className="space-y-3 rounded-lg border border-dashed border-gray-300 bg-white p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-semibold text-gray-900">Pack 5</h4>
                    <p className="text-xs text-gray-500">Opcional</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="nuevo-pack5-visible"
                      checked={formData.pack5Visible}
                      onChange={(e) => setFormData({ ...formData, pack5Visible: e.target.checked })}
                      className="h-4 w-4 cursor-pointer accent-gray-900"
                    />
                    <Label htmlFor="nuevo-pack5-visible" className="cursor-pointer text-sm text-gray-700">
                      Visible
                    </Label>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="nuevo-pack5-descripcion" className="text-gray-700">Descripción</Label>
                    <Input
                      id="nuevo-pack5-descripcion"
                      type="text"
                      value={formData.descripcionPack5}
                      onChange={(e) => setFormData({ ...formData, descripcionPack5: e.target.value })}
                      placeholder="Descripción del pack 5"
                      className="mt-1 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="nuevo-pack5-cantidad" className="text-gray-700">Cantidad de chances</Label>
                      <Input
                        id="nuevo-pack5-cantidad"
                        type="number"
                        min="0"
                        value={formData.cantidadPack5}
                        onChange={(e) => setFormData({ ...formData, cantidadPack5: Number.parseInt(e.target.value) || 0 })}
                        className="mt-1 border-gray-300 bg-white text-gray-900"
                      />
                    </div>
                    <div>
                      <Label htmlFor="nuevo-pack5-precio" className="text-gray-700">Precio ($)</Label>
                      <Input
                        id="nuevo-pack5-precio"
                        type="text"
                        value={formatearPrecio(formData.precio5.toString())}
                        onChange={(e) => setFormData({ ...formData, precio5: parsearPrecio(e.target.value) })}
                        placeholder="0"
                        className="mt-1 border-gray-300 bg-white text-gray-900 placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                </div>
              </div>
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
