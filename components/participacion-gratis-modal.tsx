"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Gift } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ParticipacionGratisModalProps {
  isOpen: boolean
  onClose: () => void
  pack: {
    chances: number
  } | null
  onSubmit: (data: {
    nombre: string
    email: string
    telefono: string
    instagram: string
  }) => void
  precioLabel?: string
  requisitosTitulo?: string
  requisitos?: string
  nota?: string
}

export function ParticipacionGratisModal({
  isOpen,
  onClose,
  pack,
  onSubmit,
  precioLabel = "GRATIS",
  requisitosTitulo = "Cómo participar",
  requisitos = "",
  nota = "",
}: ParticipacionGratisModalProps) {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    telefono: "",
    instagram: "",
  })
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const listaRequisitos = requisitos
    .split("\n")
    .map((linea) => linea.trim())
    .filter(Boolean)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !formData.nombre ||
      !formData.email ||
      !formData.telefono ||
      !formData.instagram
    ) {
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

    // Sin el usuario de Instagram no podemos verificar que nos siga
    const instagram = formData.instagram.trim().replace(/^@+/, "")
    if (instagram.length < 2) {
      toast({
        variant: "destructive",
        title: "Instagram inválido",
        description: "Ingresá tu usuario de Instagram para poder verificarlo",
      })
      return
    }

    setLoading(true)
    try {
      onSubmit({ ...formData, instagram })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({ nombre: "", email: "", telefono: "", instagram: "" })
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
            Participá gratis
          </h2>
          <p className="text-brand-muted text-sm mt-1">
            Completá tus datos y quedás anotado
          </p>
        </div>

        {/* Chances destacadas (reemplaza al bloque de monto a transferir) */}
        <div className="mx-6 mb-4 rounded-md bg-[#1a1d23] border border-[#ef4962]/15 p-4 text-center">
          <p className="text-3xl font-black text-brand-display flex items-center justify-center gap-2">
            <Gift className="w-7 h-7 text-brand-accent" strokeWidth={1.5} />
            {precioLabel}
          </p>
          <p className="text-xs text-brand-muted mt-1">
            {pack.chances} {pack.chances === 1 ? "chance" : "chances"}
          </p>
        </div>

        {/* Requisitos */}
        {listaRequisitos.length > 0 && (
          <div className="mx-6 mb-5 rounded-md bg-[#1a1d23] border border-[#ef4962]/15 p-4">
            <p className="text-xs text-brand-muted uppercase tracking-widest mb-3 font-semibold">
              {requisitosTitulo}
            </p>
            <ol className="space-y-2">
              {listaRequisitos.map((requisito, index) => (
                <li
                  key={`${index}-${requisito}`}
                  className="flex items-start gap-3"
                >
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#ef4962]/15 text-[11px] font-bold text-brand-accent">
                    {index + 1}
                  </span>
                  <span className="text-sm text-brand-copy leading-snug">
                    {requisito}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-3">
          <p className="text-xs text-brand-muted uppercase tracking-widest font-semibold mb-3">
            Tus datos
          </p>

          <div>
            <Label
              htmlFor="nombre-gratis"
              className="text-brand-muted text-xs mb-1 block"
            >
              Nombre completo *
            </Label>
            <Input
              id="nombre-gratis"
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
              htmlFor="email-gratis"
              className="text-brand-muted text-xs mb-1 block"
            >
              Email *{" "}
              <span className="text-[#686c73]">(recibís tus números acá)</span>
            </Label>
            <Input
              id="email-gratis"
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
              htmlFor="telefono-gratis"
              className="text-brand-muted text-xs mb-1 block"
            >
              WhatsApp *{" "}
              <span className="text-[#686c73]">(para contactarte)</span>
            </Label>
            <Input
              id="telefono-gratis"
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

          <div>
            <Label
              htmlFor="instagram-gratis"
              className="text-brand-muted text-xs mb-1 block"
            >
              Instagram *{" "}
              <span className="text-[#686c73]">
                (verificamos que nos sigas)
              </span>
            </Label>
            <Input
              id="instagram-gratis"
              name="instagram"
              value={formData.instagram}
              onChange={handleInputChange}
              placeholder="@tuusuario"
              autoCapitalize="none"
              autoCorrect="off"
              className="bg-[#1a1d23] border-[#c0c0c0]/15 text-white placeholder:text-[#686c73] focus:border-[#ef4962]/60 focus-visible:ring-[#ef4962]/25 h-11"
              disabled={loading}
            />
          </div>

          {nota && (
            <p className="text-xs text-brand-muted pt-1 leading-relaxed">
              {nota}
            </p>
          )}

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
              {loading ? "Enviando..." : "Participar gratis"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
