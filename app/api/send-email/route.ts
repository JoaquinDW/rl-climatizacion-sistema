import { type NextRequest, NextResponse } from "next/server"
import { enviarEmailConfirmacion, type EmailData } from "@/lib/email"
import { ADMIN_SESSION_COOKIE, esSesionAdminValida } from "@/lib/admin-auth"

export async function POST(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
  if (!esSesionAdminValida(token)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  try {
    const emailData: EmailData = await request.json()

    const resultado = await enviarEmailConfirmacion(emailData)

    if (resultado.success) {
      return NextResponse.json({ success: true, message: "Email enviado correctamente" })
    } else {
      return NextResponse.json({ success: false, error: "Error enviando email" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error en API de email:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
