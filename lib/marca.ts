// Fuente única de la identidad de marca. Cambiar acá se propaga a metadata,
// emails, comprobantes, enlaces oficiales y textos por defecto del sitio.

export const MARCA = "Faustino Motors"
export const MARCA_CORTA = "Faustino"

export const USUARIO_REDES = "faustino_motors"

export const REDES_OFICIALES = {
  instagram: `https://www.instagram.com/${USUARIO_REDES}/`,
  tiktok: `https://www.tiktok.com/@${USUARIO_REDES}`,
  facebook: `https://www.facebook.com/${USUARIO_REDES}`,
} as const

export const DOMINIO = "faustinomotors.com.ar"
export const SITIO_URL = `https://www.${DOMINIO}`

// Sólo se acepta una configuración que conserve el dominio verificado. Esto
// evita que una variable antigua vuelva a enviar desde otra marca.
const remitenteConfigurado = process.env.RESEND_FROM_EMAIL
export const FROM_EMAIL =
  remitenteConfigurado?.toLowerCase().includes(`@${DOMINIO}`)
    ? remitenteConfigurado
    : `${MARCA} <noreply@${DOMINIO}>`

export const LOGO_PATH = "/logo-faustino.png"
export const INSTAGRAM_LIVE_URL = REDES_OFICIALES.instagram
