import { type NextRequest, NextResponse } from "next/server"
import { crearNuevoSorteo } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      nombre,
      totalChances,
      precio6,
      precio12,
      precio24,
      fechaSorteo,
      cantidadPack1,
      cantidadPack2,
      cantidadPack3,
      descripcionPack1,
      descripcionPack2,
      descripcionPack3,
      cantidadPack4,
      precio4,
      descripcionPack4,
      pack4Visible,
      cantidadPack5,
      precio5,
      descripcionPack5,
      pack5Visible,
      esGratis,
      pack1Visible,
      pack2Visible,
      pack3Visible,
    } = body

    if (!nombre || !totalChances) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    // En un sorteo gratis los precios van en 0, así que sólo se exigen
    // cuando el sorteo efectivamente cobra.
    if (!esGratis && (!precio6 || !precio12 || !precio24)) {
      return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
    }

    const nuevoSorteo = await crearNuevoSorteo(
      nombre,
      totalChances,
      precio6 || 0,
      precio12 || 0,
      precio24 || 0,
      fechaSorteo,
      cantidadPack1,
      cantidadPack2,
      cantidadPack3,
      descripcionPack1,
      descripcionPack2,
      descripcionPack3,
      undefined,
      undefined,
      cantidadPack4,
      precio4,
      descripcionPack4,
      pack4Visible,
      cantidadPack5,
      precio5,
      descripcionPack5,
      pack5Visible,
      !!esGratis,
      // Los packs 1-3 son visibles salvo que se destilden explícitamente
      pack1Visible !== false,
      pack2Visible !== false,
      pack3Visible !== false,
    )

    if (!nuevoSorteo) {
      return NextResponse.json({ error: "Error creando sorteo" }, { status: 500 })
    }

    return NextResponse.json({ sorteo: nuevoSorteo })
  } catch (error) {
    console.error("Error en API crear-sorteo:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
