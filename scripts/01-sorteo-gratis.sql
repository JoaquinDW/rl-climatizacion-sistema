-- ============================================================================
-- SORTEO GRATIS · MIGRACIÓN INCREMENTAL
-- ============================================================================
-- Habilita el modo "sorteo gratuito": el admin prende un switch en el
-- backoffice y la landing deja de pedir plata (sin precio, sin alias/CBU y
-- sin comprobante). Las participaciones igual quedan pendientes de aprobación
-- manual, porque los requisitos reales (seguir las redes, compartir) se
-- verifican a mano.
--
-- CÓMO APLICARLO
--   1. Entrá a https://supabase.com/dashboard y abrí tu proyecto
--   2. Menú lateral → "SQL Editor" → "New query"
--   3. Pegá este archivo completo y apretá "Run"
--
-- Es idempotente: se puede correr más de una vez sin romper nada.
--
-- Ya está incluido en scripts/00-schema-completo.sql. Este archivo existe
-- sólo para bases que YA están en producción y no se quieren re-correr enteras.
-- ============================================================================


-- ── 1. Flag de sorteo gratuito ──────────────────────────────────────────────
ALTER TABLE sorteos ADD COLUMN IF NOT EXISTS es_gratis BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN sorteos.es_gratis IS
  'true = sorteo gratuito: no se cobra, no se pide comprobante y los packs no muestran precio.';


-- ── 2. Una sola participación gratis por email por sorteo ───────────────────
-- El filtro por metodo_pago deja intactas las compras pagas: ahí sí se puede
-- comprar varias veces con el mismo email.
CREATE UNIQUE INDEX IF NOT EXISTS idx_compradores_gratis_email_unico
  ON compradores (sorteo_id, lower(email))
  WHERE metodo_pago = 'gratis';

COMMENT ON COLUMN compradores.metodo_pago IS
  'mercadopago | transferencia | gratis';


-- ── 3. Verificación ─────────────────────────────────────────────────────────
-- Debe devolver una fila con la columna es_gratis
SELECT column_name, data_type, column_default
  FROM information_schema.columns
 WHERE table_name = 'sorteos' AND column_name = 'es_gratis';

-- Debe devolver el índice único
SELECT indexname
  FROM pg_indexes
 WHERE tablename = 'compradores'
   AND indexname = 'idx_compradores_gratis_email_unico';
