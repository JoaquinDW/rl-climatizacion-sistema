import { Fragment } from "react"

import type { RedSocial, TipoRed } from "@/lib/contenido"
import { USUARIO_REDES } from "@/lib/marca"

const TIPO_POR_MENCION: Record<string, TipoRed> = {
  instagram: "instagram",
  tiktok: "tiktok",
  facebook: "facebook",
}

const PATRON_MENCIONES = new RegExp(
  `(@${USUARIO_REDES}|Instagram|TikTok|Facebook)`,
  "gi",
)

const PATRON_REQUISITO_REDES =
  /seguinos?.*(instagram|tiktok|facebook|@[^\s)]+)/i

interface TextoConLinksRedesProps {
  texto: string
  redes: RedSocial[]
}

function SeparadorRed({ index, total }: { index: number; total: number }) {
  if (index === 0) return null
  return <>{index === total - 1 ? " y " : ", "}</>
}

function LinkRed({ red }: { red: RedSocial }) {
  return (
    <a
      href={red.url}
      target="_blank"
      rel="noopener noreferrer"
      className="font-semibold text-brand-accent underline decoration-current/50 underline-offset-2 transition-colors hover:text-[#ffe394]"
    >
      {red.etiqueta || red.tipo}
    </a>
  )
}

export function TextoConLinksRedes({
  texto,
  redes,
}: TextoConLinksRedesProps) {
  const redesActivas = redes.filter((red) => red.url.trim())

  // El requisito de seguimiento se arma con la misma lista que la sección de
  // redes. Así nunca se menciona una cuenta que no aparece disponible abajo.
  if (PATRON_REQUISITO_REDES.test(texto) && redesActivas.length > 0) {
    return (
      <>
        Seguinos en{" "}
        {redesActivas.map((red, index) => (
          <Fragment key={`${red.tipo}-${red.url}`}>
            <SeparadorRed index={index} total={redesActivas.length} />
            <LinkRed red={red} />
          </Fragment>
        ))}
      </>
    )
  }

  const redesPorTipo = new Map(redesActivas.map((red) => [red.tipo, red]))

  return (
    <>
      {texto.split(PATRON_MENCIONES).map((parte, index) => {
        const tipo = parte.startsWith("@")
          ? "instagram"
          : TIPO_POR_MENCION[parte.toLowerCase()]
        const red = tipo ? redesPorTipo.get(tipo) : undefined

        if (!red) return <Fragment key={index}>{parte}</Fragment>

        return <LinkRed key={index} red={{ ...red, etiqueta: parte }} />
      })}
    </>
  )
}
