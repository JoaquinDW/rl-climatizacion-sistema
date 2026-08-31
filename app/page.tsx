"use client"

import { useState, useEffect } from "react"
import {
  Sparkles,
  Clock,
  Trophy,
  ShoppingCart,
  ChevronDown,
  Ticket,
  Car,
  Lock,
} from "lucide-react"
import Link from "next/link"
import { CompraModalNuevo } from "@/components/compra-modal-nuevo"
import { Header } from "@/components/header"
import { GanadoresPasados } from "@/components/ganadores-pasados"
import { GanadoresExpress } from "@/components/ganadores-express"
import { PromoDiaria } from "@/components/promo-diaria"
import { MuralGanadores } from "@/components/mural-ganadores"
import { RedesSociales } from "@/components/redes-sociales"
import { Reveal } from "@/components/reveal"
import { WaveDivider } from "@/components/wave-divider"
import dynamic from "next/dynamic"

const IphoneCarousel = dynamic(() => import("@/components/iphone-carousel"), {
  ssr: false,
})
import {
  obtenerSorteoActivo,
  obtenerEstadisticasSorteo,
  generarNumerosUnicos,
  obtenerPremiosSecundarios,
  obtenerPromoDiaria,
} from "@/lib/database"
import { generarComprobante } from "@/lib/comprobante"
import type { Sorteo } from "@/lib/supabase"
import type {
  PremiosSecundarios,
  PromoDiaria as PromoDiariaType,
} from "@/lib/database"
import {
  obtenerContenido,
  conPlaceholders,
  CONTENIDO_DEFAULTS,
  type ContenidoSitio,
} from "@/lib/contenido"
import {
  formatearFechaHoraAR,
  tieneCierreProgramado,
  ventasBloqueadas as calcularVentasBloqueadas,
  ventasCerradasPorFecha,
} from "@/lib/fechas"
import { AnimatedProgress } from "@/components/animated-progress"
import { CountdownCierre } from "@/components/countdown-cierre"
import { useToast } from "@/hooks/use-toast"
import { Toaster } from "@/components/ui/toaster"

export default function LandingPage() {
  const [sorteo, setSorteo] = useState<Sorteo | null>(null)
  const [chancesVendidas, setChancesVendidas] = useState(0)
  const [totalCompradores, setTotalCompradores] = useState(0)
  const [totalRecaudado, setTotalRecaudado] = useState(0)
  const [modalAbierto, setModalAbierto] = useState(false)
  const [packSeleccionado, setPackSeleccionado] = useState<{
    chances: number
    precio: number
    sorteoId?: string
  } | null>(null)
  const [animacionVisible, setAnimacionVisible] = useState(false)
  const [loading, setLoading] = useState(true)
  const [consultaEmail, setConsultaEmail] = useState("")
  const [consultaLoading, setConsultaLoading] = useState(false)
  const [consultaResultados, setConsultaResultados] = useState<Array<{
    id: string
    nombre: string
    numeros_asignados: number[]
    cantidad_chances: number
    sorteo_nombre: string
    created_at: string
  }> | null>(null)
  const [consultaError, setConsultaError] = useState<string | null>(null)
  const [premiosSecundarios, setPremiosSecundarios] =
    useState<PremiosSecundarios | null>(null)
  const [promoDiaria, setPromoDiaria] = useState<PromoDiariaType | null>(null)
  const [contenido, setContenido] = useState<ContenidoSitio>(CONTENIDO_DEFAULTS)
  // Se calcula al cargar el sorteo y lo activa el contador al llegar a cero,
  // así la página se bloquea sin necesidad de refrescar.
  const [ventasCerradas, setVentasCerradas] = useState(false)
  const { toast } = useToast()

  const getPacks = () => {
    if (!sorteo) return []

    const allPacks = [
      {
        chances: sorteo.cantidad_pack_1 || 10,
        precio: sorteo.precio_6_chances || 21000,
        descripcion: sorteo.descripcion_pack_1 || "Honda Wave 2025",
        visible: sorteo.pack_1_visible ?? true,
      },
      {
        chances: sorteo.cantidad_pack_2 || 25,
        precio: sorteo.precio_12_chances || 42000,
        popular: true,
        descripcion:
          sorteo.descripcion_pack_2 ||
          "Honda Wave 2025 + 5 chances en pre-venta New Titan 2018",
        visible: sorteo.pack_2_visible ?? true,
      },
      {
        chances: sorteo.cantidad_pack_3 || 50,
        precio: sorteo.precio_24_chances || 84000,
        descripcion:
          sorteo.descripcion_pack_3 ||
          "Honda Wave 2025 + 5 chances pre-venta New Titan 2018",
        visible: sorteo.pack_3_visible ?? true,
      },
      {
        chances: sorteo.cantidad_pack_4 || 0,
        precio: sorteo.precio_pack_4 || 0,
        descripcion: sorteo.descripcion_pack_4 || "",
        visible: sorteo.pack_4_visible ?? false,
      },
      {
        chances: sorteo.cantidad_pack_5 || 0,
        precio: sorteo.precio_pack_5 || 0,
        descripcion: sorteo.descripcion_pack_5 || "",
        visible: sorteo.pack_5_visible ?? false,
      },
    ]

    return allPacks.filter((pack) => pack.visible)
  }

  useEffect(() => {
    cargarDatos()
    const timer = setTimeout(() => setAnimacionVisible(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const cargarDatos = async () => {
    try {
      const [sorteoActivo, premios, contenidoSitio, promo] = await Promise.all([
        obtenerSorteoActivo(),
        obtenerPremiosSecundarios(),
        obtenerContenido(),
        obtenerPromoDiaria(),
      ])
      setPremiosSecundarios(premios)
      setContenido(contenidoSitio)
      setPromoDiaria(promo)
      if (sorteoActivo) {
        setSorteo(sorteoActivo)
        setVentasCerradas(ventasCerradasPorFecha(sorteoActivo))
        const estadisticas = await obtenerEstadisticasSorteo(sorteoActivo.id)
        setChancesVendidas(estadisticas.chancesVendidas)
        setTotalCompradores(estadisticas.totalCompradores)
        setTotalRecaudado(estadisticas.totalRecaudado)
      } else {
        console.error("No se pudo cargar el sorteo")
      }
    } catch (error) {
      console.error("Error cargando datos:", error)
    } finally {
      setLoading(false)
    }
  }

  const procesarCompra = async (
    nombre: string,
    email: string,
    telefono: string,
  ) => {
    if (!packSeleccionado || !sorteo) return

    try {
      const numerosDisponibles = await generarNumerosUnicos(
        sorteo.id,
        packSeleccionado.chances,
      )

      if (numerosDisponibles.length < packSeleccionado.chances) {
        toast({
          variant: "destructive",
          title: "Error en la compra",
          description: "No hay suficientes números disponibles",
        })
        return
      }

      const datosCompra = {
        sorteoId: sorteo.id,
        nombre,
        email,
        telefono,
        chances: packSeleccionado.chances,
        precio: packSeleccionado.precio,
        timestamp: Date.now(),
      }

      localStorage.setItem(
        "sorteo_compra_pendiente",
        JSON.stringify(datosCompra),
      )

      toast({
        title: "Preparando pago...",
        description: "Te redirigiremos a MercadoPago en un momento",
      })

      const response = await fetch("/api/crear-preferencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datosCompra),
      })

      const datos = await response.json()

      if (!response.ok) {
        // Puede ser el 409 de "las ventas ya cerraron" si el usuario tenía la
        // pestaña abierta desde antes del cierre
        toast({
          variant: "destructive",
          title: "No se pudo completar la compra",
          description: datos.error || "Intentá nuevamente en unos minutos.",
        })
        setModalAbierto(false)
        setPackSeleccionado(null)
        return
      }

      const { preferenceId, paymentUrl } = datos

      const datosActualizados = { ...datosCompra, preferenceId }
      localStorage.setItem(
        "sorteo_compra_pendiente",
        JSON.stringify(datosActualizados),
      )

      window.location.href = paymentUrl
    } catch (error) {
      console.error("Error procesando compra:", error)
      toast({
        variant: "destructive",
        title: "Error en la compra",
        description: "Ocurrió un error inesperado. Intenta nuevamente.",
      })
    }

    setModalAbierto(false)
    setPackSeleccionado(null)
  }

  const procesarTransferencia = async (data: {
    nombre: string
    email: string
    telefono: string
    comprobanteFile: File
  }) => {
    if (!packSeleccionado || !sorteo) return

    try {
      const formData = new FormData()
      formData.append("sorteoId", sorteo.id)
      formData.append("nombre", data.nombre)
      formData.append("email", data.email)
      formData.append("telefono", data.telefono)
      formData.append("cantidadChances", packSeleccionado.chances.toString())
      formData.append("comprobante", data.comprobanteFile)

      toast({
        title: "Procesando...",
        description: "Estamos registrando tu transferencia",
      })

      const response = await fetch("/api/transferencia", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const datos = await response.json().catch(() => ({}))
        toast({
          variant: "destructive",
          title: "No se pudo registrar la transferencia",
          description: datos.error || "Intentá nuevamente en unos minutos.",
        })
        setModalAbierto(false)
        setPackSeleccionado(null)
        return
      }

      toast({
        title: "¡Transferencia registrada!",
        description:
          "Tu pago está pendiente de confirmación. Te enviamos un email con tus números cuando lo aprobemos.",
        duration: 5000,
      })

      await cargarDatos()
    } catch (error) {
      console.error("Error procesando transferencia:", error)
      toast({
        variant: "destructive",
        title: "Error",
        description:
          "Ocurrió un error procesando tu transferencia. Intenta nuevamente.",
      })
    }

    setModalAbierto(false)
    setPackSeleccionado(null)
  }

  const TOTAL_CHANCES = sorteo?.total_chances || 9999
  const porcentajeVendido = (chancesVendidas / TOTAL_CHANCES) * 100
  // Se agotaron las chances o el sorteo ya terminó (define qué card se muestra)
  const sorteoCompleto =
    sorteo?.estado === "completo" ||
    sorteo?.estado === "sorteado" ||
    chancesVendidas >= TOTAL_CHANCES
  // Regla única de "¿se puede comprar?", compartida con las rutas de API
  const ventasBloqueadas =
    calcularVentasBloqueadas(sorteo, chancesVendidas) || ventasCerradas
  // El contador sólo aparece si hay un cierre cargado que todavía no llegó
  const mostrarContador =
    !ventasBloqueadas && tieneCierreProgramado(sorteo) && !!sorteo?.fecha_cierre_ventas
  const fechaSorteoTexto = formatearFechaHoraAR(
    sorteo?.fecha_sorteo_programada ?? null,
  )
  const notaSorteo = fechaSorteoTexto
    ? conPlaceholders(contenido.cierre_sorteo_label, { fecha: fechaSorteoTexto })
    : undefined

  const PACKS = getPacks()

  const handleCompra = (pack: (typeof PACKS)[0]) => {
    if (ventasBloqueadas) return
    setPackSeleccionado({ ...pack, sorteoId: sorteo?.id })
    setModalAbierto(true)
  }

  const consultarMisNumeros = async (e: React.FormEvent) => {
    e.preventDefault()
    const emailTrimmed = consultaEmail.trim()
    if (!emailTrimmed) return
    setConsultaLoading(true)
    setConsultaResultados(null)
    setConsultaError(null)
    try {
      const response = await fetch(
        `/api/mis-numeros?email=${encodeURIComponent(emailTrimmed)}`,
      )
      const data = await response.json()
      if (!response.ok) {
        setConsultaError(data.error || "Ocurrió un error. Intenta nuevamente.")
        return
      }
      setConsultaResultados(data.participaciones)
    } catch {
      setConsultaError(
        "No se pudo conectar. Revisá tu conexión e intentá de nuevo.",
      )
    } finally {
      setConsultaLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-rl flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-2 border-[#4fafc4] border-t-transparent rounded-full animate-spin mx-auto opacity-80"></div>
          <p className="text-ice-muted text-sm tracking-[0.3em] uppercase">
            Cargando
          </p>
        </div>
      </div>
    )
  }

  if (!sorteo) {
    return (
      <div className="min-h-screen bg-rl flex flex-col">
        <Header marca={contenido.marca} />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center space-y-6 max-w-md">
            <div className="mx-auto flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl bg-white p-2.5 ring-1 ring-[#4fafc4]/30">
              <img
                src="/logo-rl-wave.png"
                alt={contenido.marca}
                className="h-auto w-full object-contain"
              />
            </div>
            <div className="space-y-2">
              <h2 className="text-4xl font-display uppercase tracking-tight text-brand">
                {contenido.proximamente_titulo}
              </h2>
              <p className="text-ice-muted text-sm">
                {contenido.proximamente_descripcion}
              </p>
            </div>
            {contenido.whatsapp_url && (
              <Link
                href={contenido.whatsapp_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-cta inline-block px-7 py-3 text-sm tracking-wide"
              >
                {contenido.proximamente_boton}
              </Link>
            )}
          </div>
        </div>
        <RedesSociales contenido={contenido} />
        <footer className="border-t border-[#4fafc4]/10 py-6">
          <div className="container mx-auto px-4 text-center text-ice-muted text-xs tracking-wide">
            <p>{contenido.footer_copyright}</p>
          </div>
        </footer>
      </div>
    )
  }

  return (
    <div
      className={`min-h-screen bg-rl ${mostrarContador ? "pb-24 sm:pb-0" : ""}`}
    >
      <Header marca={contenido.marca} />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="relative container mx-auto px-4 pt-14 pb-16 lg:pt-24 lg:pb-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Texto a la izquierda */}
            <div
              className={`space-y-7 text-center lg:text-left transition-all duration-700 ${
                animacionVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-6"
              }`}
            >
              <div className="chip-rl inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.25em]">
                <Sparkles className="w-3.5 h-3.5" />
                {contenido.hero_badge}
              </div>

              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold uppercase leading-[0.95] tracking-tight text-brand text-balance">
                {conPlaceholders(contenido.hero_titulo, {
                  premio: sorteo.titulo_remera || "el premio principal",
                })}
              </h1>

              {sorteo?.estado !== "sorteado" && (
                <p className="text-lg lg:text-xl text-ice font-light leading-relaxed max-w-md mx-auto lg:mx-0">
                  {contenido.hero_subtitulo}
                </p>
              )}

              {/* Progress / Evento finalizado */}
              {sorteo?.estado === "sorteado" ? (
                <div className="card-rl-soft p-6 sm:p-8 text-center lg:text-left">
                  <p className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold uppercase tracking-[0.12em] text-ice">
                    Finalizado
                  </p>
                </div>
              ) : (
                <div className="card-rl p-5 sm:p-6 space-y-4 text-left">
                  <span className="text-xs font-semibold text-ice-muted uppercase tracking-[0.2em]">
                    {contenido.hero_chances_label}
                  </span>
                  <AnimatedProgress
                    value={porcentajeVendido}
                    className="h-2.5"
                  />
                  <div className="flex items-baseline gap-2">
                    <span className="num-display text-4xl font-bold text-brand">
                      {porcentajeVendido.toFixed(1)}%
                    </span>
                    <span className="text-sm text-ice-muted">
                      {contenido.hero_completado_label}
                    </span>
                  </div>
                </div>
              )}

              {/* Contador regresivo hasta el cierre de ventas */}
              {mostrarContador && sorteo.fecha_cierre_ventas && (
                <CountdownCierre
                  fechaCierre={sorteo.fecha_cierre_ventas}
                  onExpirado={() => setVentasCerradas(true)}
                  kicker={contenido.cierre_kicker}
                  notaSorteo={notaSorteo}
                />
              )}

              {/* Ventas cerradas por horario (sin haber vendido el 100%) */}
              {ventasCerradas &&
                sorteo?.estado !== "sorteado" &&
                sorteo?.estado !== "cerrado" && (
                  <div className="card-rl-soft px-5 py-4 text-left">
                    <h3 className="text-base font-semibold text-ice mb-1 flex items-center gap-2">
                      <Lock className="w-4 h-4 shrink-0" />
                      {contenido.cierre_cerrado_titulo}
                    </h3>
                    <p className="text-sm text-ice-muted">
                      {contenido.cierre_cerrado_descripcion}
                    </p>
                    {notaSorteo && (
                      <p className="text-sm text-teal-solid mt-2">{notaSorteo}</p>
                    )}
                  </div>
                )}

              {/* Estados: completo / sorteado / cerrado */}
              {(sorteoCompleto || sorteo?.estado === "cerrado") && (
                <div className="space-y-4 text-left">
                  {sorteo?.estado === "completo" && (
                    <div className="card-rl px-5 py-4">
                      <h3 className="text-base font-semibold text-teal-solid mb-1 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        {contenido.hero_completo_titulo}
                      </h3>
                      <p className="text-sm text-ice-muted">
                        {contenido.hero_completo_descripcion}
                      </p>
                      {sorteo.fecha_sorteo_realizado && (
                        <p className="text-xs text-ice-muted opacity-70 mt-1">
                          Prendas completadas el{" "}
                          {new Date(
                            sorteo.fecha_sorteo_realizado,
                          ).toLocaleDateString("es-AR")}
                        </p>
                      )}
                    </div>
                  )}

                  {sorteo?.estado === "sorteado" && (
                    <div className="border-rl-gradient px-6 py-6 sm:px-8 sm:py-7">
                      <h3 className="text-lg sm:text-xl font-semibold text-teal-solid mb-4 flex items-center gap-2">
                        <Trophy className="w-5 h-5" />
                        {contenido.hero_sorteado_titulo}
                      </h3>
                      {sorteo.numero_ganador && (
                        <div className="space-y-4">
                          {sorteo.ganador_nombre && (
                            <div>
                              <p className="text-xs font-semibold text-ice-muted uppercase tracking-[0.2em] mb-1">
                                Ganador
                              </p>
                              <p className="text-3xl sm:text-4xl lg:text-5xl font-display font-semibold uppercase tracking-tight text-teal-solid leading-tight">
                                {sorteo.ganador_nombre}
                              </p>
                            </div>
                          )}
                          <div>
                            <p className="text-xs font-semibold text-ice-muted uppercase tracking-[0.2em] mb-1">
                              Número Ganador
                            </p>
                            <p className="font-mono font-bold text-teal-solid text-4xl sm:text-5xl lg:text-6xl leading-none">
                              {sorteo.numero_ganador}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* "cerrado", o vendido al 100% con el estado todavía en "activo".
                      Si ya cerraron las ventas por horario, ese card manda. */}
                  {!ventasCerradas &&
                    (sorteo?.estado === "cerrado" ||
                      (sorteo?.estado &&
                        !sorteo.estado.match(/completo|sorteado/))) && (
                      <div className="card-rl-soft px-5 py-4">
                        <h3 className="text-base font-semibold text-ice mb-1">
                          {contenido.hero_cerrado_titulo}
                        </h3>
                        <p className="text-sm text-ice-muted">
                          {contenido.hero_cerrado_descripcion}
                        </p>
                      </div>
                    )}
                </div>
              )}

              {/* CTAs */}
              {!ventasBloqueadas && (
                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  <a
                    href="#packs"
                    className="btn-cta inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-sm font-semibold tracking-wide"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {contenido.packs_comprar_boton}
                  </a>
                  <a
                    href="#premios"
                    className="btn-cta-outline inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-sm tracking-wide"
                  >
                    Ver premios
                    <ChevronDown className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>

            {/* Showcase del premio a la derecha */}
            <div
              className={`relative transition-all duration-700 delay-200 ${
                animacionVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-6"
              }`}
            >
              <div className="relative">
                <IphoneCarousel />

                {/* Floating badge */}
                <div className="absolute -top-4 inset-x-0 mx-auto w-fit lg:inset-x-auto lg:-right-2 lg:mx-0 btn-cta px-4 py-1.5 rounded-full text-[11px] font-semibold tracking-[0.2em] uppercase z-30 flex items-center gap-1.5 shadow-lg">
                  <Trophy className="w-3 h-3" />
                  {contenido.hero_badge}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sección de Packs */}
      {!ventasBloqueadas && (
        <section id="packs" className="py-20 scroll-mt-16">
          <WaveDivider className="mx-auto mb-16 max-w-4xl" />
          <div className="container mx-auto px-4">
            <Reveal className="text-center mb-12">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-teal-solid mb-3">
                Elegí tus números
              </p>
              <h2 className="text-5xl lg:text-6xl font-display font-semibold uppercase tracking-tight text-ice">
                Compra tus números
              </h2>
            </Reveal>

            <div className="flex flex-wrap justify-center gap-5 max-w-5xl mx-auto items-stretch">
              {PACKS.map((pack, index) => (
                <Reveal
                  key={pack.chances}
                  delay={index * 100}
                  className="w-full sm:w-[calc(50%-10px)] lg:w-[calc(33.333%-14px)] flex"
                >
                  <div
                    className={`relative flex flex-col w-full p-7 text-center ${
                      pack.popular ? "border-rl-gradient" : "card-rl-soft"
                    }`}
                  >
                    {pack.popular && (
                      <span className="btn-cta absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.2em]">
                        {contenido.packs_popular_label}
                      </span>
                    )}

                    <p className="flex items-center justify-center gap-3 num-display text-6xl font-bold text-teal-solid mt-3">
                      <Ticket className="w-9 h-9" strokeWidth={1.5} />
                      {pack.chances}
                    </p>
                    <p className="text-xs uppercase tracking-[0.25em] text-ice-muted mt-2 mb-5">
                      {pack.chances === 1 ? "Chance" : "Chances"}
                    </p>

                    <div className="divider-soft mb-5" />

                    <p className="flex flex-wrap items-center justify-center gap-2.5 text-2xl lg:text-3xl font-display font-semibold uppercase tracking-tight text-brand leading-tight flex-1">
                      {pack.chances === 1
                        ? "Número para ganar"
                        : "Números para ganar"}
                      <Car
                        className="w-7 h-7 text-teal-solid"
                        strokeWidth={1.5}
                      />
                    </p>

                    <p className="text-3xl font-semibold text-teal-solid mt-5">
                      ${pack.precio.toLocaleString()}
                    </p>

                    <button
                      onClick={() => handleCompra(pack)}
                      className={`mt-5 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full text-sm font-semibold tracking-wide w-full ${
                        pack.popular ? "btn-cta" : "btn-cta-outline"
                      }`}
                    >
                      <ShoppingCart className="w-4 h-4" />
                      {contenido.packs_comprar_boton}
                    </button>
                  </div>
                </Reveal>
              ))}
            </div>

            {PACKS.length > 1 && (
              <Reveal delay={200}>
                <p className="text-xs text-ice-muted text-center tracking-wide mt-8">
                  {contenido.packs_nota}
                </p>
              </Reveal>
            )}
          </div>
        </section>
      )}

      {/* Sección de Premios */}
      <section id="premios" className="py-20 scroll-mt-16">
        <WaveDivider className="mx-auto mb-16 max-w-4xl" />
        <div className="container mx-auto px-4">
          <Reveal className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-teal-solid mb-3">
              {contenido.premios_kicker}
            </p>
            <h2 className="text-6xl lg:text-7xl font-display font-bold uppercase tracking-tight text-brand">
              {contenido.premios_titulo}
            </h2>
          </Reveal>

          <div
            className={`grid gap-5 mx-auto ${
              promoDiaria?.visible ? "md:grid-cols-2 max-w-3xl" : "max-w-xl"
            }`}
          >
            {/* 1er Premio */}
            <Reveal variant="left">
              <div className="border-rl-gradient p-8 md:p-10 text-center h-full flex flex-col justify-center">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-teal-solid mb-3">
                  {contenido.premios_primer_label}
                </p>
                <p
                  className={`font-display text-ice ${
                    promoDiaria?.visible
                      ? "text-2xl lg:text-3xl"
                      : "text-3xl lg:text-4xl"
                  }`}
                >
                  {sorteo.titulo_remera || "Premio principal"}
                </p>
              </div>
            </Reveal>

            {/* Regalo diario (promo para incentivar la compra del día) */}
            {promoDiaria?.visible && (
              <PromoDiaria promo={promoDiaria} sorteoId={sorteo.id} />
            )}

            {/*
              Premios secundarios (Números Bendecidos): reemplazado por la promo
              de sorteos diarios. Se deja comentado (no eliminado) por si se
              quiere reactivar. El manager del backoffice y la lógica en
              lib/database.ts (obtener/actualizarPremiosSecundarios) siguen intactos.

              {premiosSecundarios?.visible &&
                premiosSecundarios.numeros.length > 0 && (
                  <Reveal variant="right" delay={100}>
                    <div className="card-rl p-6 md:p-8 h-full">
                      <div className="flex items-center gap-2 mb-4">
                        <Trophy className="w-4 h-4 text-[#4fafc4]" />
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-teal-solid">
                          {contenido.premios_sec_label}
                        </p>
                      </div>

                      <p className="text-base font-semibold text-ice mb-4">
                        {premiosSecundarios.titulo}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {premiosSecundarios.numeros.map((num) => {
                          const tachado = premiosSecundarios.tachados?.includes(num)
                          return (
                            <span
                              key={num}
                              className={"chip-rl font-mono font-bold text-xl rounded-lg px-4 py-1.5 " + (tachado ? "line-through opacity-50" : "")}
                            >
                              {num}
                            </span>
                          )
                        })}
                      </div>
                      <p className="text-xs text-ice-muted leading-relaxed">
                        {contenido.premios_sec_descripcion
                          .split("{monto}")
                          .map((parte, i, partes) => (
                            <span key={i}>
                              {parte}
                              {i < partes.length - 1 && (
                                <span className="font-semibold text-ice">
                                  {premiosSecundarios.monto}
                                </span>
                              )}
                            </span>
                          ))}
                      </p>
                    </div>
                  </Reveal>
                )}
            */}
          </div>
        </div>
      </section>

      {/* Sección FAQ */}
      <section className="py-20">
        <div className="divider-soft max-w-4xl mx-auto mb-20" />
        <div className="container mx-auto px-4 max-w-2xl">
          <Reveal>
            <h2 className="text-5xl lg:text-6xl font-display font-semibold uppercase tracking-tight text-ice mb-12 text-center">
              {contenido.faq_titulo}
            </h2>
          </Reveal>

          <div className="grid sm:grid-cols-2 gap-5">
            <Reveal variant="left">
              <div className="card-rl-soft p-6 h-full">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-solid mb-3">
                  {contenido.faq_pregunta_fecha}
                </p>
                <span className="text-ice text-lg font-medium">
                  {fechaSorteoTexto || contenido.faq_respuesta_fecha_pendiente}
                </span>
              </div>
            </Reveal>

            <Reveal variant="right" delay={100}>
              {/* Sin link configurado se muestra como card informativa, no
                  como link muerto. */}
              {(() => {
                const cardGanador = (
                  <div className="card-rl h-full p-6">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-teal-solid">
                      {contenido.faq_pregunta_ganador}
                    </p>
                    <span
                      className={`text-base font-medium ${
                        contenido.faq_link_quiniela
                          ? "text-teal-solid underline-offset-4 hover:underline"
                          : "text-ice"
                      }`}
                    >
                      {contenido.faq_respuesta_ganador}
                    </span>
                  </div>
                )
                return contenido.faq_link_quiniela ? (
                  <Link
                    href={contenido.faq_link_quiniela}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block h-full"
                  >
                    {cardGanador}
                  </Link>
                ) : (
                  cardGanador
                )
              })()}
            </Reveal>
          </div>
        </div>
      </section>

      {/* Sección Consultá tus números */}
      <section id="consulta" className="py-20 scroll-mt-16">
        <WaveDivider className="mx-auto mb-16 max-w-4xl" />
        <div className="container mx-auto px-4 max-w-xl">
          <Reveal className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-teal-solid mb-3">
              {contenido.consulta_kicker}
            </p>
            <h2 className="text-5xl lg:text-6xl font-display font-semibold uppercase tracking-tight text-ice mb-3">
              {contenido.consulta_titulo}
            </h2>
            <p className="text-ice-muted text-sm">
              {contenido.consulta_descripcion}
            </p>
          </Reveal>

          <Reveal delay={100}>
            <form
              onSubmit={consultarMisNumeros}
              className="flex flex-col sm:flex-row gap-2 mb-6"
            >
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                value={consultaEmail}
                onChange={(e) => setConsultaEmail(e.target.value)}
                placeholder={contenido.consulta_placeholder}
                disabled={consultaLoading}
                className="input-rl flex-1 rounded-full px-5 py-3 text-sm disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={consultaLoading || !consultaEmail.trim()}
                className="btn-cta px-7 py-3 rounded-full text-sm font-semibold tracking-wide disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none whitespace-nowrap"
              >
                {consultaLoading ? "Buscando..." : contenido.consulta_boton}
              </button>
            </form>
          </Reveal>

          {consultaError && (
            <div className="bg-red-950/30 border border-red-900/40 rounded-xl p-4 text-center text-red-400 text-sm mb-4">
              {consultaError}
            </div>
          )}

          {consultaResultados !== null && consultaResultados.length === 0 && (
            <div className="card-rl-soft p-6 text-center">
              <p className="text-ice-muted text-sm">
                {contenido.consulta_vacio}
              </p>
              <p className="text-ice-muted text-xs mt-2 opacity-70">
                {contenido.consulta_vacio_nota}
              </p>
            </div>
          )}

          {consultaResultados !== null && consultaResultados.length > 0 && (
            <div className="space-y-4">
              {consultaResultados.map((p) => (
                <div key={p.id} className="card-rl p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                    <div>
                      <p className="text-ice font-semibold">{p.nombre}</p>
                      <p className="text-ice-muted text-xs mt-0.5">
                        {p.sorteo_nombre}
                      </p>
                    </div>
                    <span className="text-xs text-ice-muted">
                      {new Date(p.created_at).toLocaleDateString("es-AR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-solid mb-3">
                    Tus {p.cantidad_chances} números asignados
                  </p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {[...p.numeros_asignados]
                      .sort((a, b) => a - b)
                      .map((numero) => (
                        <span
                          key={numero}
                          className="chip-rl font-mono font-semibold px-3 py-1 rounded text-sm"
                        >
                          {numero}
                        </span>
                      ))}
                  </div>
                  <button
                    onClick={() => generarComprobante(p.sorteo_nombre, p)}
                    className="btn-cta px-5 py-2 rounded-full text-xs font-semibold tracking-wide flex items-center gap-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Descargar comprobante
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Ganadores Express */}
      {sorteo && (
        <GanadoresExpress sorteoId={sorteo.id} contenido={contenido} />
      )}

      {/* Ganadores Pasados: reemplazado por el Mural de Ganadores.
          Dejar comentado por si se quiere reactivar en el futuro. */}
      {/* <GanadoresPasados contenido={contenido} /> */}

      {/* Mural de Ganadores Anteriores (collage de fotos) */}
      <MuralGanadores />

      {/* Links de interés / Redes sociales */}
      <RedesSociales contenido={contenido} />

      {/* Footer */}
      <footer className="py-12">
        <div className="divider-rl max-w-5xl mx-auto mb-10" />
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <span className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-white p-1">
                <img
                  src="/logo-rl-wave.png"
                  alt=""
                  aria-hidden="true"
                  className="h-auto w-full object-contain"
                />
              </span>
              <span className="font-display text-lg font-semibold uppercase tracking-[0.06em] text-brand">
                {contenido.marca}
              </span>
            </span>
            <div className="flex space-x-6">
              {contenido.whatsapp_url && (
                <Link
                  href={contenido.whatsapp_url}
                  className="text-ice-muted hover:text-teal-solid transition-colors text-sm"
                >
                  Contacto
                </Link>
              )}
              <Link
                href="/terminos"
                className="text-ice-muted hover:text-teal-solid transition-colors text-sm"
              >
                Términos
              </Link>
            </div>
          </div>
          <div className="border-t border-[#c4d5db]/10 mt-6 pt-6 flex flex-col sm:flex-row justify-between items-center gap-2">
            <p className="text-ice-muted text-xs opacity-70">
              {contenido.footer_copyright}
            </p>
            <Link
              href="https://linktr.ee/deweertstudio"
              target="_blank"
              rel="noopener noreferrer"
              className="text-ice-muted text-xs opacity-70 hover:opacity-100 hover:text-teal-solid transition-all"
            >
              Desarrollado por De Weert Studio
            </Link>
          </div>
        </div>
      </footer>

      <CompraModalNuevo
        isOpen={modalAbierto}
        onClose={() => setModalAbierto(false)}
        pack={packSeleccionado}
        onCompraMercadoPago={procesarCompra}
        onCompraTransferencia={procesarTransferencia}
      />

      {/* Barra fija con el contador, sólo en mobile */}
      {mostrarContador && sorteo.fecha_cierre_ventas && (
        <CountdownCierre
          variant="barra"
          fechaCierre={sorteo.fecha_cierre_ventas}
          onExpirado={() => setVentasCerradas(true)}
          kicker={contenido.cierre_kicker}
        />
      )}

      <Toaster />
    </div>
  )
}
