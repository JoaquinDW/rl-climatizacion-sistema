"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  FlaskConical,
  Gauge,
  Loader2,
  Mail,
  Send,
  ShieldCheck,
  Users,
} from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { MARCA, SITIO_URL } from "@/lib/marca"
import type { Sorteo } from "@/lib/supabase"

type Audiencia = "confirmados" | "pendientes" | "todos"

interface MailingManagerProps {
  sorteo: Sorteo | null
}

interface ContenidoMailing {
  asunto: string
  titulo: string
  mensaje: string
  textoBoton: string
  urlBoton: string
  nombreSorteo?: string
}

const AUDIENCIAS: Array<{
  value: Audiencia
  label: string
  description: string
}> = [
  {
    value: "confirmados",
    label: "Participantes confirmados",
    description: "Sólo pagos y participaciones aprobadas",
  },
  {
    value: "pendientes",
    label: "Solicitudes pendientes",
    description: "Personas que todavía esperan revisión",
  },
  {
    value: "todos",
    label: "Todos con email",
    description: "Incluye confirmados y pendientes, sin duplicados",
  },
]

async function leerRespuesta(response: Response) {
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || "No se pudo completar la operación")
  return data
}

export function MailingManager({ sorteo }: MailingManagerProps) {
  const { toast } = useToast()
  const [audiencia, setAudiencia] = useState<Audiencia>("confirmados")
  const [destinatarios, setDestinatarios] = useState(0)
  const [cargandoAudiencia, setCargandoAudiencia] = useState(false)
  const [emailPrueba, setEmailPrueba] = useState("")
  const [enviandoPrueba, setEnviandoPrueba] = useState(false)
  const [enviandoCampana, setEnviandoCampana] = useState(false)
  const [confirmacionAbierta, setConfirmacionAbierta] = useState(false)
  const [confirmacion, setConfirmacion] = useState("")
  const [campaignId, setCampaignId] = useState("")

  const nombreSorteo = sorteo?.nombre || "Sorteo Faustino Motors"
  const [contenido, setContenido] = useState<ContenidoMailing>(() => ({
    asunto: `Novedades del sorteo — ${nombreSorteo}`,
    titulo: "Todo listo para acelerar",
    mensaje:
      "Tenemos novedades importantes sobre el sorteo. Tu participación sigue en carrera y queríamos contártelo antes que a nadie.\n\nSeguí atento a nuestras redes para no perderte las próximas actualizaciones.",
    textoBoton: "Ver el sorteo",
    urlBoton: SITIO_URL,
    nombreSorteo,
  }))

  useEffect(() => {
    if (!sorteo) {
      setDestinatarios(0)
      return
    }

    const controller = new AbortController()
    setCargandoAudiencia(true)

    fetch("/api/mailing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accion: "audiencia",
        sorteoId: sorteo.id,
        audiencia,
      }),
      signal: controller.signal,
    })
      .then(leerRespuesta)
      .then((data) => setDestinatarios(data.destinatarios ?? 0))
      .catch((error) => {
        if (error.name !== "AbortError") {
          setDestinatarios(0)
          toast({
            variant: "destructive",
            title: "No pudimos calcular la audiencia",
            description: error.message,
          })
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setCargandoAudiencia(false)
      })

    return () => controller.abort()
  }, [audiencia, sorteo, toast])

  const contenidoValido = useMemo(
    () =>
      contenido.asunto.trim().length >= 3 &&
      contenido.titulo.trim().length >= 3 &&
      contenido.mensaje.trim().length >= 10 &&
      ((!contenido.textoBoton && !contenido.urlBoton) ||
        (contenido.textoBoton.trim().length > 0 &&
          /^https?:\/\//i.test(contenido.urlBoton))),
    [contenido],
  )

  const actualizarContenido = (campo: keyof ContenidoMailing, valor: string) => {
    setContenido((actual) => ({ ...actual, [campo]: valor }))
  }

  const enviarPrueba = async () => {
    if (!contenidoValido || !emailPrueba.trim()) return
    setEnviandoPrueba(true)

    try {
      await leerRespuesta(
        await fetch("/api/mailing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accion: "prueba",
            emailPrueba: emailPrueba.trim(),
            contenido,
          }),
        }),
      )
      toast({
        title: "Prueba enviada",
        description: `Revisá la bandeja de ${emailPrueba.trim()}.`,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "No se pudo enviar la prueba",
        description: error instanceof Error ? error.message : "Intentá nuevamente.",
      })
    } finally {
      setEnviandoPrueba(false)
    }
  }

  const enviarCampana = async () => {
    if (!sorteo || confirmacion !== "ENVIAR") return
    setEnviandoCampana(true)

    try {
      const resultado = await leerRespuesta(
        await fetch("/api/mailing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accion: "enviar",
            sorteoId: sorteo.id,
            audiencia,
            confirmacion,
            campaignId,
            contenido,
          }),
        }),
      )

      setConfirmacionAbierta(false)
      setConfirmacion("")
      toast({
        title: "Campaña enviada",
        description: `${resultado.enviados} emails fueron aceptados por Resend.`,
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "El envío se interrumpió",
        description: error instanceof Error ? error.message : "Intentá nuevamente.",
      })
    } finally {
      setEnviandoCampana(false)
    }
  }

  if (!sorteo) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-6 py-14 text-center">
        <Mail className="mx-auto mb-4 h-10 w-10 text-gray-300" />
        <h2 className="text-lg font-semibold text-gray-900">No hay un sorteo activo</h2>
        <p className="mt-2 text-sm text-gray-500">
          Creá o activá un sorteo para preparar una campaña.
        </p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#2a2e36] bg-[#0b0d10] text-[#f4f4f2] shadow-2xl shadow-black/20">
      <div className="relative overflow-hidden border-b border-white/10 px-5 py-7 sm:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_92%_12%,rgba(207,24,52,0.25),transparent_34%),linear-gradient(120deg,rgba(255,255,255,0.03),transparent_45%)]" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-lg border border-white/15 bg-black/40">
              <img src="/logo-faustino.png" alt={MARCA} className="h-11 w-11 rounded object-contain" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#ef4962]">
                Race communications
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                Mailing <span className="text-[#c0c0c0]">Faustino</span>
              </h2>
              <p className="mt-1 text-sm text-[#9a9da3]">{nombreSorteo}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-black/30 px-4 py-3">
            <Gauge className="h-5 w-5 text-[#ef4962]" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#686c73]">
                Audiencia lista
              </p>
              <p className="text-lg font-black tabular-nums text-white">
                {cargandoAudiencia ? "—" : destinatarios} contactos
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
        <div className="space-y-8 border-b border-white/10 p-5 sm:p-8 lg:border-b-0 lg:border-r">
          <section>
            <div className="mb-4 flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-[#cf1834] text-xs font-black">1</span>
              <h3 className="text-sm font-extrabold uppercase tracking-[0.14em]">Elegí la audiencia</h3>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {AUDIENCIAS.map((opcion) => (
                <button
                  key={opcion.value}
                  type="button"
                  onClick={() => setAudiencia(opcion.value)}
                  className={`rounded-lg border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ef4962] ${
                    audiencia === opcion.value
                      ? "border-[#cf1834] bg-[#cf1834]/12 shadow-[inset_0_0_0_1px_rgba(207,24,52,0.25)]"
                      : "border-white/10 bg-white/[0.025] hover:border-white/25 hover:bg-white/[0.05]"
                  }`}
                >
                  <span className="block text-sm font-bold text-white">{opcion.label}</span>
                  <span className="mt-1 block text-xs leading-5 text-[#9a9da3]">{opcion.description}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-[#cf1834] text-xs font-black">2</span>
              <h3 className="text-sm font-extrabold uppercase tracking-[0.14em]">Armá el mensaje</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="mailing-asunto" className="text-[#c0c0c0]">Asunto</Label>
              <Input
                id="mailing-asunto"
                value={contenido.asunto}
                maxLength={140}
                onChange={(event) => actualizarContenido("asunto", event.target.value)}
                className="border-white/15 bg-white/[0.04] text-white placeholder:text-[#686c73] focus-visible:ring-[#cf1834]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="mailing-titulo" className="text-[#c0c0c0]">Título principal</Label>
              <Input
                id="mailing-titulo"
                value={contenido.titulo}
                maxLength={90}
                onChange={(event) => actualizarContenido("titulo", event.target.value)}
                className="border-white/15 bg-white/[0.04] text-white placeholder:text-[#686c73] focus-visible:ring-[#cf1834]"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="mailing-mensaje" className="text-[#c0c0c0]">Mensaje</Label>
                <span className="text-xs tabular-nums text-[#686c73]">{contenido.mensaje.length}/5000</span>
              </div>
              <Textarea
                id="mailing-mensaje"
                value={contenido.mensaje}
                maxLength={5000}
                rows={8}
                onChange={(event) => actualizarContenido("mensaje", event.target.value)}
                className="resize-y border-white/15 bg-white/[0.04] leading-6 text-white placeholder:text-[#686c73] focus-visible:ring-[#cf1834]"
              />
              <p className="text-xs text-[#686c73]">Separá párrafos dejando una línea en blanco.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="mailing-boton" className="text-[#c0c0c0]">Texto del botón <span className="text-[#686c73]">(opcional)</span></Label>
                <Input
                  id="mailing-boton"
                  value={contenido.textoBoton}
                  maxLength={40}
                  onChange={(event) => actualizarContenido("textoBoton", event.target.value)}
                  className="border-white/15 bg-white/[0.04] text-white focus-visible:ring-[#cf1834]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mailing-url" className="text-[#c0c0c0]">URL del botón</Label>
                <Input
                  id="mailing-url"
                  type="url"
                  value={contenido.urlBoton}
                  onChange={(event) => actualizarContenido("urlBoton", event.target.value)}
                  className="border-white/15 bg-white/[0.04] text-white focus-visible:ring-[#cf1834]"
                />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.025] p-4">
            <div className="mb-3 flex items-center gap-2">
              <FlaskConical className="h-4 w-4 text-[#ef4962]" />
              <h3 className="text-sm font-bold">Envío de prueba</h3>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                type="email"
                value={emailPrueba}
                onChange={(event) => setEmailPrueba(event.target.value)}
                placeholder="tu@email.com"
                className="border-white/15 bg-black/20 text-white placeholder:text-[#686c73] focus-visible:ring-[#cf1834]"
              />
              <Button
                type="button"
                variant="outline"
                onClick={enviarPrueba}
                disabled={!contenidoValido || !emailPrueba.trim() || enviandoPrueba}
                className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
              >
                {enviandoPrueba ? <Loader2 className="animate-spin" /> : <FlaskConical />}
                Enviar prueba
              </Button>
            </div>
          </section>

          <div className="flex flex-col gap-3 rounded-xl border border-[#cf1834]/30 bg-[#cf1834]/[0.07] p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#ef4962]" />
              <div>
                <p className="text-sm font-bold">Doble confirmación activada</p>
                <p className="mt-1 text-xs leading-5 text-[#9a9da3]">El envío final te pedirá escribir ENVIAR y nunca expone los destinatarios entre sí.</p>
              </div>
            </div>
            <Button
              type="button"
              onClick={() => {
                setCampaignId(crypto.randomUUID())
                setConfirmacionAbierta(true)
              }}
              disabled={!contenidoValido || destinatarios === 0 || cargandoAudiencia}
              className="shrink-0 bg-[#cf1834] font-bold text-white hover:bg-[#a90f28]"
            >
              <Send />
              Revisar envío
            </Button>
          </div>
        </div>

        <aside className="bg-[#111318] p-5 sm:p-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#686c73]">Live preview</p>
              <h3 className="mt-1 text-sm font-bold">Vista aproximada</h3>
            </div>
            <Mail className="h-5 w-5 text-[#ef4962]" />
          </div>

          <div className="overflow-hidden rounded-lg border border-[#cf1834]/30 bg-[#08090b] shadow-2xl shadow-black/40">
            <div className="h-1 bg-[#cf1834]" />
            <div className="px-5 py-7 text-center">
              <img src="/logo-faustino.png" alt="" className="mx-auto h-16 w-16 rounded-md border border-white/15 bg-black object-contain p-1.5" />
              <p className="mt-4 text-[9px] font-extrabold uppercase tracking-[0.28em] text-[#ef4962]">{MARCA}</p>
              <h4 className="mt-2 break-words text-xl font-black leading-tight text-white">{contenido.titulo || "Título del email"}</h4>
              <p className="mt-2 text-xs text-[#9a9da3]">Novedades desde el paddock de Faustino Motors</p>
              <div className="mx-auto mt-5 h-px w-full bg-gradient-to-r from-transparent via-[#cf1834] to-transparent" />
            </div>
            <div className="px-5 pb-7 text-sm leading-6 text-[#d8d8d5]">
              <p className="mb-4">Hola <strong className="text-white">Participante</strong>,</p>
              <p className="mb-4 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#ef4962]">{nombreSorteo}</p>
              {contenido.mensaje.split(/\n{2,}/).map((parrafo, index) => (
                <p key={`${index}-${parrafo.slice(0, 10)}`} className="mb-4 whitespace-pre-line break-words">{parrafo || "Tu mensaje aparecerá acá."}</p>
              ))}
              {contenido.textoBoton && contenido.urlBoton ? (
                <div className="pt-2 text-center">
                  <span className="inline-block rounded-md bg-[#cf1834] px-5 py-3 text-[11px] font-black uppercase tracking-wide text-white">{contenido.textoBoton}</span>
                </div>
              ) : null}
            </div>
            <div className="border-t border-white/10 px-5 py-4 text-center text-[9px] leading-4 text-[#686c73]">Email automático de {MARCA}</div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
              <Users className="mb-2 h-4 w-4 text-[#ef4962]" />
              <p className="text-xl font-black tabular-nums">{destinatarios}</p>
              <p className="text-[10px] uppercase tracking-wider text-[#686c73]">Destinatarios únicos</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/20 p-3">
              <CheckCircle2 className="mb-2 h-4 w-4 text-emerald-400" />
              <p className="text-xl font-black">1 a 1</p>
              <p className="text-[10px] uppercase tracking-wider text-[#686c73]">Privacidad de envío</p>
            </div>
          </div>
        </aside>
      </div>

      <Dialog open={confirmacionAbierta} onOpenChange={setConfirmacionAbierta}>
        <DialogContent className="border-[#2a2e36] bg-[#111318] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <AlertTriangle className="h-5 w-5 text-[#ef4962]" />
              Confirmar campaña
            </DialogTitle>
            <DialogDescription className="leading-6 text-[#9a9da3]">
              Se enviará “{contenido.asunto}” a <strong className="text-white">{destinatarios} destinatarios</strong>. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="confirmar-mailing" className="text-[#c0c0c0]">Escribí ENVIAR para continuar</Label>
            <Input
              id="confirmar-mailing"
              value={confirmacion}
              onChange={(event) => setConfirmacion(event.target.value.toUpperCase())}
              autoComplete="off"
              className="border-white/15 bg-black/30 font-mono text-white focus-visible:ring-[#cf1834]"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setConfirmacionAbierta(false)} className="border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white">Cancelar</Button>
            <Button type="button" onClick={enviarCampana} disabled={confirmacion !== "ENVIAR" || enviandoCampana} className="bg-[#cf1834] font-bold text-white hover:bg-[#a90f28]">
              {enviandoCampana ? <Loader2 className="animate-spin" /> : <Send />}
              {enviandoCampana ? "Enviando…" : "Enviar campaña"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
