import { type NextRequest, NextResponse } from "next/server"
import { uploadToSupabase } from "@/lib/supabase-storage"
import { crearCompradorTransferencia, obtenerSorteo } from "@/lib/database"
import { ventasBloqueadas } from "@/lib/fechas"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const nombre = formData.get("nombre") as string
    const email = ((formData.get("email") as string) || "").trim()
    const telefono = formData.get("telefono") as string
    const sorteoId = formData.get("sorteoId") as string
    const cantidadChances = Number.parseInt(formData.get("cantidadChances") as string)
    const comprobanteFile = formData.get("comprobante") as File

    // Validar datos requeridos
    if (!nombre || !sorteoId || !cantidadChances || !comprobanteFile) {
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

    // Validar que el WhatsApp sea un número válido (obligatorio)
    if (!telefono || telefono.replace(/\D/g, "").length < 8) {
      return NextResponse.json(
        { error: "Debe proporcionar un número de WhatsApp válido" },
        { status: 400 }
      )
    }

    // Se valida antes de subir el comprobante para no dejar archivos huérfanos
    const sorteo = await obtenerSorteo(sorteoId)
    if (!sorteo) {
      return NextResponse.json({ error: "Sorteo no encontrado" }, { status: 404 })
    }

    if (ventasBloqueadas(sorteo)) {
      return NextResponse.json(
        { error: "Las ventas de este sorteo ya cerraron" },
        { status: 409 }
      )
    }

    const filename = `${Date.now()}-${comprobanteFile.name}`
    const comprobanteUrl = await uploadToSupabase(comprobanteFile, "comprobantes", filename)

    // Crear registro pendiente de aprobación
    const nuevoComprador = await crearCompradorTransferencia({
      sorteoId,
      nombre,
      email,
      telefono,
      cantidadChances: cantidadChances,
      comprobanteUrl,
    })

    if (!nuevoComprador) {
      return NextResponse.json({ error: "Error creando comprador" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      compradorId: nuevoComprador.id,
      message: "Comprobante enviado correctamente. Recibirás una confirmación cuando revisemos tu pago.",
    })
  } catch (error) {
    console.error("Error procesando transferencia:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
