// Fuente única de la identidad de marca. Cambiar acá se propaga a metadata,
// emails, comprobantes y textos por defecto del sitio.

export const MARCA = "RL Climatización"
export const MARCA_CORTA = "RL"

// TODO: reemplazar por el dominio real de RL Climatización cuando esté contratado.
export const SITIO_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://rlclimatizacion.com.ar"

// TODO: Resend exige que el dominio del remitente esté verificado en su panel
// antes de poder enviar. Hasta entonces los envíos van a fallar.
export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || `${MARCA} <noreply@rlclimatizacion.com.ar>`

export const LOGO_PATH = "/logo-rl.png"
