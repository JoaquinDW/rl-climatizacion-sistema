"use client"

import { useState } from "react"

// Helper function para detectar si un string es un número de teléfono o un usuario de Instagram
const esNumeroTelefono = (valor: string | undefined): boolean => {
  if (!valor) return false
  // Si contiene solo números, espacios, +, -, (, ) es un teléfono
  return /^[\d\s+()-]+$/.test(valor)
}
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Eye,
  Check,
  X,
  Mail,
  Calendar,
  MessageCircleMore,
  DollarSign,
  Hash,
  FileText,
  AlertTriangle,
  Instagram,
} from "lucide-react"
import type { Comprador } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface TransferenciasPendientesProps {
  transferencias: Comprador[]
  onApprobar: (id: string) => Promise<void>
  onRechazar: (id: string, motivo?: string) => Promise<void>
  onContactar: (comprador: Comprador) => void
}

export function TransferenciasPendientes({
  transferencias,
  onApprobar,
  onRechazar,
  onContactar,
}: TransferenciasPendientesProps) {
  const [compradorSeleccionado, setCompradorSeleccionado] =
    useState<Comprador | null>(null)
  const [modalAprobacion, setModalAprobacion] = useState(false)
  const [modalRechazo, setModalRechazo] = useState(false)
  const [motivoRechazo, setMotivoRechazo] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleVerComprobante = (comprador: Comprador) => {
    setCompradorSeleccionado(comprador)
  }

  const handleAprobar = async (comprador: Comprador) => {
    setCompradorSeleccionado(comprador)
    setModalAprobacion(true)
  }

  const confirmarAprobacion = async () => {
    if (!compradorSeleccionado) return

    setLoading(true)
    try {
      await onApprobar(compradorSeleccionado.id)
      toast({
        title: esGratis(compradorSeleccionado)
          ? "✅ Participación aprobada"
          : "✅ Transferencia aprobada",
        description: `Se han asignado ${compradorSeleccionado.cantidad_chances} números a ${compradorSeleccionado.nombre}`,
      })
      setModalAprobacion(false)
      setCompradorSeleccionado(null)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo aprobar la solicitud",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRechazar = (comprador: Comprador) => {
    setCompradorSeleccionado(comprador)
    setModalRechazo(true)
    setMotivoRechazo("")
  }

  const confirmarRechazo = async () => {
    if (!compradorSeleccionado) return

    setLoading(true)
    try {
      await onRechazar(compradorSeleccionado.id, motivoRechazo)
      toast({
        title: esGratis(compradorSeleccionado)
          ? "❌ Participación rechazada"
          : "❌ Transferencia rechazada",
        description: esGratis(compradorSeleccionado)
          ? `Se ha rechazado la participación de ${compradorSeleccionado.nombre}`
          : `Se ha rechazado la transferencia de ${compradorSeleccionado.nombre}`,
      })
      setModalRechazo(false)
      setCompradorSeleccionado(null)
      setMotivoRechazo("")
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo rechazar la solicitud",
      })
    } finally {
      setLoading(false)
    }
  }

  // Participación en un sorteo gratuito: no hay monto ni comprobante que revisar,
  // lo que se verifica es que la persona siga las redes (de ahí el link a Instagram).
  const esGratis = (comprador: Comprador): boolean =>
    comprador.metodo_pago === "gratis"

  const obtenerUrlComprobante = (comprador: Comprador): string => {
    // El comprobante está en comprobante_url
    return comprador.comprobante_url || comprador.mercadopago_id || ""
  }

  const esPdf = (url: string): boolean => {
    // Ignorar query params al chequear la extensión
    const sinQuery = url.split("?")[0].toLowerCase()
    return sinQuery.endsWith(".pdf")
  }

  const gratisSeleccionado =
    !!compradorSeleccionado && esGratis(compradorSeleccionado)

  if (transferencias.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay solicitudes pendientes
          </h3>
          <p className="text-gray-500">
            Ya procesaste todas las transferencias y participaciones.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Pendientes de Aprobación
            <Badge variant="secondary">{transferencias.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Comprador</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Chances</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Comprobante / Instagram</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transferencias.map((transferencia) => (
                <TableRow key={transferencia.id}>
                  <TableCell className="font-medium">
                    {transferencia.nombre}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {transferencia.instagram_username ? (
                        <div className="text-sm text-gray-500">
                          📷 @{transferencia.instagram_username}
                        </div>
                      ) : transferencia.telefono && esNumeroTelefono(transferencia.telefono) ? (
                        <div className="text-sm text-gray-500">
                          📱 {transferencia.telefono}
                        </div>
                      ) : transferencia.telefono ? (
                        <div className="text-sm text-gray-500">
                          📷 @{transferencia.telefono}
                        </div>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      <Hash className="h-3 w-3 mr-1" />
                      {transferencia.cantidad_chances}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {esGratis(transferencia) ? (
                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                        Gratis
                      </Badge>
                    ) : (
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 text-green-600 mr-1" />$
                        {transferencia.precio_pagado?.toLocaleString()}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(transferencia.created_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    {esGratis(transferencia) ? (
                      transferencia.instagram_username ? (
                        <a
                          href={`https://instagram.com/${transferencia.instagram_username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                        >
                          <Instagram className="h-4 w-4" />@
                          {transferencia.instagram_username}
                        </a>
                      ) : (
                        <span className="text-sm text-gray-400">Sin Instagram</span>
                      )
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVerComprobante(transferencia)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleAprobar(transferencia)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Aprobar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRechazar(transferencia)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Rechazar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onContactar(transferencia)}
                      >
                        <MessageCircleMore className="h-4 w-4" />
                        Contactar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de vista de comprobante */}
      <Dialog
        open={
          !!compradorSeleccionado &&
          !esGratis(compradorSeleccionado) &&
          !modalAprobacion &&
          !modalRechazo
        }
        onOpenChange={(open) => !open && setCompradorSeleccionado(null)}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Comprobante de {compradorSeleccionado?.nombre}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {compradorSeleccionado && (
              <>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {compradorSeleccionado.instagram_username ? (
                    <div>
                      <strong>Instagram:</strong> @{compradorSeleccionado.instagram_username}
                    </div>
                  ) : compradorSeleccionado.telefono && esNumeroTelefono(compradorSeleccionado.telefono) ? (
                    <div>
                      <strong>WhatsApp:</strong> {compradorSeleccionado.telefono}
                    </div>
                  ) : compradorSeleccionado.telefono ? (
                    <div>
                      <strong>Instagram:</strong> @{compradorSeleccionado.telefono}
                    </div>
                  ) : null}
                  <div>
                    <strong>Chances:</strong>{" "}
                    {compradorSeleccionado.cantidad_chances}
                  </div>
                  <div>
                    <strong>Monto:</strong> $
                    {compradorSeleccionado.precio_pagado?.toLocaleString()}
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">
                    Comprobante de transferencia:
                  </h4>
                  {obtenerUrlComprobante(compradorSeleccionado) ? (
                    esPdf(obtenerUrlComprobante(compradorSeleccionado)) ? (
                      <div className="space-y-2">
                        <iframe
                          src={obtenerUrlComprobante(compradorSeleccionado)}
                          title="Comprobante de transferencia (PDF)"
                          className="w-full h-[500px] rounded border"
                        />
                        <a
                          href={obtenerUrlComprobante(compradorSeleccionado)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                        >
                          <FileText className="h-4 w-4" />
                          Abrir PDF en una pestaña nueva
                        </a>
                      </div>
                    ) : (
                      <a
                        href={obtenerUrlComprobante(compradorSeleccionado)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img
                          src={obtenerUrlComprobante(compradorSeleccionado)}
                          alt="Comprobante de transferencia"
                          className="max-w-80 h-auto rounded border"
                        />
                      </a>
                    )
                  ) : (
                    <p className="text-gray-500">No se encontró comprobante</p>
                  )}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación de aprobación */}
      <Dialog open={modalAprobacion} onOpenChange={setModalAprobacion}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {gratisSeleccionado ? "Aprobar Participación" : "Aprobar Transferencia"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              ¿Confirmas que quieres aprobar{" "}
              {gratisSeleccionado ? "la participación" : "la transferencia"} de{" "}
              <strong>{compradorSeleccionado?.nombre}</strong>?
            </p>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-800">
                ✅ Se asignarán automáticamente{" "}
                {compradorSeleccionado?.cantidad_chances} números únicos
                <br />
                ✅ Se le enviarán los números por email
                <br />✅ El participante aparecerá en la lista oficial
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAprobacion(false)}>
              Cancelar
            </Button>
            <Button
              onClick={confirmarAprobacion}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading
                ? "Procesando..."
                : gratisSeleccionado
                  ? "Aprobar Participación"
                  : "Aprobar Transferencia"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de rechazo */}
      <Dialog open={modalRechazo} onOpenChange={setModalRechazo}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {gratisSeleccionado
                ? "Rechazar Participación"
                : "Rechazar Transferencia"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              ¿Por qué rechazas{" "}
              {gratisSeleccionado ? "la participación" : "la transferencia"} de{" "}
              <strong>{compradorSeleccionado?.nombre}</strong>?
            </p>
            <div>
              <Label htmlFor="motivo">Motivo (opcional)</Label>
              <Textarea
                id="motivo"
                placeholder={
                  gratisSeleccionado
                    ? "Ej: no nos sigue en Instagram, usuario inexistente, etc."
                    : "Ej: Comprobante ilegible, monto incorrecto, etc."
                }
                value={motivoRechazo}
                onChange={(e) => setMotivoRechazo(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-800">
                ⚠️ Esta acción marcará la solicitud como cancelada
                <br />
                ⚠️ No se asignarán números al participante
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalRechazo(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmarRechazo}
              disabled={loading}
            >
              {loading
                ? "Procesando..."
                : gratisSeleccionado
                  ? "Rechazar Participación"
                  : "Rechazar Transferencia"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
