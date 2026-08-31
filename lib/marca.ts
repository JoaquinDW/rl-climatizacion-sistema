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

// Se respeta la configuración del entorno actual hasta contar con un dominio
// propio de Faustino Motors. NEXT_PUBLIC_APP_URL ya existe en instalaciones
// anteriores, por eso se conserva como fallback compatible.
export const SITIO_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://rlclimatizacion.com.ar"

// Resend exige que el dominio del remitente esté verificado. El display name
// sí usa la marca nueva; la dirección técnica se mantiene hasta reemplazarla.
export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || `${MARCA} <noreply@rlclimatizacion.com.ar>`

export const LOGO_PATH = "/logo-faustino.png"
export const INSTAGRAM_LIVE_URL = REDES_OFICIALES.instagram
