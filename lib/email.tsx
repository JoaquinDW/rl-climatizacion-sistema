import { Resend } from "resend"

import { FROM_EMAIL, MARCA, SITIO_URL } from "./marca"

const resend = new Resend(process.env.RESEND_API_KEY)

// Paleta de marca (coincide con la landing: petróleo + teal + naranja).
// Duplicada acá a propósito: los emails no pueden usar clases de Tailwind.
const COLORS = {
  bg: "#08151a",
  surface: "#142c36",
  surface2: "#0e2129",
  tealLight: "#9ad5e1",
  teal: "#4fafc4",
  tealDeep: "#00637a",
  tealBright: "#d8eef3",
  orange: "#d25e23",
  ice: "#c4d5db",
  iceMuted: "#8ca4ad",
  red: "#f87171",
  greenOk: "#34d399",
}

export interface EmailData {
  nombre: string
  email: string
  cantidadChances: number
  numerosAsignados: number[]
  precioPagado: number
  sorteoNombre?: string
  sorteoImagenUrl?: string
}

export async function enviarEmailConfirmacion(data: EmailData) {
  try {
    const { data: emailResult, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [data.email],
      subject: `🎉 ¡Confirmación de compra - ${data.sorteoNombre}!`,
      html: generarHTMLEmail(data),
    })

    if (error) {
      console.error("Error enviando email:", error)
      return { success: false, error }
    }

    return { success: true, data: emailResult }
  } catch (error) {
    console.error("Error enviando email:", error)
    return { success: false, error }
  }
}

// ---------------------------------------------------------------------------
// Bloques reutilizables del template
// ---------------------------------------------------------------------------

function emailLayout({
  preheader,
  title,
  subtitle,
  badge,
  bodyHtml,
}: {
  preheader: string
  title: string
  subtitle: string
  badge?: { text: string; accent?: string }
  bodyHtml: string
}): string {
  const accent = badge?.accent ?? COLORS.teal

  return `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="dark light" />
    <meta name="supported-color-schemes" content="dark light" />
    <title>${title}</title>
  </head>
  <body style="margin:0; padding:0; background-color:${COLORS.bg}; font-family:'Helvetica Neue', Helvetica, Arial, sans-serif;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent; font-size:1px; line-height:1px;">${preheader}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.bg}; padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background:linear-gradient(180deg, ${COLORS.surface} 0%, ${COLORS.surface2} 100%); border-radius:18px; border:1px solid rgba(79,175,196,0.28); overflow:hidden;">

            <!-- Header -->
            <tr>
              <td align="center" style="padding:36px 32px 20px 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" style="background-color:${COLORS.teal}; background:linear-gradient(135deg, ${COLORS.tealLight} 0%, ${COLORS.teal} 55%, ${COLORS.tealDeep} 100%); border-radius:10px; padding:14px 26px;">
                      <span style="font-size:21px; font-weight:800; letter-spacing:1.5px; color:#08151a;">${MARCA.toUpperCase()}&nbsp;</span>
                    </td>
                  </tr>
                </table>
                <h1 style="margin:24px 0 6px 0; font-size:27px; font-weight:800; color:${COLORS.tealBright};">${title}</h1>
                <p style="margin:0; font-size:15px; color:${COLORS.iceMuted};">${subtitle}</p>
              </td>
            </tr>

            <!-- Divisor dorado -->
            <tr>
              <td style="padding:0 32px;">
                <div style="height:1px; background:linear-gradient(90deg, transparent, rgba(0,126,149,0.55) 35%, rgba(210,94,35,0.5) 65%, transparent);"></div>
              </td>
            </tr>

            ${
              badge
                ? `
            <tr>
              <td align="center" style="padding:24px 32px 0 32px;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td align="center" style="background:rgba(255,255,255,0.03); border:1px solid ${accent}; border-radius:12px; padding:14px 18px;">
                      <span style="font-size:16px; font-weight:700; color:${accent};">${badge.text}</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>`
                : ""
            }

            <!-- Body -->
            <tr>
              <td style="padding:24px 32px 8px 32px; color:${COLORS.ice}; font-size:15px; line-height:1.65;">
                ${bodyHtml}
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:8px 32px 32px 32px;">
                <div style="height:1px; background:linear-gradient(90deg, transparent, rgba(196,213,219,0.18), transparent); margin-bottom:18px;"></div>
                <p style="margin:0 0 4px 0; text-align:center; font-size:12px; color:${COLORS.iceMuted};">Este es un email automático, por favor no respondas a este mensaje.</p>
                <p style="margin:0; text-align:center; font-size:12px; color:${COLORS.iceMuted};">© ${new Date().getFullYear()} ${MARCA}. Todos los derechos reservados.</p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `
}

function bloqueNumeros(numeros: number[]): string {
  return `
    <p style="margin:0 0 10px 0; font-weight:700; color:${COLORS.tealLight}; text-transform:uppercase; letter-spacing:1px; font-size:13px;">Tus números asignados</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="background:#061014; border:2px solid ${COLORS.teal}; border-radius:12px; padding:18px 16px;">
          <span style="font-size:22px; font-weight:800; letter-spacing:3px; color:${COLORS.tealBright};">${numeros.join("&nbsp;&nbsp;·&nbsp;&nbsp;")}</span>
        </td>
      </tr>
    </table>
  `
}

function bloqueImagen(url?: string): string {
  if (!url) return ""
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:28px 0 8px 0;">
          <img src="${url}" alt="Imagen del sorteo" width="320" style="max-width:320px; width:100%; height:auto; border-radius:12px; border:3px solid ${COLORS.teal};" />
        </td>
      </tr>
    </table>
  `
}

function bloqueResumen(rows: Array<{ label: string; value: string }>): string {
  const filas = rows
    .map(
      (r, i) => `
      <tr>
        <td style="padding:10px 0; font-size:14px; color:${COLORS.iceMuted}; ${
          i < rows.length - 1
            ? "border-bottom:1px solid rgba(200,205,213,0.12);"
            : ""
        }">${r.label}</td>
        <td align="right" style="padding:10px 0; font-size:14px; font-weight:700; color:${COLORS.tealLight}; ${
          i < rows.length - 1
            ? "border-bottom:1px solid rgba(200,205,213,0.12);"
            : ""
        }">${r.value}</td>
      </tr>`,
    )
    .join("")

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03); border:1px solid rgba(79,175,196,0.22); border-radius:12px; padding:6px 18px; margin:20px 0;">
      ${filas}
    </table>
  `
}

function bloqueSuerte(): string {
  return `<p style="text-align:center; font-size:17px; margin:26px 0 6px 0; color:${COLORS.tealBright}; font-weight:600;">Mucha suerte!</p>`
}

function generarHTMLEmail(data: EmailData): string {
  const body = `
    <p style="margin:0 0 14px 0;">Hola <strong style="color:${COLORS.tealLight};">${data.nombre}</strong>,</p>
    <p style="margin:0 0 22px 0;">Nos complace informarte que tu compra ha sido aprobada y tus números han sido asignados exitosamente.</p>
    ${bloqueNumeros(data.numerosAsignados)}
    ${bloqueImagen(data.sorteoImagenUrl)}
    ${bloqueSuerte()}
  `

  return emailLayout({
    preheader: "Tu compra fue confirmada y tus números ya están asignados.",
    title: "¡Compra Confirmada!",
    subtitle: "Tu participación ha sido registrada exitosamente",
    bodyHtml: body,
  })
}

export interface TransferenciaAprobadaData {
  nombre: string
  email: string
  cantidadChances: number
  numerosAsignados: number[]
  precioPagado: number
  nombreSorteo: string
  sorteoImagenUrl?: string
}

export interface TransferenciaRechazadaData {
  nombre: string
  email: string
  cantidadChances: number
  precioPagado: number
  nombreSorteo: string
  motivo?: string
}

export async function enviarEmailTransferenciaAprobada(
  data: TransferenciaAprobadaData,
) {
  try {
    const { data: emailResult, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [data.email],
      subject: `✅ ¡Transferencia Aprobada! - ${data.nombreSorteo}`,
      html: generarHTMLTransferenciaAprobada(data),
    })

    if (error) {
      console.error("Error enviando email de transferencia aprobada:", error)
      return { success: false, error }
    }

    return { success: true, data: emailResult }
  } catch (error) {
    console.error("Error enviando email de transferencia aprobada:", error)
    return { success: false, error }
  }
}

export async function enviarEmailTransferenciaRechazada(
  data: TransferenciaRechazadaData,
) {
  try {
    const { data: emailResult, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [data.email],
      subject: "❌ Transferencia no Aprobada",
      html: generarHTMLTransferenciaRechazada(data),
    })

    if (error) {
      console.error("Error enviando email de transferencia rechazada:", error)
      return { success: false, error }
    }

    return { success: true, data: emailResult }
  } catch (error) {
    console.error("Error enviando email de transferencia rechazada:", error)
    return { success: false, error }
  }
}

function generarHTMLTransferenciaAprobada(
  data: TransferenciaAprobadaData,
): string {
  const body = `
    <p style="margin:0 0 14px 0;">Hola <strong style="color:${COLORS.tealLight};">${data.nombre}</strong>,</p>
    <p style="margin:0 0 22px 0;">Tu pago fue verificado y aprobado exitosamente. Tus números ya quedaron asignados para <strong style="color:${COLORS.tealLight};">${data.nombreSorteo}</strong>.</p>
    ${bloqueNumeros(data.numerosAsignados)}
    ${bloqueResumen([
      { label: "Chances", value: String(data.cantidadChances) },
      {
        label: "Monto abonado",
        value: `$${data.precioPagado.toLocaleString()}`,
      },
    ])}
    ${bloqueImagen(data.sorteoImagenUrl)}
    ${bloqueSuerte()}
  `

  return emailLayout({
    preheader:
      "Tu transferencia fue aprobada y tus números ya están asignados.",
    title: "¡Transferencia Aprobada!",
    subtitle: "Tu pago fue verificado y aprobado exitosamente",
    badge: { text: "✅ Pago verificado correctamente", accent: COLORS.greenOk },
    bodyHtml: body,
  })
}

function generarHTMLTransferenciaRechazada(
  data: TransferenciaRechazadaData,
): string {
  const body = `
    <p style="margin:0 0 14px 0;">Hola <strong style="color:${COLORS.tealLight};">${data.nombre}</strong>,</p>
    <p style="margin:0 0 22px 0;">Lamentamos informarte que no pudimos aprobar tu transferencia para participar en <strong style="color:${COLORS.tealLight};">${data.nombreSorteo}</strong>.</p>
    ${bloqueResumen([
      { label: "Chances solicitadas", value: String(data.cantidadChances) },
      {
        label: "Monto esperado",
        value: `$${data.precioPagado.toLocaleString()}`,
      },
      { label: "Email", value: data.email },
    ])}
    ${
      data.motivo
        ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,0,64,0.08); border:1px solid rgba(255,0,64,0.45); border-radius:12px; margin:8px 0 20px 0;">
        <tr>
          <td style="padding:16px 18px;">
            <p style="margin:0 0 6px 0; font-weight:700; color:${COLORS.red};">📋 Motivo</p>
            <p style="margin:0; color:${COLORS.ice};">${data.motivo}</p>
          </td>
        </tr>
      </table>`
        : ""
    }
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(79,175,196,0.06); border:1px solid rgba(79,175,196,0.30); border-radius:12px; margin:8px 0 20px 0;">
      <tr>
        <td style="padding:18px;">
          <p style="margin:0 0 10px 0; font-weight:700; color:${COLORS.tealLight};">💬 ¿Qué puedes hacer?</p>
          <ul style="margin:0; padding-left:20px; color:${COLORS.ice}; font-size:14px; line-height:1.7;">
            <li>Verifica que hayas enviado el comprobante correcto</li>
            <li>Asegúrate de que el monto transferido sea exacto</li>
            <li>Contactanos si tienes dudas sobre tu transferencia</li>
            <li>Puedes enviar un nuevo comprobante si es necesario</li>
          </ul>
        </td>
      </tr>
    </table>
    <p style="margin:0 0 6px 0;">Si tienes dudas o crees que hubo un error, no dudes en contactarnos. Estaremos encantados de ayudarte.</p>
    ${bloqueSuerte()}
  `

  return emailLayout({
    preheader: "Necesitamos que revises tu transferencia.",
    title: "Transferencia No Aprobada",
    subtitle: "Necesitamos que revises tu pago",
    badge: {
      text: "❌ Tu transferencia no pudo ser verificada",
      accent: COLORS.red,
    },
    bodyHtml: body,
  })
}
