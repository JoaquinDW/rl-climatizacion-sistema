import { createHmac, timingSafeEqual } from "node:crypto"

export const ADMIN_SESSION_COOKIE = "faustino_admin_session"

const SESSION_PAYLOAD = "faustino-motors:admin:v1"
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000

function getSessionSecret(): string | null {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || null
}

export function crearTokenAdmin(): string | null {
  const secret = getSessionSecret()
  if (!secret) return null

  const expiresAt = Date.now() + SESSION_DURATION_MS
  const signature = createHmac("sha256", secret)
    .update(`${SESSION_PAYLOAD}:${expiresAt}`)
    .digest("hex")

  return `${expiresAt}.${signature}`
}

export function esSesionAdminValida(token?: string | null): boolean {
  const secret = getSessionSecret()
  if (!token || !secret) return false

  const [expiresAtText, signature, extra] = token.split(".")
  if (extra || !/^\d+$/.test(expiresAtText) || !/^[a-f0-9]{64}$/.test(signature)) {
    return false
  }

  const expiresAt = Number(expiresAtText)
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Date.now()) return false

  const esperado = createHmac("sha256", secret)
    .update(`${SESSION_PAYLOAD}:${expiresAt}`)
    .digest("hex")

  return timingSafeEqual(Buffer.from(signature), Buffer.from(esperado))
}

export const adminCookieOptions = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 12,
}
