# Guía de Inicio — Faustino Motors

> **Nunca comitees credenciales.** Todo lo secreto va en `.env.local` (ya está en
> `.gitignore`) y en las Environment Variables de Vercel. La contraseña del panel
> se define por variable de entorno, no en el código ni en este archivo.

---

## 1. Supabase — Base de datos

### 1.1 Crear el proyecto

1. Ir a [supabase.com](https://supabase.com) → **New project**
2. Elegir nombre: `faustino-motors-sorteos`
3. Elegir región: **South America (São Paulo)**
4. Guardar la contraseña de la base de datos en un gestor de contraseñas
5. Esperar que el proyecto termine de crearse (~2 min)

### 1.2 Obtener las credenciales

En el dashboard de Supabase: **Project Settings → API**

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Pegar ambos valores en `.env.local`.

> La **service_role key** no se usa en este proyecto y no debe pegarse en ningún
> archivo del repo: saltea las políticas RLS y da acceso total a la base.

### 1.3 Crear el esquema

En Supabase: **SQL Editor** → pegar y ejecutar el archivo
[`scripts/00-schema-completo.sql`](scripts/00-schema-completo.sql).

Es un único script idempotente (se puede volver a correr sin romper nada) que crea
tablas, índices, funciones, triggers, políticas RLS, buckets de storage y las claves
de configuración vacías.

Lo más crítico que instala:

- `generar_numeros_unicos_atomico` — asignación atómica de números vía advisory lock,
  garantiza que dos compradores no reciban el mismo número aunque compren al mismo tiempo
- `trigger_validar_numeros_unicos` — validación de respaldo sobre `compradores`
- `obtener_estadisticas_sorteo` y `obtener_ganadores_express_visibles` — RPCs de lectura

---

## 2. MercadoPago

1. Ir a [mercadopago.com.ar/developers](https://www.mercadopago.com.ar/developers/panel/app)
2. Crear una nueva aplicación
3. En **Credenciales de prueba** (para testear):
   - `Access Token` → `MERCADOPAGO_ACCESS_TOKEN`
   - `Public Key` → `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY`
4. Cuando estén listos para cobrar de verdad, reemplazar con las **Credenciales de producción**

### Webhook de pagos

En el panel de MercadoPago → **Webhooks** → agregar:

```
https://TU-DOMINIO.vercel.app/api/confirmar-pago
```

Tipo: **Pagos** (payment)

---

## 3. Resend — Emails de confirmación

Es el único canal de notificaciones del sistema (no hay bot de WhatsApp).

1. Ir a [resend.com](https://resend.com) → crear cuenta
2. **API Keys** → crear una clave
3. Pegar en `.env.local` como `RESEND_API_KEY`
4. **Domains** → verificar el dominio de Faustino Motors

Hasta que el dominio esté verificado, los envíos desde `@rlclimatizacion.com.ar`
van a fallar. Para probar antes de eso, usar el dominio de prueba `onboarding@resend.dev`
en `RESEND_FROM_EMAIL`.

El remitente y el nombre de marca salen de [`lib/marca.ts`](lib/marca.ts) — es la
fuente única de la identidad; cambiar ahí se propaga a metadata, emails y comprobantes.

---

## 4. Vercel — Deploy y almacenamiento de imágenes

### 4.1 Deploy

1. En [vercel.com](https://vercel.com) → **New Project** → importar el repo
2. En **Environment Variables** cargar todas las variables de la tabla de la sección 6
3. El dominio inicial será algo como `faustino-motors.vercel.app`

### 4.2 Imágenes

Las imágenes del sorteo se suben a **Vercel Blob** vía `/api/upload-image`, con el
token `BLOB_READ_WRITE_TOKEN`. Cada sorteo admite una imagen principal y hasta 8 de
carrusel (`carousel_image_1`…`carousel_image_8`).

### 4.3 Cron job (sorteo automático)

El archivo `vercel.json` ya tiene configurado el cron:

```json
"0 14 * * *"  →  todos los días a las 14:00 UTC (11:00 Argentina)
```

Llama a `/api/verificar-sorteos` con el header `Authorization: Bearer CRON_SECRET`.
Vercel lo ejecuta automáticamente en el plan gratuito (Hobby). Ese endpoint dispara
el scraper de la Quiniela Buenos Aires y busca al comprador con el número ganador.

---

## 5. Configuración inicial desde el Backoffice

Entrá a `/backoffice` con la contraseña que hayas definido en las variables de
entorno y configurá:

### Cuenta de transferencia bancaria

En **Configuración → Cuenta de transferencia**:

- **Alias**: el alias de Mercado Pago de Faustino Motors
- **Titular**: nombre completo tal como figura en la cuenta

Estos datos son exactamente lo que ve el comprador cuando elige pagar por
transferencia. **Cargalos antes de hacer pública la página** — vienen vacíos por defecto.

### Crear el primer sorteo

En **Gestionar Sorteo → Crear sorteo**: nombre, total de chances, precios y
descripciones de los packs, imagen principal y carrusel.

### Aprobar transferencias

Las compras por transferencia **no** asignan números hasta que las aprobás
manualmente en el backoffice. Las de MercadoPago se asignan solas al confirmarse el webhook.

---

## 6. Variables de entorno — resumen

| Variable | Dónde conseguirla |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_APP_URL` | URL de Vercel (o dominio propio) |
| `NEXT_PUBLIC_SITE_URL` | Dominio público, usado en metadata |
| `MERCADOPAGO_ACCESS_TOKEN` | MercadoPago Developers |
| `NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY` | MercadoPago Developers |
| `RESEND_API_KEY` | resend.com → API Keys |
| `RESEND_FROM_EMAIL` | Remitente verificado en Resend |
| `BLOB_READ_WRITE_TOKEN` | Vercel → Storage → Blob |
| `CRON_SECRET` | Inventar un string aleatorio largo |
| `TEST_EMAIL_TO` | Opcional: destino por defecto de `/api/test-email` |

---

## 7. Comandos útiles (desarrollo local)

```bash
pnpm dev                    # Servidor de desarrollo en localhost:3000
pnpm build                  # Build de producción
pnpm run prueba-rapida      # Smoke test contra la base de datos
pnpm run verificar-sorteos  # Correr manualmente la verificación de sorteos
pnpm run scrapper           # Correr el scraper de la Quiniela a mano
```

---

## 8. Contacto del desarrollador

Si hay dudas técnicas: [De Weert Studio](https://linktr.ee/deweertstudio)
