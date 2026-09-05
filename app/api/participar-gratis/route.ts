import { type NextRequest, NextResponse } from "next/server"
import {
  ParticipacionDuplicadaError,
  crearParticipacionGratis,
  obtenerSorteo,
  yaParticipoGratis,
} from "@/lib/database"
import { ventasBloqueadas } from "@/lib/fechas"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const nombre = ((body.nombre as string) || "").trim()
    const email = ((body.email as string) || "").trim()
    const telefono = ((body.telefono as string) || "").trim()
    // El @ se limpia acá y en la base: el admin necesita el usuario pelado
    // para armar el link a instagram.com y verificar el follow.
    const instagram = ((body.instagram_username as string) || "")
      .trim()
      .replace(/^@+/, "")
    const sorteoId = body.sorteoId as string
    const cantidadChances = Number.parseInt(String(body.cantidadChances), 10)

    if (!nombre || !sorteoId || !cantidadChances) {
      return NextResponse.json({ error: "Faltan datos requeridos" }, { status: 400 })
    }

    // El email es obligatorio: es el único canal por el que se notifican
    // la aprobación y los números asignados.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Debe proporcionar un email válido" },
        { status: 400 }
      )
    }

    if (!telefono || telefono.replace(/\D/g, "").length < 8) {
      return NextResponse.json(
        { error: "Debe proporcionar un número de WhatsApp válido" },
        { status: 400 }
      )
    }

    // Obligatorio: sin el usuario de Instagram no hay forma de verificar
    // que la persona cumpla el requisito de seguirnos.
    if (instagram.length < 2) {
      return NextResponse.json(
        { error: "Debe proporcionar su usuario de Instagram" },
        { status: 400 }
      )
    }

    const sorteo = await obtenerSorteo(sorteoId)
    if (!sorteo) {
      return NextResponse.json({ error: "Sorteo no encontrado" }, { status: 404 })
    }

    if (!sorteo.es_gratis) {
      return NextResponse.json(
        { error: "Este sorteo no es gratuito" },
        { status: 409 }
      )
    }

    if (ventasBloqueadas(sorteo)) {
      return NextResponse.json(
        { error: "Las inscripciones de este sorteo ya cerraron" },
        { status: 409 }
      )
    }

    if (await yaParticipoGratis(sorteoId, email)) {
      return NextResponse.json(
        { error: "Ya estás participando con este email" },
        { status: 409 }
      )
    }

    const participacion = await crearParticipacionGratis({
      sorteoId,
      nombre,
      email,
      telefono,
      instagram_username: instagram,
      cantidadChances,
    })

    if (!participacion) {
      return NextResponse.json(
        { error: "Error registrando la participación" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      compradorId: participacion.id,
      message:
        "¡Listo! Te enviamos tus números por email cuando confirmemos que cumplís los requisitos.",
    })
  } catch (error) {
    // Carrera entre dos requests con el mismo email: lo frena el índice único
    if (error instanceof ParticipacionDuplicadaError) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    console.error("Error procesando participación gratis:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
