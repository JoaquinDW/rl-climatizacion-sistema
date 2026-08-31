"use client"

import React, { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import useEmblaCarousel from "embla-carousel-react"
import { obtenerSorteoActivo } from "@/lib/database"
import type { Sorteo } from "@/lib/supabase"
import { ChevronLeft, ChevronRight } from "lucide-react"

export default function PremioCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true })
  const [sorteo, setSorteo] = useState<Sorteo | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const cargarSorteo = async () => {
      try {
        const sorteoActivo = await obtenerSorteoActivo()
        setSorteo(sorteoActivo)
      } catch (error) {
        console.error("Error cargando sorteo:", error)
      }
    }
    cargarSorteo()
  }, [])

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return

    const onSelect = () => {
      setCurrentIndex(emblaApi.selectedScrollSnap())
    }

    emblaApi.on("select", onSelect)
    return () => {
      emblaApi.off("select", onSelect)
    }
  }, [emblaApi])

  // Usar imágenes del carrusel si están disponibles
  const slides = [
    sorteo?.carousel_image_1,
    sorteo?.carousel_image_2,
    sorteo?.carousel_image_3,
    sorteo?.carousel_image_4,
    sorteo?.carousel_image_5,
    sorteo?.carousel_image_6,
    sorteo?.carousel_image_7,
    sorteo?.carousel_image_8,
  ].filter((img): img is string => Boolean(img)) // Filtrar nulls/undefined con type guard

  // Si no hay imágenes del carousel, usar placeholders por defecto
  const finalSlides: string[] =
    slides.length > 0
      ? slides
      : [
          "/placeholder.jpg",
          "/white-t-shirt-mockup-t-shirt-with-short-sleeves-ai-generative-free-png.webp",
          "/placeholder-user.jpg",
        ]

  return (
    <div className="relative mx-auto w-full max-w-md sm:max-w-lg md:max-w-2xl">
      <div className="pointer-events-none absolute -inset-4 -z-10 border border-[#cf1834]/12 bg-[#cf1834]/[0.025] [clip-path:polygon(0_0,calc(100%-28px)_0,100%_28px,100%_100%,28px_100%,0_calc(100%-28px))]" />
      <div
        className="overflow-hidden rounded-md border border-white/15 bg-[#0d0f13] shadow-[0_28px_80px_rgba(0,0,0,0.56)]"
        ref={emblaRef as any}
      >
        <div className="flex h-8 items-center justify-between border-b border-white/10 bg-[#111318] px-3">
          <span className="h-1.5 w-16 -skew-x-[28deg] bg-[#cf1834]" />
          <span className="text-[9px] font-semibold uppercase tracking-[0.28em] text-brand-muted">
            Premio destacado
          </span>
        </div>
        <div className="flex">
          {finalSlides.map((src, idx) => (
            <div key={idx} className="min-w-full flex-shrink-0">
              <div className="relative overflow-hidden h-[500px] sm:h-[600px] md:h-[700px]">
                {/* Imagen de fondo difuminada para llenar los espacios */}
                <div className="absolute inset-0">
                  <Image
                    src={src}
                    alt=""
                    fill
                    className="object-cover blur-2xl scale-110 opacity-50"
                  />
                </div>
                {/* Imagen principal */}
                <div className="relative w-full h-full">
                  <Image
                    src={src}
                    alt={`Slide ${idx + 1}`}
                    fill
                    className="object-contain"
                    priority={idx === 0}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Controles de navegación */}
      {finalSlides.length > 1 && (
        <>
          <button
            aria-label="Imagen anterior"
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-md border border-[#ef4962]/35 bg-black/65 p-2 text-[#ef4962] backdrop-blur-sm transition-all duration-200 hover:bg-[#cf1834] hover:text-white"
            onClick={scrollPrev}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            aria-label="Imagen siguiente"
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-md border border-[#ef4962]/35 bg-black/65 p-2 text-[#ef4962] backdrop-blur-sm transition-all duration-200 hover:bg-[#cf1834] hover:text-white"
            onClick={scrollNext}
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dots indicadores */}
          <div className="flex justify-center mt-5 space-x-2">
            {finalSlides.map((_, idx) => (
              <button
                key={idx}
                aria-label={`Ir a la imagen ${idx + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentIndex
                    ? "w-7 -skew-x-[24deg] bg-[#cf1834]"
                    : "w-2 bg-[#9a9da3]/35 hover:bg-[#9a9da3]/70"
                }`}
                onClick={() => emblaApi?.scrollTo(idx)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
