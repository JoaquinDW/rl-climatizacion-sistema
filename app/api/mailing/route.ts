import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { ADMIN_SESSION_COOKIE, esSesionAdminValida } from "@/lib/admin-auth"
import {
  enviarCampanaMailing,
  enviarMailingPrueba,
  type MailingContenido,
  type MailingDestinatario,
} from "@/lib/email"
import { supabase } from "@/lib/supabase"

export const runtime = "nodejs"
export const maxDuration = 60

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_DESTINATARIOS = 2000

const audienciaSchema = z.enum(["confirmados", "pendientes", "todos"])
const contenidoSchema = z.object({
  asunto: z.string().trim().min(3).max(140),
  titulo: z.string().trim().min(3).max(90),
  mensaje: z.string().trim().min(10).max(5000),
  textoBoton: z.string().trim().max(40).optional().default(""),
  urlBoton: z.union([z.string().trim().url(), z.literal("")]).optional().default(""),
  nombreSorteo: z.string().trim().max(160).optional(),
})

const requestSchema = z.discriminatedUnion("accion", [
  z.object({
    accion: z.literal("audiencia"),
    sorteoId: z.string().uuid(),
    audiencia: audienciaSchema,
  }),
  z.object({
    accion: z.literal("prueba"),
    emailPrueba: z.string().trim().email(),
    contenido: contenidoSchema,
  }),
  z.object({
    accion: z.literal("enviar"),
    sorteoId: z.string().uuid(),
    audiencia: audienciaSchema,
    confirmacion: z.literal("ENVIAR"),
    campaignId: z.string().uuid(),
    contenido: contenidoSchema,
  }),
])

type Audiencia = z.infer<typeof audienciaSchema>

async function obtenerDestinatarios(
  sorteoId: string,
  audiencia: Audiencia,
): Promise<MailingDestinatario[]> {
  const pageSize = 1000
  const destinatarios = new Map<string, MailingDestinatario>()

  for (let desde = 0; ; desde += pageSize) {
    let query = supabase
      .from("compradores")
      .select("nombre,email")
      .eq("sorteo_id", sorteoId)
      .not("email", "is", null)
      .range(desde, desde + pageSize - 1)

    if (audiencia === "confirmados") query = query.eq("estado_pago", "pagado")
    if (audiencia === "pendientes") query = query.eq("estado_pago", "pendiente")

    const { data, error } = await query
    if (error) throw new Error(`No se pudo consultar la audiencia: ${error.message}`)

    for (const registro of data ?? []) {
      const email = registro.email?.trim().toLowerCase()
      if (!email || !emailRegex.test(email)) continue
      if (!destinatarios.has(email)) {
        destinatarios.set(email, {
          email,
          nombre: registro.nombre?.trim() || "Participante",
        })
      }
    }

    if (!data || data.length < pageSize) break
    if (destinatarios.size > MAX_DESTINATARIOS) break
  }

  return Array.from(destinatarios.values())
}

export async function POST(request: NextRequest) {
  // Feature preparada para una futura contratación, deshabilitada por defecto.
  if (process.env.ENABLE_MAILING_CAMPAIGNS !== "true") {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  }

  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
  if (!esSesionAdminValida(token)) {
    return NextResponse.json(
      { error: "Tu sesión de administrador venció. Volvé a ingresar." },
      { status: 401 },
    )
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "RESEND_API_KEY no está configurada en el servidor." },
      { status: 503 },
    )
  }

  try {
    const parsed = requestSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Revisá los datos del mailing antes de continuar." },
        { status: 400 },
      )
    }

    if (parsed.data.accion === "prueba") {
      const resultado = await enviarMailingPrueba(
        { nombre: "Equipo Faustino", email: parsed.data.emailPrueba },
        parsed.data.contenido as MailingContenido,
      )

      if (!resultado.success) {
        console.error("Error enviando prueba de mailing:", resultado.error)
        return NextResponse.json(
          { error: "Resend no pudo enviar el email de prueba." },
          { status: 502 },
        )
      }

      return NextResponse.json({ ok: true, enviados: 1 })
    }

    const destinatarios = await obtenerDestinatarios(
      parsed.data.sorteoId,
      parsed.data.audiencia,
    )

    if (parsed.data.accion === "audiencia") {
      return NextResponse.json({ ok: true, destinatarios: destinatarios.length })
    }

    if (destinatarios.length === 0) {
      return NextResponse.json(
        { error: "La audiencia seleccionada no tiene emails válidos." },
        { status: 400 },
      )
    }

    if (destinatarios.length > MAX_DESTINATARIOS) {
      return NextResponse.json(
        {
          error: `La campaña supera el límite de seguridad de ${MAX_DESTINATARIOS} destinatarios.`,
        },
        { status: 400 },
      )
    }

    const resultado = await enviarCampanaMailing(
      destinatarios,
      parsed.data.contenido as MailingContenido,
      parsed.data.campaignId,
    )

    if (!resultado.success) {
      console.error("Error enviando campaña de mailing:", resultado.error)
      return NextResponse.json(
        {
          error: "Resend interrumpió el envío de la campaña.",
          enviados: resultado.enviados,
        },
        { status: 502 },
      )
    }

    return NextResponse.json({ ok: true, enviados: resultado.enviados })
  } catch (error) {
    console.error("Error en POST /api/mailing:", error)
    return NextResponse.json(
      { error: "No se pudo procesar el mailing." },
      { status: 500 },
    )
  }
}
