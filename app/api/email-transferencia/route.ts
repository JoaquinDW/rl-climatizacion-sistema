import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import {
  enviarEmailTransferenciaAprobada,
  enviarEmailParticipacionGratuitaAprobada,
  enviarEmailTransferenciaRechazada,
  ParticipacionGratuitaAprobadaData,
  TransferenciaAprobadaData,
  TransferenciaRechazadaData,
} from "@/lib/email"
import { ADMIN_SESSION_COOKIE, esSesionAdminValida } from "@/lib/admin-auth"

const destinatarioSchema = z.object({
  nombre: z.string().trim().min(1).max(160),
  email: z.string().trim().email(),
  cantidadChances: z.number().int().positive(),
  numerosAsignados: z.array(z.number().int().nonnegative()).min(1),
  nombreSorteo: z.string().trim().min(1).max(200),
  sorteoImagenUrl: z.string().url().optional(),
})

const requestSchema = z.discriminatedUnion("tipo", [
  z.object({
    tipo: z.literal("aprobada"),
    data: destinatarioSchema.extend({ precioPagado: z.number().nonnegative() }),
  }),
  z.object({
    tipo: z.literal("participacion-gratuita"),
    data: destinatarioSchema,
  }),
  z.object({
    tipo: z.literal("rechazada"),
    data: z.object({
      nombre: z.string().trim().min(1).max(160),
      email: z.string().trim().email(),
      cantidadChances: z.number().int().positive(),
      precioPagado: z.number().nonnegative(),
      nombreSorteo: z.string().trim().min(1).max(200),
      motivo: z.string().trim().max(1000).optional(),
      gratis: z.boolean().optional(),
    }),
  }),
])

export async function POST(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
  if (!esSesionAdminValida(token)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const parsed = requestSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Los datos del email son inválidos o no incluyen números." },
        { status: 400 },
      )
    }

    const { tipo, data } = parsed.data
    if (
      tipo !== "rechazada" &&
      data.numerosAsignados.length !== data.cantidadChances
    ) {
      return NextResponse.json(
        { error: "La cantidad de números no coincide con las chances asignadas." },
        { status: 400 },
      )
    }

    let resultado

    if (tipo === "aprobada") {
      const transferenciaData: TransferenciaAprobadaData = {
        nombre: data.nombre,
        email: data.email,
        cantidadChances: data.cantidadChances,
        numerosAsignados: data.numerosAsignados,
        precioPagado: data.precioPagado,
        nombreSorteo: data.nombreSorteo,
        sorteoImagenUrl: data.sorteoImagenUrl,
      }
      resultado = await enviarEmailTransferenciaAprobada(transferenciaData)
    } else if (tipo === "participacion-gratuita") {
      const participacionData: ParticipacionGratuitaAprobadaData = {
        nombre: data.nombre,
        email: data.email,
        cantidadChances: data.cantidadChances,
        numerosAsignados: data.numerosAsignados,
        nombreSorteo: data.nombreSorteo,
        sorteoImagenUrl: data.sorteoImagenUrl,
      }
      resultado = await enviarEmailParticipacionGratuitaAprobada(
        participacionData,
      )
    } else if (tipo === "rechazada") {
      const transferenciaData: TransferenciaRechazadaData = {
        nombre: data.nombre,
        email: data.email,
        cantidadChances: data.cantidadChances,
        precioPagado: data.precioPagado,
        nombreSorteo: data.nombreSorteo,
        motivo: data.motivo,
        gratis: !!data.gratis,
      }
      resultado = await enviarEmailTransferenciaRechazada(transferenciaData)
    } else {
      return NextResponse.json(
        { error: "Tipo de email no válido" },
        { status: 400 }
      )
    }

    if (!resultado.success) {
      return NextResponse.json(
        { error: "Error enviando email", details: resultado.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      mensaje: `Email ${tipo} enviado correctamente`,
      data: resultado.data,
    })
  } catch (error) {
    console.error("Error en API de email transferencia:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    )
  }
}
