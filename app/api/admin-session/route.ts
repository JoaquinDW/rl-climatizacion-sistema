import { type NextRequest, NextResponse } from "next/server"
import {
  ADMIN_SESSION_COOKIE,
  adminCookieOptions,
  esSesionAdminValida,
} from "@/lib/admin-auth"

export async function GET(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
  return NextResponse.json({ authenticated: esSesionAdminValida(token) })
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    ...adminCookieOptions,
    maxAge: 0,
  })
  return response
}
