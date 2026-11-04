import { Fragment } from "react"

import { REDES_OFICIALES, USUARIO_REDES } from "@/lib/marca"

const REDES = {
  instagram: REDES_OFICIALES.instagram,
  tiktok: REDES_OFICIALES.tiktok,
  facebook: REDES_OFICIALES.facebook,
} as const

const PATRON_REDES = new RegExp(
  `(@${USUARIO_REDES}|Instagram|TikTok|Facebook)`,
  "gi",
)

export function TextoConLinksRedes({ texto }: { texto: string }) {
  return (
    <>
      {texto.split(PATRON_REDES).map((parte, index) => {
        const red = parte.startsWith("@")
          ? "instagram"
          : parte.toLowerCase()
        const href = REDES[red as keyof typeof REDES]

        if (!href) return <Fragment key={index}>{parte}</Fragment>

        return (
          <a
            key={index}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-brand-accent underline decoration-current/50 underline-offset-2 transition-colors hover:text-[#ffe394]"
            onClick={(event) => event.stopPropagation()}
          >
            {parte}
          </a>
        )
      })}
    </>
  )
}
