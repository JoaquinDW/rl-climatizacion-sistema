import type { Sorteo } from "./supabase"

/**
 * Helpers de fecha/hora para el cierre programado de ventas.
 *
 * Todo se maneja en hora argentina. Argentina no usa horario de verano desde
 * 2009, así que un offset fijo de -03:00 es correcto y evita depender de una
 * librería de timezones.
 *
 * Este módulo es puro (sin React ni Supabase) para poder usarlo tanto en las
 * rutas de API como en los componentes cliente.
 */

export const OFFSET_AR = "-03:00"
export const ZONA_AR = "America/Argentina/Buenos_Aires"

/**
 * Convierte el valor de un <input type="datetime-local"> ("2026-08-11T20:00"),
 * que el admin carga en hora argentina, al ISO en UTC que guarda Postgres.
 */
export function inputLocalAISO(valor: string): string | null {
  if (!valor) return null

  // El input puede venir con o sin segundos según el navegador
  const conSegundos = valor.length === 16 ? `${valor}:00` : valor
  const fecha = new Date(`${conSegundos}${OFFSET_AR}`)

  if (Number.isNaN(fecha.getTime())) return null

  return fecha.toISOString()
}

/**
 * Inversa de `inputLocalAISO`: pasa un ISO guardado en la base al formato que
 * espera el <input type="datetime-local"> ("2026-08-11T20:00", hora argentina).
 */
export function isoAInputLocal(iso: string | null): string {
  if (!iso) return ""

  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return ""

  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: ZONA_AR,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(fecha)

  const valor = (tipo: string) =>
    partes.find((p) => p.type === tipo)?.value ?? ""

  const hora = valor("hour") === "24" ? "00" : valor("hour")

  return `${valor("year")}-${valor("month")}-${valor("day")}T${hora}:${valor("minute")}`
}

/** Parte de fecha ("2026-08-11", hora argentina) de un ISO. Para `fecha_sorteo` (DATE). */
export function isoAFechaAR(iso: string | null): string | null {
  const local = isoAInputLocal(iso)
  return local ? local.slice(0, 10) : null
}

/** "martes 11/08 a las 20:00 hs" */
export function formatearFechaHoraAR(iso: string | null): string {
  if (!iso) return ""

  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return ""

  const diaSemana = new Intl.DateTimeFormat("es-AR", {
    timeZone: ZONA_AR,
    weekday: "long",
  }).format(fecha)

  // Se arma a mano porque `es-AR` formatea día/mes con guiones ("11-08")
  const local = isoAInputLocal(iso) // "2026-08-11T20:00"
  const [, mes, dia] = local.slice(0, 10).split("-")
  const hora = local.slice(11)

  return `${diaSemana} ${dia}/${mes} a las ${hora} hs`
}

/** true si el sorteo tiene un cierre de ventas programado que todavía no llegó. */
export function tieneCierreProgramado(
  sorteo: Pick<Sorteo, "fecha_cierre_ventas"> | null | undefined,
  ahora: Date = new Date()
): boolean {
  if (!sorteo?.fecha_cierre_ventas) return false

  const cierre = new Date(sorteo.fecha_cierre_ventas).getTime()
  return !Number.isNaN(cierre) && cierre > ahora.getTime()
}

/** true si hay una fecha de cierre cargada y ya pasó. */
export function ventasCerradasPorFecha(
  sorteo: Pick<Sorteo, "fecha_cierre_ventas"> | null | undefined,
  ahora: Date = new Date()
): boolean {
  if (!sorteo?.fecha_cierre_ventas) return false

  const cierre = new Date(sorteo.fecha_cierre_ventas).getTime()
  return !Number.isNaN(cierre) && cierre <= ahora.getTime()
}

/** Estados en los que el sorteo ya no acepta compras. */
const ESTADOS_CERRADOS = ["completo", "sorteado", "cerrado"]

/**
 * Regla única de "¿se puede comprar?", compartida por la landing, el backoffice
 * y las rutas de API. Si no se pasa `chancesVendidas` sólo se evalúan el estado
 * y la fecha de cierre.
 */
export function ventasBloqueadas(
  sorteo: Sorteo | null | undefined,
  chancesVendidas?: number,
  ahora: Date = new Date()
): boolean {
  if (!sorteo) return false

  if (ESTADOS_CERRADOS.includes(sorteo.estado)) return true

  if (ventasCerradasPorFecha(sorteo, ahora)) return true

  if (
    typeof chancesVendidas === "number" &&
    sorteo.total_chances > 0 &&
    chancesVendidas >= sorteo.total_chances
  ) {
    return true
  }

  return false
}
