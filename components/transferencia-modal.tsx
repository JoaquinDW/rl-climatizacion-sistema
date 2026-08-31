"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Upload, FileImage, X, Copy, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface TransferenciaModalProps {
  isOpen: boolean
  onClose: () => void
  pack: {
    chances: number
    precio: number
  } | null
  onSubmit: (data: {
    nombre: string
    email: string
    telefono: string
    comprobanteFile: File
  }) => void
  alias?: string
  titular?: string
  cbu?: string
  banco?: string
}

export function TransferenciaModal({
  isOpen,
  onClose,
  pack,
  onSubmit,
  alias = "",
  titular = "",
  cbu = "",
  banco = "",
}: TransferenciaModalProps) {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
  })
  const [comprobanteFile, setComprobanteFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [loading, setLoading] = useState(false)
  const [aliasCopiado, setAliasCopiado] = useState(false)
  const [cbuCopiado, setCbuCopiado] = useState(false)
  const { toast } = useToast()

  const copiarAlias = async () => {
    try {
      await navigator.clipboard.writeText(alias)
      setAliasCopiado(true)
      toast({
        title: "¡Alias copiado!",
        description: "Ya puedes pegarlo en tu app bancaria",
      })
      setTimeout(() => setAliasCopiado(false), 2000)
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo copiar el alias",
      })
    }
  }

  const copiarCbu = async () => {
    try {
      await navigator.clipboard.writeText(cbu)
      setCbuCopiado(true)
      toast({
        title: "¡CBU copiado!",
        description: "Ya puedes pegarlo en tu app bancaria",
      })
      setTimeout(() => setCbuCopiado(false), 2000)
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo copiar el CBU",
      })
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleFileSelect = (file: File) => {
    const validTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "application/pdf",
    ]
    if (!validTypes.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Tipo de archivo no válido",
        description: "Solo se permiten imágenes (JPG, PNG, WEBP) o PDF",
      })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "Archivo muy grande",
        description: "El archivo debe ser menor a 5MB",
      })
      return
    }
    setComprobanteFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombre || !formData.email || !formData.telefono) {
      toast({
        variant: "destructive",
        title: "Campos incompletos",
        description: "Por favor completá todos los campos requeridos",
      })
      return
    }

    // El email es el único canal por el que se envían los números, así que
    // se valida antes que nada.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      toast({
        variant: "destructive",
        title: "Email inválido",
        description: "Revisá el email: ahí te enviamos tus números.",
      })
      return
    }

    // Validar que el WhatsApp sea un número válido
    const soloDigitos = formData.telefono.replace(/\D/g, "")
    if (soloDigitos.length < 8) {
      toast({
        variant: "destructive",
        title: "WhatsApp inválido",
        description: "Ingresá un número de WhatsApp válido (solo números)",
      })
      return
    }

    if (!comprobanteFile) {
      toast({
        variant: "destructive",
        title: "Falta el comprobante",
        description: "Debes subir el comprobante de transferencia",
      })
      return
    }

    setLoading(true)
    try {
      onSubmit({ ...formData, comprobanteFile })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({ nombre: "", email: "", telefono: "" })
    setComprobanteFile(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  if (!pack) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-[#111318] text-white border border-[#ef4962]/20 px-1 py-10 lg:py-2 overflow-hidden max-h-[95vh] overflow-y-auto rounded-md">
        {/* Header */}
        <div className="pt-8 pb-4 px-6 text-center">
          <h2 className="text-3xl font-display font-semibold uppercase tracking-tight text-brand-display">
            Completá tu compra
          </h2>
          <p className="text-brand-muted text-sm mt-1">
            Transferí y cargá el comprobante
          </p>
        </div>

        {/* Monto destacado */}
        <div className="mx-6 mb-4 rounded-md bg-[#1a1d23] border border-[#ef4962]/15 p-4 text-center">
          <p className="text-sm text-brand-muted mb-1">Total a transferir</p>
          <p className="text-3xl font-black text-brand-display">
            ${pack.precio.toLocaleString()}
          </p>
          <p className="text-xs text-brand-muted mt-1">
            {pack.chances} {pack.chances === 1 ? "chance" : "chances"}
          </p>
        </div>

        {/* Alias */}
        <div className="mx-6 mb-5 rounded-md bg-[#1a1d23] border border-[#ef4962]/15 p-4">
          <p className="text-xs text-brand-muted uppercase tracking-widest mb-2 font-semibold">
            Alias
          </p>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-[#08090b] rounded-md border border-[#ef4962]/30 px-4 py-3">
              <span className="font-mono text-base text-brand-accent tracking-wide">
                {alias}
              </span>
            </div>
            <button
              type="button"
              onClick={copiarAlias}
              aria-label="Copiar alias"
              className="btn-brand flex items-center justify-center w-11 h-11 rounded-md flex-shrink-0"
            >
              {aliasCopiado ? (
                <Check className="w-5 h-5" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>
          </div>
          <p className="text-xs text-brand-muted mt-2">Titular: {titular}</p>
        </div>

        {/* CBU */}
        {cbu && (
          <div className="mx-6 mb-5 rounded-md bg-[#1a1d23] border border-[#ef4962]/15 p-4">
            <p className="text-xs text-brand-muted uppercase tracking-widest mb-2 font-semibold">
              CBU / CVU
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-[#08090b] rounded-md border border-[#ef4962]/30 px-4 py-3 overflow-hidden">
                <span className="font-mono text-sm text-brand-accent tracking-wide break-all">
                  {cbu}
                </span>
              </div>
              <button
                type="button"
                onClick={copiarCbu}
                aria-label="Copiar CBU"
                className="btn-brand flex items-center justify-center w-11 h-11 rounded-md flex-shrink-0"
              >
                {cbuCopiado ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
            {banco && (
              <p className="text-xs text-brand-muted mt-2">Banco: {banco}</p>
            )}
          </div>
        )}

        {/* Banco (si no hay CBU pero sí banco) */}
        {!cbu && banco && (
          <div className="mx-6 mb-5 rounded-md bg-[#1a1d23] border border-[#ef4962]/15 p-4">
            <p className="text-xs text-brand-muted uppercase tracking-widest mb-1 font-semibold">
              Banco
            </p>
            <p className="text-base text-white">{banco}</p>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-3">
          <p className="text-xs text-brand-muted uppercase tracking-widest font-semibold mb-3">
            Tus datos
          </p>

          <div>
            <Label
              htmlFor="nombre"
              className="text-brand-muted text-xs mb-1 block"
            >
              Nombre completo *
            </Label>
            <Input
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              placeholder="Juan Pérez"
              className="bg-[#1a1d23] border-[#c0c0c0]/15 text-white placeholder:text-[#686c73] focus:border-[#ef4962]/60 focus-visible:ring-[#ef4962]/25 h-11"
              disabled={loading}
            />
          </div>

          <div>
            <Label
              htmlFor="email"
              className="text-brand-muted text-xs mb-1 block"
            >
              Email *{" "}
              <span className="text-[#686c73]">(recibís tus números acá)</span>
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="juan@email.com"
              className="bg-[#1a1d23] border-[#c0c0c0]/15 text-white placeholder:text-[#686c73] focus:border-[#ef4962]/60 focus-visible:ring-[#ef4962]/25 h-11"
              disabled={loading}
            />
          </div>

          <div>
            <Label
              htmlFor="telefono"
              className="text-brand-muted text-xs mb-1 block"
            >
              WhatsApp *{" "}
              <span className="text-[#686c73]">(para contactarte)</span>
            </Label>
            <Input
              id="telefono"
              name="telefono"
              type="tel"
              inputMode="numeric"
              value={formData.telefono}
              onChange={handleInputChange}
              placeholder="3794123456"
              className="bg-[#1a1d23] border-[#c0c0c0]/15 text-white placeholder:text-[#686c73] focus:border-[#ef4962]/60 focus-visible:ring-[#ef4962]/25 h-11"
              disabled={loading}
            />
          </div>

          {/* Comprobante */}
          <div>
            <Label className="text-brand-muted text-xs mb-1 block uppercase tracking-widest font-semibold">
              Comprobante *
            </Label>
            <div
              className={`mt-1 border-2 border-dashed rounded-md p-5 text-center cursor-pointer transition-colors ${
                dragOver
                  ? "border-[#ef4962] bg-[#ef4962]/10"
                  : comprobanteFile
                    ? "border-emerald-600/50 bg-emerald-500/10"
                    : "border-[#c0c0c0]/20 hover:border-[#ef4962]/50 bg-[#1a1d23]"
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault()
                setDragOver(true)
              }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <input
                id="file-input"
                type="file"
                className="hidden"
                accept="image/*,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileSelect(file)
                }}
                disabled={loading}
              />

              {comprobanteFile ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <FileImage className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-emerald-400 truncate max-w-[180px]">
                        {comprobanteFile.name}
                      </p>
                      <p className="text-xs text-[#686c73]">
                        {(comprobanteFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setComprobanteFile(null)
                    }}
                    className="w-7 h-7 rounded-full bg-[#333] hover:bg-[#444] flex items-center justify-center flex-shrink-0"
                    disabled={loading}
                  >
                    <X className="w-4 h-4 text-brand-copy" />
                  </button>
                </div>
              ) : (
                <div className="space-y-1">
                  <Upload className="w-7 h-7 text-[#686c73] mx-auto" />
                  <p className="text-sm text-brand-copy">
                    Tocá para subir el comprobante
                  </p>
                  <p className="text-xs text-[#686c73]">
                    JPG, PNG, WEBP o PDF · máx. 5MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={loading}
              className="flex-1 text-brand-muted hover:text-white hover:bg-[#1a1d23] border border-[#c0c0c0]/20"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="btn-brand flex-1 font-bold text-base h-11"
            >
              {loading ? "Enviando..." : "Finalizar compra"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
