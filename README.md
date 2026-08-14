# Sistema de Sorteos — RL Climatización 🎯

Plataforma de venta de chances con asignación de números únicos y sorteo automático
contra la Quiniela de Buenos Aires.

## Características Principales

✨ **Sistema Completamente Automatizado**

- Venta de chances con números únicos
- Detección automática cuando se agotan las chances
- Ejecución automática del sorteo 24h después
- Scrapping de la Quiniela Buenos Aires para números ganadores

🎲 **Flujo Inteligente**

1. Los usuarios compran chances → sistema asigna números únicos
2. Cuando se venden todas las chances → estado cambia a "completo"
3. Al día siguiente → scrapper obtiene número ganador automáticamente
4. Sistema determina y notifica al ganador por email

💳 **Dos métodos de pago**

- **MercadoPago** — los números se asignan al confirmarse el webhook de pago
- **Transferencia bancaria** — el comprador sube el comprobante y los números se
  asignan cuando un admin aprueba desde el backoffice

🔧 **Tecnologías**

- Next.js 15 (App Router) + TypeScript
- Supabase (Postgres)
- Vercel Blob (imágenes) y Vercel Cron Jobs
- MercadoPago (pagos) y Resend (emails)
- Playwright (web scraping)
- Tailwind CSS + Radix UI (shadcn/ui)

## Comandos Disponibles

```bash
pnpm dev                    # Desarrollo
pnpm build                  # Build de producción
pnpm lint                   # ESLint

pnpm run scrapper           # Ejecutar el scrapper manualmente
pnpm run verificar-sorteos  # Verificar sorteos pendientes
pnpm run prueba-rapida      # Smoke test contra la base de datos
```

## Puesta en marcha

📖 Ver **[INICIO.md](INICIO.md)** para el paso a paso completo: crear el proyecto de
Supabase, aplicar el esquema, configurar MercadoPago, Resend y Vercel, y dejar el
backoffice listo.

En resumen:

1. Copiar las variables de entorno a `.env.local` (ver la tabla en `INICIO.md`)
2. Correr [`scripts/00-schema-completo.sql`](scripts/00-schema-completo.sql) en el
   SQL Editor de Supabase — es la fuente única del esquema y es idempotente
3. Cargar la cuenta de transferencia desde `/backoffice` antes de publicar el sitio

## Marca

La identidad (nombre, dominio, remitente de email, logo) vive en
[`lib/marca.ts`](lib/marca.ts). Es la fuente única: cambiar ahí se propaga a metadata,
emails, comprobantes y textos por defecto del sitio.

## Seguridad

- La unicidad de los números se garantiza **en Postgres**, vía
  `generar_numeros_unicos_atomico` (advisory lock por sorteo) y el trigger
  `trigger_validar_numeros_unicos`. Nunca insertar `numeros_asignados` directamente
  sin pasar por `generarNumerosUnicos()`.
- Ningún secreto va al repo: `.env.local` está en `.gitignore`. La **service_role key**
  de Supabase no se usa en este proyecto y no debe aparecer en ningún archivo.
- Los reportes `.csv` están ignorados por git porque contienen datos de compradores.
