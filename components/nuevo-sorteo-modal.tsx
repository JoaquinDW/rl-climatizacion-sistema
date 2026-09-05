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
    // Sorteo gratuito: los precios se mandan en 0 y la landing los esconde
    esGratis: false,
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
        body: JSON.stringify(
          formData.esGratis
            ? { ...formData, precio6: 0, precio12: 0, precio24: 0, precio4: 0, precio5: 0 }
            : formData
        ),
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
      <DialogContent className="sm:max-w-[560px] bg-card-dark border-gray-700 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Plus className="h-5 w-5 text-green-400" />
            Crear Nuevo Sorteo
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-emerald-700/50 bg-emerald-950/40 p-3">
            <input
              type="checkbox"
              id="nuevo-sorteo-gratis"
              checked={formData.esGratis}
              onChange={(e) =>
                setFormData({ ...formData, esGratis: e.target.checked })
              }
              className="mt-0.5 h-4 w-4 cursor-pointer"
            />
            <div>
              <Label
                htmlFor="nuevo-sorteo-gratis"
                className="cursor-pointer text-sm font-semibold text-emerald-300"
              >
                Sorteo gratis (sin pago)
              </Label>
              <p className="mt-0.5 text-xs text-emerald-200/80">
                Sin precios, sin datos bancarios y sin comprobante. Los packs
                sólo definen cuántas chances recibe cada participante, y vos
                aprobás cada participación a mano.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nombre" className="text-gray-300">
              Nombre del Sorteo
            </Label>
            <Input
              id="nombre"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="Ej: T-SHIRT PREMIUM - SORTEO EXCLUSIVO"
              required
              className="bg-gray-800 border-gray-600 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalChances" className="text-gray-300">
                Total Chances
              </Label>
              <Input
                id="totalChances"
                type="number"
                value={formData.totalChances}
                onChange={(e) => setFormData({ ...formData, totalChances: Number(e.target.value) })}
                min="1"
                required
                className="bg-gray-800 border-gray-600 text-white"
              />
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

          {/* Pack 1 */}
          <div className="space-y-3 p-4 border border-gray-700 rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-green-400">Pack 1</h3>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="nuevo-pack1-visible"
                  checked={formData.pack1Visible}
                  onChange={(e) => setFormData({ ...formData, pack1Visible: e.target.checked })}
                  className="w-4 h-4 cursor-pointer"
                />
                <Label htmlFor="nuevo-pack1-visible" className="text-sm text-gray-300 cursor-pointer">
                  Visible
                </Label>
              </div>
            </div>
            <div className="space-y-3">
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
                    min="0"
                    value={formData.cantidadPack1}
                    onChange={(e) => setFormData({ ...formData, cantidadPack1: Number.parseInt(e.target.value) || 0 })}
                    className="mt-1 bg-gray-800 border-gray-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fechaSorteo" className="text-gray-700">
                    Fecha del sorteo
                  </Label>
                  <Input
                    id="pack1-precio"
                    type="text"
                    value={formData.esGratis ? "Gratis" : formatearPrecio(formData.precio6.toString())}
                    onChange={(e) => setFormData({ ...formData, precio6: parsearPrecio(e.target.value) })}
                    disabled={formData.esGratis}
                    placeholder="21.000"
                    className="mt-1 bg-gray-800 border-gray-600 text-white"
                  />
                </div>
              </div>
            </section>

          {/* Pack 2 */}
          <div className="space-y-3 p-4 border border-gray-700 rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lime-400">Pack 2 (Popular)</h3>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="nuevo-pack2-visible"
                  checked={formData.pack2Visible}
                  onChange={(e) => setFormData({ ...formData, pack2Visible: e.target.checked })}
                  className="w-4 h-4 cursor-pointer"
                />
                <Label htmlFor="nuevo-pack2-visible" className="text-sm text-gray-300 cursor-pointer">
                  Visible
                </Label>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <h3 id="packs-heading" className="text-sm font-semibold text-gray-900">
                  Packs de chances
                </h3>
                <p className="mt-0.5 text-xs text-gray-500">
                  Definí la cantidad, el precio y una descripción para cada opción.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="pack2-cantidad" className="text-gray-300">Cantidad de chances</Label>
                  <Input
                    id="pack2-cantidad"
                    type="number"
                    min="0"
                    value={formData.cantidadPack2}
                    onChange={(e) => setFormData({ ...formData, cantidadPack2: Number.parseInt(e.target.value) || 0 })}
                    className="mt-1 bg-gray-800 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="pack2-precio" className="text-gray-300">Precio ($)</Label>
                  <Input
                    id="pack2-precio"
                    type="text"
                    value={formData.esGratis ? "Gratis" : formatearPrecio(formData.precio12.toString())}
                    onChange={(e) => setFormData({ ...formData, precio12: parsearPrecio(e.target.value) })}
                    disabled={formData.esGratis}
                    placeholder="42.000"
                    className="mt-1 bg-gray-800 border-gray-600 text-white"
                  />
                </div>
              </div>

          {/* Pack 3 */}
          <div className="space-y-3 p-4 border border-gray-700 rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-emerald-400">Pack 3</h3>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="nuevo-pack3-visible"
                  checked={formData.pack3Visible}
                  onChange={(e) => setFormData({ ...formData, pack3Visible: e.target.checked })}
                  className="w-4 h-4 cursor-pointer"
                />
                <Label htmlFor="nuevo-pack3-visible" className="text-sm text-gray-300 cursor-pointer">
                  Visible
                </Label>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <Label htmlFor="pack3-descripcion" className="text-gray-300">Descripción</Label>
                <Input
                  id="pack3-descripcion"
                  type="text"
                  value={formData.descripcionPack3}
                  onChange={(e) => setFormData({ ...formData, descripcionPack3: e.target.value })}
                  placeholder="Ej: Honda Wave 2025 + 5 chances pre-venta"
                  className="mt-1 bg-gray-800 border-gray-600 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="pack3-cantidad" className="text-gray-300">Cantidad de chances</Label>
                  <Input
                    id="pack3-cantidad"
                    type="number"
                    min="0"
                    value={formData.cantidadPack3}
                    onChange={(e) => setFormData({ ...formData, cantidadPack3: Number.parseInt(e.target.value) || 0 })}
                    className="mt-1 bg-gray-800 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="pack3-precio" className="text-gray-300">Precio ($)</Label>
                  <Input
                    id="pack3-precio"
                    type="text"
                    value={formData.esGratis ? "Gratis" : formatearPrecio(formData.precio24.toString())}
                    onChange={(e) => setFormData({ ...formData, precio24: parsearPrecio(e.target.value) })}
                    disabled={formData.esGratis}
                    placeholder="84.000"
                    className="mt-1 bg-gray-800 border-gray-600 text-white"
                  />
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
                <div>
                  <Label htmlFor="nuevo-pack4-precio" className="text-gray-300">Precio ($)</Label>
                  <Input
                    id="nuevo-pack4-precio"
                    type="text"
                    value={formData.esGratis ? "Gratis" : formatearPrecio(formData.precio4.toString())}
                    onChange={(e) => setFormData({ ...formData, precio4: parsearPrecio(e.target.value) })}
                    disabled={formData.esGratis}
                    placeholder="0"
                    className="mt-1 bg-gray-800 border-gray-600 text-white"
                  />
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
                <div>
                  <Label htmlFor="nuevo-pack5-precio" className="text-gray-300">Precio ($)</Label>
                  <Input
                    id="nuevo-pack5-precio"
                    type="text"
                    value={formData.esGratis ? "Gratis" : formatearPrecio(formData.precio5.toString())}
                    onChange={(e) => setFormData({ ...formData, precio5: parsearPrecio(e.target.value) })}
                    disabled={formData.esGratis}
                    placeholder="0"
                    className="mt-1 bg-gray-800 border-gray-600 text-white"
                  />
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
