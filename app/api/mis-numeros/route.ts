import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Escapa los comodines de LIKE para que `_` (común en emails) no amplíe la búsqueda
const escaparLike = (valor: string) => valor.replace(/[\\%_]/g, "\\$&")

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  // Comparamos emails sin importar mayúsculas ni espacios
  const email = (searchParams.get("email") ?? "").trim().toLowerCase()

  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json(
      { error: "Ingresá un email válido" },
      { status: 400 },
    )
  }

  const { data, error } = await supabase
    .from("compradores")
    .select(
      `id, nombre, numeros_asignados, cantidad_chances, created_at, email, sorteos!compradores_sorteo_id_fkey(nombre, estado)`,
    )
    .eq("estado_pago", "pagado")
    .ilike("email", escaparLike(email))
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error buscando por email:", error)
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    )
  }

  const participaciones = (data || [])
    .filter((row: any) => row.sorteos?.estado === "activo")
    .map((row: any) => ({
      id: row.id,
      nombre: row.nombre,
      numeros_asignados: row.numeros_asignados || [],
      cantidad_chances: row.cantidad_chances,
      sorteo_nombre: row.sorteos?.nombre ?? "Sorteo",
      created_at: row.created_at,
    }))

  return NextResponse.json({ participaciones })
}
