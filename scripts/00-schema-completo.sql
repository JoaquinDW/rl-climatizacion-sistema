-- ============================================================================
-- RL CLIMATIZACIÓN · SISTEMA DE SORTEOS · SCHEMA COMPLETO
-- ============================================================================
-- Consolida las 32 migraciones incrementales (01–30) en un único script.
-- Reemplaza a todas: NO hace falta correr ninguna otra.
--
-- CÓMO APLICARLO EN UN PROYECTO SUPABASE NUEVO
--   1. Entrá a https://supabase.com/dashboard y abrí tu proyecto
--   2. Menú lateral → "SQL Editor" → "New query"
--   3. Pegá este archivo completo y apretá "Run"
--   4. Verificá el resultado con las consultas del final del archivo
--
-- Es idempotente: se puede correr más de una vez sin romper nada
-- (todo usa IF NOT EXISTS / OR REPLACE / DROP POLICY IF EXISTS).
--
-- QUÉ NO INCLUYE, A PROPÓSITO
--   · Los datos de ejemplo del cliente anterior (sorteo "T-SHIRT 150M",
--     el ganador de muestra, las descripciones de packs "Honda Wave").
--     La base arranca vacía: el sorteo se crea desde /backoffice.
--   · Los scripts de reparación de duplicados de una sola vez
--     (02-fix / 03-fix). Sus funciones de DIAGNÓSTICO sí están, porque
--     /api/health/duplicados y scripts/fix-duplicates.ts las usan.
--   · La tabla whatsapp_envios y la config de costo/margen: este cliente
--     no tiene bot de WhatsApp, las notificaciones van solo por email.
--
-- ORDEN DEL ARCHIVO
--   1. Extensiones          5. Triggers
--   2. Tablas               6. Row Level Security
--   3. Índices              7. Storage (buckets y políticas)
--   4. Funciones            8. Datos iniciales + verificación
-- ============================================================================


-- ============================================================================
-- 1. EXTENSIONES
-- ============================================================================
-- gen_random_uuid() viene de pgcrypto (ya activa en Supabase por defecto).
-- Se usa gen_random_uuid() en todas las tablas, en lugar del
-- uuid_generate_v4() de uuid-ossp que usaba la migración 15.
CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ============================================================================
-- 2. TABLAS
-- ============================================================================

-- ── sorteos ─────────────────────────────────────────────────────────────────
-- Cada fila es un sorteo. Sólo uno debería estar en estado 'activo' a la vez.
-- Estados: activo → completo → sorteado. 'cerrado' es un cierre manual.
CREATE TABLE IF NOT EXISTS sorteos (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre                   VARCHAR(255) NOT NULL,
  descripcion              TEXT,
  total_chances            INTEGER NOT NULL DEFAULT 9999,
  estado                   VARCHAR(50) DEFAULT 'activo',

  -- Premio principal. La columna se llama titulo_remera por herencia del
  -- proyecto original (era un sorteo de indumentaria); hoy guarda el nombre
  -- del premio, sea un split, un aire acondicionado o lo que sea.
  titulo_remera            VARCHAR(255) NOT NULL DEFAULT 'Premio principal',

  -- Imágenes
  imagen_url               TEXT,
  carousel_image_1         TEXT,
  carousel_image_2         TEXT,
  carousel_image_3         TEXT,
  carousel_image_4         TEXT,
  carousel_image_5         TEXT,
  carousel_image_6         TEXT,
  carousel_image_7         TEXT,
  carousel_image_8         TEXT,

  -- Packs 1 a 3. Los precios conservan los nombres originales
  -- (precio_6_chances etc.) aunque la cantidad ahora sea configurable.
  cantidad_pack_1          INTEGER NOT NULL DEFAULT 6,
  precio_6_chances         INTEGER NOT NULL DEFAULT 21000,
  pack_1_visible           BOOLEAN DEFAULT true,
  descripcion_pack_1       TEXT DEFAULT '',

  cantidad_pack_2          INTEGER NOT NULL DEFAULT 12,
  precio_12_chances        INTEGER NOT NULL DEFAULT 42000,
  pack_2_visible           BOOLEAN DEFAULT true,
  descripcion_pack_2       TEXT DEFAULT '',

  cantidad_pack_3          INTEGER NOT NULL DEFAULT 24,
  precio_24_chances        INTEGER NOT NULL DEFAULT 84000,
  pack_3_visible           BOOLEAN DEFAULT true,
  descripcion_pack_3       TEXT DEFAULT '',

  -- Packs 4 y 5: opcionales, ocultos por defecto
  cantidad_pack_4          INTEGER DEFAULT 0,
  precio_pack_4            INTEGER DEFAULT 0,
  pack_4_visible           BOOLEAN DEFAULT false,
  descripcion_pack_4       TEXT DEFAULT '',

  cantidad_pack_5          INTEGER DEFAULT 0,
  precio_pack_5            INTEGER DEFAULT 0,
  pack_5_visible           BOOLEAN DEFAULT false,
  descripcion_pack_5       TEXT DEFAULT '',

  -- Sorteo gratuito: no se cobra nada. La landing oculta precios, alias y
  -- comprobante, y las participaciones entran con precio_pagado = 0.
  es_gratis                BOOLEAN NOT NULL DEFAULT false,

  -- Fechas
  fecha_sorteo             DATE,
  fecha_cierre_ventas      TIMESTAMPTZ,
  fecha_sorteo_programada  TIMESTAMPTZ,
  fecha_sorteo_realizado   TIMESTAMPTZ,

  -- Resultado
  ganador_id               UUID,
  ganador_nombre           TEXT,
  numero_ganador           INTEGER,

  created_at               TIMESTAMPTZ DEFAULT NOW(),
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON COLUMN sorteos.estado IS
  'Estados: activo, completo, sorteado, cerrado';
COMMENT ON COLUMN sorteos.titulo_remera IS
  'Nombre del premio principal. Aparece en el hero y en la sección de premios.';
COMMENT ON COLUMN sorteos.fecha_cierre_ventas IS
  'Momento en que se dejan de aceptar compras. NULL = sin cierre programado.';
COMMENT ON COLUMN sorteos.fecha_sorteo_programada IS
  'Fecha y hora en que se realiza el sorteo (informativo). NULL = a definir.';

-- CREATE TABLE IF NOT EXISTS no agrega columnas a una tabla que ya existe:
-- este ALTER es lo que hace que el schema siga siendo re-ejecutable sobre
-- bases creadas antes de que existiera el modo gratis.
ALTER TABLE sorteos ADD COLUMN IF NOT EXISTS es_gratis BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN sorteos.es_gratis IS
  'true = sorteo gratuito: no se cobra, no se pide comprobante y los packs no muestran precio.';


-- ── compradores ─────────────────────────────────────────────────────────────
-- Cada fila es una compra. Borrar una fila libera sus números
-- automáticamente: no hay tabla aparte de números.
CREATE TABLE IF NOT EXISTS compradores (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sorteo_id             UUID REFERENCES sorteos(id) ON DELETE CASCADE,
  nombre                VARCHAR(255) NOT NULL,

  -- Contacto: al menos uno de email / telefono / instagram_username
  email                 VARCHAR(255),
  telefono              TEXT,
  instagram_username    VARCHAR(255),

  cantidad_chances      INTEGER NOT NULL,
  numeros_asignados     INTEGER[] NOT NULL,
  precio_pagado         INTEGER NOT NULL,

  -- Pago
  estado_pago           VARCHAR(50) DEFAULT 'pendiente',
  metodo_pago           VARCHAR(20) DEFAULT 'mercadopago',
  mercadopago_id        VARCHAR(255),

  -- Transferencia bancaria: los números se asignan sólo al aprobarla
  comprobante_url       VARCHAR(500),
  estado_transferencia  VARCHAR(20),
  fecha_transferencia   TIMESTAMP,
  admin_revisor         VARCHAR(100),
  notas_admin           TEXT,

  es_ganador            BOOLEAN DEFAULT FALSE,

  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- La FK de sorteos.ganador_id se agrega acá porque apunta a compradores,
-- que se crea después que sorteos.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'sorteos_ganador_id_fkey'
  ) THEN
    ALTER TABLE sorteos
      ADD CONSTRAINT sorteos_ganador_id_fkey
      FOREIGN KEY (ganador_id) REFERENCES compradores(id);
  END IF;
END $$;

-- NOTA: lib/supabase.ts declara además un campo `celular?: string` en la
-- interfaz Comprador, y realizarSorteoDiario() lo lee como fallback de
-- contacto. Esa columna NUNCA existió: ninguna de las 32 migraciones
-- originales la creaba. Se deja fuera a propósito para no inventar schema;
-- en la práctica ese fallback siempre fue código muerto. Si se quiere el
-- dato, hay que agregar la columna Y cargarla en el flujo de compra.

COMMENT ON COLUMN compradores.email IS
  'Email del comprador (opcional, pero es el canal de notificación principal).';
COMMENT ON COLUMN compradores.telefono IS
  'Teléfono/WhatsApp del comprador. Se usa para armar links wa.me manuales.';
COMMENT ON COLUMN compradores.instagram_username IS
  'Usuario de Instagram (sin @), si eligió Instagram en lugar de WhatsApp.';
COMMENT ON COLUMN compradores.estado_pago IS
  'pendiente | pagado | cancelado | expirado';
COMMENT ON COLUMN compradores.metodo_pago IS
  'mercadopago | transferencia | gratis';
COMMENT ON COLUMN compradores.estado_transferencia IS
  'pendiente | aprobado | rechazado (sólo para metodo_pago = transferencia)';


-- ── configuracion ───────────────────────────────────────────────────────────
-- Almacén key-value. Guarda los datos de la cuenta bancaria, el JSON de
-- textos del sitio (clave contenido_sitio) y la promo diaria (promo_diaria_*).
CREATE TABLE IF NOT EXISTS configuracion (
  clave       VARCHAR(100) PRIMARY KEY,
  valor       TEXT NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);


-- ── ganadores_pasados ───────────────────────────────────────────────────────
-- Histórico de ganadores con fotos. Hoy la landing muestra mural_ganadores
-- en su lugar, pero la tabla y el componente siguen disponibles.
CREATE TABLE IF NOT EXISTS ganadores_pasados (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_ganador  TEXT NOT NULL,
  premio          TEXT NOT NULL,
  precio_premio   TEXT NOT NULL,
  fecha_sorteo    DATE NOT NULL,
  numero_ganador  INTEGER NOT NULL,
  imagen_1_url    TEXT,
  imagen_2_url    TEXT,
  imagen_3_url    TEXT,
  orden           INTEGER NOT NULL DEFAULT 0,
  visible         BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
  updated_at      TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);


-- ── ganadores_express ───────────────────────────────────────────────────────
-- Premios instantáneos: números que ganan al momento de comprarse.
CREATE TABLE IF NOT EXISTS ganadores_express (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sorteo_id       UUID REFERENCES sorteos(id) ON DELETE CASCADE,
  numero_ganador  INTEGER NOT NULL,
  nombre_ganador  TEXT,
  premio_monto    TEXT NOT NULL,
  fecha_premio    DATE NOT NULL DEFAULT CURRENT_DATE,
  visible         BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE ganadores_express IS
  'Ganadores de premios express/instantáneos del sorteo';
COMMENT ON COLUMN ganadores_express.premio_monto IS
  'Descripción del premio (ej: "$500", "$10.000")';


-- ── mural_ganadores ─────────────────────────────────────────────────────────
-- Collage de fotos de ganadores anteriores. Una fila = una foto.
CREATE TABLE IF NOT EXISTS mural_ganadores (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imagen_url  TEXT NOT NULL,
  nombre      TEXT,
  orden       INTEGER NOT NULL DEFAULT 0,
  visible     BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE mural_ganadores IS
  'Mural/collage de fotos de ganadores anteriores, administrado desde el backoffice';
COMMENT ON COLUMN mural_ganadores.orden IS
  'Orden de aparición en el mural (menor primero)';


-- ── sorteos_diarios ─────────────────────────────────────────────────────────
-- Sortea un premio entre quienes compraron un día determinado (todos, o
-- sólo los primeros X). El ganador se elige al azar entre los pagados.
-- La card promocional de la landing vive en configuracion (promo_diaria_*).
CREATE TABLE IF NOT EXISTS sorteos_diarios (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sorteo_id               UUID NOT NULL REFERENCES sorteos(id) ON DELETE CASCADE,
  fecha                   DATE NOT NULL,
  tipo_participantes      TEXT NOT NULL DEFAULT 'todos',
  cantidad_participantes  INTEGER,
  premio                  TEXT NOT NULL,
  total_participantes     INTEGER NOT NULL DEFAULT 0,
  ganador_comprador_id    UUID REFERENCES compradores(id) ON DELETE SET NULL,
  ganador_nombre          TEXT,
  ganador_numero          INTEGER,
  -- Snapshot del contacto del ganador: sobrevive al borrado del comprador.
  -- Puede ser un teléfono, un @usuario de Instagram o un email.
  ganador_contacto        TEXT,
  visible                 BOOLEAN NOT NULL DEFAULT true,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN sorteos_diarios.tipo_participantes IS 'todos | primeros_x';


-- ============================================================================
-- 3. ÍNDICES
-- ============================================================================

-- compradores
CREATE INDEX IF NOT EXISTS idx_compradores_sorteo_id
  ON compradores(sorteo_id);
CREATE INDEX IF NOT EXISTS idx_compradores_email
  ON compradores(email);
CREATE INDEX IF NOT EXISTS idx_compradores_estado_pago
  ON compradores(estado_pago);
CREATE INDEX IF NOT EXISTS idx_compradores_ganador
  ON compradores(es_ganador);
CREATE INDEX IF NOT EXISTS idx_compradores_comprobante_url
  ON compradores(comprobante_url);
-- Compuesto: el filtro más usado de toda la app
CREATE INDEX IF NOT EXISTS idx_compradores_sorteo_estado
  ON compradores(sorteo_id, estado_pago);
-- GIN: búsquedas dentro del array de números asignados
CREATE INDEX IF NOT EXISTS idx_compradores_numeros_asignados
  ON compradores USING GIN (numeros_asignados);
-- Una sola participación gratis por email por sorteo. El filtro por
-- metodo_pago deja intactas las compras pagas (ahí sí se puede comprar
-- varias veces con el mismo email).
CREATE UNIQUE INDEX IF NOT EXISTS idx_compradores_gratis_email_unico
  ON compradores (sorteo_id, lower(email))
  WHERE metodo_pago = 'gratis';

-- sorteos
CREATE INDEX IF NOT EXISTS idx_sorteos_estado
  ON sorteos(estado);
CREATE INDEX IF NOT EXISTS idx_sorteos_estado_activo
  ON sorteos(estado) WHERE estado = 'activo';
CREATE INDEX IF NOT EXISTS idx_sorteos_imagen_url
  ON sorteos(imagen_url);
CREATE INDEX IF NOT EXISTS idx_sorteos_carousel_images
  ON sorteos(carousel_image_1, carousel_image_2, carousel_image_3);

-- ganadores_pasados
CREATE INDEX IF NOT EXISTS idx_ganadores_pasados_orden
  ON ganadores_pasados(orden DESC);
CREATE INDEX IF NOT EXISTS idx_ganadores_pasados_visible
  ON ganadores_pasados(visible);
CREATE INDEX IF NOT EXISTS idx_ganadores_pasados_visible_orden
  ON ganadores_pasados(visible, orden DESC) WHERE visible = true;

-- ganadores_express
CREATE INDEX IF NOT EXISTS idx_ganadores_express_sorteo
  ON ganadores_express(sorteo_id);
CREATE INDEX IF NOT EXISTS idx_ganadores_express_numero
  ON ganadores_express(numero_ganador);
CREATE INDEX IF NOT EXISTS idx_ganadores_express_visible
  ON ganadores_express(visible);
CREATE INDEX IF NOT EXISTS idx_ganadores_express_created
  ON ganadores_express(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ganadores_express_sorteo_visible
  ON ganadores_express(sorteo_id, visible) WHERE visible = true;

-- mural_ganadores
CREATE INDEX IF NOT EXISTS idx_mural_ganadores_visible
  ON mural_ganadores(visible);
CREATE INDEX IF NOT EXISTS idx_mural_ganadores_orden
  ON mural_ganadores(orden ASC);

-- sorteos_diarios
CREATE INDEX IF NOT EXISTS idx_sorteos_diarios_sorteo_id
  ON sorteos_diarios(sorteo_id);
CREATE INDEX IF NOT EXISTS idx_sorteos_diarios_fecha
  ON sorteos_diarios(fecha DESC);


-- ============================================================================
-- 4. FUNCIONES
-- ============================================================================

-- ── 4.1 updated_at automático ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ── 4.2 generar_numeros_unicos_atomico ──────────────────────────────────────
-- EL CORAZÓN DEL SISTEMA. Genera N números libres de forma atómica.
-- Usa un advisory lock (no FOR UPDATE: con unnest() Postgres lo rechaza,
-- que era el bug que arreglaba la migración 18) para que dos compras
-- simultáneas no puedan recibir el mismo número.
--
-- NUNCA insertar numeros_asignados sin pasar por esta función.
CREATE OR REPLACE FUNCTION generar_numeros_unicos_atomico(
  p_sorteo_id UUID,
  p_cantidad INTEGER
)
RETURNS INTEGER[] AS $$
DECLARE
  v_numeros_ocupados INTEGER[];
  v_numeros_disponibles INTEGER[];
  v_numeros_seleccionados INTEGER[] := ARRAY[]::INTEGER[];
  v_total_chances INTEGER;
  v_random_index INTEGER;
  v_lock_acquired BOOLEAN;
BEGIN
  -- Advisory lock por sorteo: serializa la generación de números.
  SELECT pg_try_advisory_xact_lock(hashtext(p_sorteo_id::text)) INTO v_lock_acquired;

  IF NOT v_lock_acquired THEN
    RAISE EXCEPTION 'No se pudo obtener el lock para el sorteo. Intenta nuevamente.';
  END IF;

  SELECT total_chances INTO v_total_chances
  FROM sorteos
  WHERE id = p_sorteo_id;

  IF v_total_chances IS NULL THEN
    v_total_chances := 9999;
  END IF;

  -- Números ya tomados por compras pagadas
  WITH numeros_expandidos AS (
    SELECT DISTINCT unnest(c.numeros_asignados) as numero
    FROM compradores c
    WHERE c.sorteo_id = p_sorteo_id
      AND c.estado_pago = 'pagado'
  )
  SELECT COALESCE(array_agg(numero ORDER BY numero), ARRAY[]::INTEGER[])
  INTO v_numeros_ocupados
  FROM numeros_expandidos;

  SELECT array_agg(num ORDER BY num)
  INTO v_numeros_disponibles
  FROM generate_series(0, v_total_chances) AS num
  WHERE num != ALL(v_numeros_ocupados);

  IF array_length(v_numeros_disponibles, 1) IS NULL
     OR array_length(v_numeros_disponibles, 1) < p_cantidad THEN
    RAISE EXCEPTION 'No hay suficientes números disponibles. Solicitados: %, Disponibles: %',
      p_cantidad,
      COALESCE(array_length(v_numeros_disponibles, 1), 0);
  END IF;

  -- Selección aleatoria sin reposición
  FOR i IN 1..p_cantidad LOOP
    v_random_index := 1 + floor(random() * array_length(v_numeros_disponibles, 1))::INTEGER;
    v_numeros_seleccionados := array_append(
      v_numeros_seleccionados,
      v_numeros_disponibles[v_random_index]
    );
    v_numeros_disponibles := array_cat(
      v_numeros_disponibles[1:v_random_index-1],
      v_numeros_disponibles[v_random_index+1:array_length(v_numeros_disponibles, 1)]
    );
  END LOOP;

  SELECT array_agg(num ORDER BY num)
  INTO v_numeros_seleccionados
  FROM unnest(v_numeros_seleccionados) AS num;

  -- Red de contención: si aun así se colara un duplicado, se reemplaza
  -- en lugar de fallar la compra.
  DECLARE
    v_duplicados_encontrados INTEGER[];
    v_numeros_buenos INTEGER[];
    v_cantidad_reemplazar INTEGER;
    v_numeros_reemplazo INTEGER[];
    v_todos_ocupados INTEGER[];
  BEGIN
    SELECT array_agg(DISTINCT numero)
    INTO v_duplicados_encontrados
    FROM (
      SELECT unnest(c.numeros_asignados) as numero
      FROM compradores c
      WHERE c.sorteo_id = p_sorteo_id
        AND c.estado_pago = 'pagado'
    ) AS todos_los_numeros
    WHERE numero = ANY(v_numeros_seleccionados);

    IF v_duplicados_encontrados IS NOT NULL
       AND array_length(v_duplicados_encontrados, 1) > 0 THEN
      RAISE WARNING 'Se detectaron duplicados %, regenerando números...', v_duplicados_encontrados;

      SELECT array_agg(num)
      INTO v_numeros_buenos
      FROM unnest(v_numeros_seleccionados) num
      WHERE num != ALL(v_duplicados_encontrados);

      v_cantidad_reemplazar := array_length(v_duplicados_encontrados, 1);

      SELECT array_agg(DISTINCT numero)
      INTO v_todos_ocupados
      FROM (
        SELECT unnest(c.numeros_asignados) as numero
        FROM compradores c
        WHERE c.sorteo_id = p_sorteo_id AND c.estado_pago = 'pagado'
        UNION
        SELECT unnest(COALESCE(v_numeros_buenos, ARRAY[]::INTEGER[])) as numero
      ) sub;

      SELECT array_agg(num ORDER BY random())
      INTO v_numeros_reemplazo
      FROM generate_series(0, v_total_chances) AS num
      WHERE num != ALL(v_todos_ocupados)
      LIMIT v_cantidad_reemplazar;

      IF array_length(v_numeros_reemplazo, 1) < v_cantidad_reemplazar THEN
        RAISE EXCEPTION 'No hay suficientes números disponibles para reemplazar duplicados';
      END IF;

      v_numeros_seleccionados :=
        COALESCE(v_numeros_buenos, ARRAY[]::INTEGER[]) || v_numeros_reemplazo;

      SELECT array_agg(num ORDER BY num)
      INTO v_numeros_seleccionados
      FROM unnest(v_numeros_seleccionados) num;

      RAISE WARNING 'Duplicados reemplazados. Nuevos números: %', v_numeros_seleccionados;
    END IF;
  END;

  RETURN v_numeros_seleccionados;
  -- El advisory lock se libera solo al terminar la transacción.
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generar_numeros_unicos_atomico IS
'Genera números únicos para un sorteo de forma atómica usando advisory locks.';


-- ── 4.3 validar_numeros_unicos_antes_cambio ─────────────────────────────────
-- Última línea de defensa. Corre como trigger antes de cada INSERT/UPDATE
-- de compradores y aborta si detecta números repetidos, tanto contra otros
-- compradores como dentro del propio array.
CREATE OR REPLACE FUNCTION validar_numeros_unicos_antes_cambio()
RETURNS TRIGGER AS $$
DECLARE
  v_numeros_duplicados INTEGER[];
  v_total_duplicados INTEGER;
BEGIN
  IF NEW.estado_pago = 'pagado' AND array_length(NEW.numeros_asignados, 1) > 0 THEN

    -- ¿Alguno de estos números ya lo tiene otro comprador del mismo sorteo?
    SELECT array_agg(DISTINCT numero)
    INTO v_numeros_duplicados
    FROM (
      SELECT unnest(numeros_asignados) as numero
      FROM compradores
      WHERE sorteo_id = NEW.sorteo_id
        AND estado_pago = 'pagado'
        AND id != NEW.id
    ) AS numeros_existentes
    WHERE numero = ANY(NEW.numeros_asignados);

    IF v_numeros_duplicados IS NOT NULL THEN
      v_total_duplicados := array_length(v_numeros_duplicados, 1);
      RAISE EXCEPTION
        'VALIDACIÓN FALLIDA: Se detectaron % número(s) duplicado(s) en el sorteo %: %. Operación ABORTADA.',
        v_total_duplicados, NEW.sorteo_id, v_numeros_duplicados
        USING ERRCODE = '23505';
    END IF;

    -- ¿Hay repetidos dentro del mismo array?
    WITH numeros_del_comprador AS (
      SELECT unnest(NEW.numeros_asignados) as numero
    )
    SELECT array_agg(numero)
    INTO v_numeros_duplicados
    FROM numeros_del_comprador
    GROUP BY numero
    HAVING COUNT(*) > 1;

    IF v_numeros_duplicados IS NOT NULL THEN
      RAISE EXCEPTION
        'VALIDACIÓN FALLIDA: El comprador % tiene números DUPLICADOS INTERNAMENTE: %. Operación ABORTADA.',
        NEW.id, v_numeros_duplicados
        USING ERRCODE = '23505';
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validar_numeros_unicos_antes_cambio() IS
'Aborta INSERT/UPDATE de compradores si detecta números duplicados
(contra otros compradores o dentro del propio array).';


-- ── 4.4 Estadísticas (reducción de egress) ──────────────────────────────────
-- Calculan en el servidor lo que antes se hacía trayendo todos los
-- compradores al cliente.

CREATE OR REPLACE FUNCTION obtener_estadisticas_sorteo(sorteo_id_param UUID)
RETURNS TABLE (
  total_compradores BIGINT,
  chances_vendidas BIGINT,
  total_recaudado NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(DISTINCT id)::BIGINT as total_compradores,
    (SELECT COUNT(DISTINCT numero)::BIGINT
     FROM compradores c, unnest(c.numeros_asignados) AS numero
     WHERE c.sorteo_id = sorteo_id_param AND c.estado_pago = 'pagado')::BIGINT
       as chances_vendidas,
    COALESCE(SUM(precio_pagado), 0)::NUMERIC as total_recaudado
  FROM compradores
  WHERE sorteo_id = sorteo_id_param
    AND estado_pago = 'pagado';
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION obtener_estadisticas_sorteo IS
'Calcula estadísticas del sorteo en el servidor para reducir egress.';


CREATE OR REPLACE FUNCTION contar_compradores_sorteo(
  sorteo_id_param UUID,
  solo_pagados BOOLEAN DEFAULT TRUE
)
RETURNS BIGINT AS $$
BEGIN
  IF solo_pagados THEN
    RETURN (SELECT COUNT(*)::BIGINT FROM compradores
            WHERE sorteo_id = sorteo_id_param AND estado_pago = 'pagado');
  ELSE
    RETURN (SELECT COUNT(*)::BIGINT FROM compradores
            WHERE sorteo_id = sorteo_id_param);
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;


CREATE OR REPLACE FUNCTION contar_chances_vendidas(sorteo_id_param UUID)
RETURNS BIGINT AS $$
BEGIN
  RETURN (
    SELECT COUNT(DISTINCT numero)::BIGINT
    FROM compradores c, unnest(c.numeros_asignados) AS numero
    WHERE c.sorteo_id = sorteo_id_param AND c.estado_pago = 'pagado'
  );
END;
$$ LANGUAGE plpgsql STABLE;


CREATE OR REPLACE FUNCTION verificar_sorteo_completo(sorteo_id_param UUID)
RETURNS TABLE (
  completo BOOLEAN,
  total_chances INTEGER,
  chances_vendidas BIGINT,
  porcentaje_vendido NUMERIC
) AS $$
DECLARE
  total_chances_sorteo INTEGER;
  chances_vendidas_count BIGINT;
BEGIN
  SELECT s.total_chances INTO total_chances_sorteo
  FROM sorteos s WHERE s.id = sorteo_id_param;

  SELECT contar_chances_vendidas(sorteo_id_param) INTO chances_vendidas_count;

  RETURN QUERY
  SELECT
    (chances_vendidas_count >= total_chances_sorteo) as completo,
    total_chances_sorteo as total_chances,
    chances_vendidas_count as chances_vendidas,
    CASE WHEN total_chances_sorteo > 0
      THEN ROUND((chances_vendidas_count::NUMERIC / total_chances_sorteo::NUMERIC * 100), 2)
      ELSE 0
    END as porcentaje_vendido;
END;
$$ LANGUAGE plpgsql STABLE;


CREATE OR REPLACE FUNCTION obtener_ganadores_express_visibles(
  sorteo_id_param UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  numero_ganador INTEGER,
  nombre_ganador TEXT,
  premio_monto TEXT,
  fecha_premio DATE,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  IF sorteo_id_param IS NULL THEN
    -- Sin sorteo indicado: los del sorteo activo
    RETURN QUERY
    SELECT ge.id, ge.numero_ganador, ge.nombre_ganador,
           ge.premio_monto, ge.fecha_premio, ge.created_at
    FROM ganadores_express ge
    INNER JOIN sorteos s ON ge.sorteo_id = s.id
    WHERE ge.visible = true AND s.estado = 'activo'
    ORDER BY ge.created_at DESC;
  ELSE
    RETURN QUERY
    SELECT ge.id, ge.numero_ganador, ge.nombre_ganador,
           ge.premio_monto, ge.fecha_premio, ge.created_at
    FROM ganadores_express ge
    WHERE ge.sorteo_id = sorteo_id_param AND ge.visible = true
    ORDER BY ge.created_at DESC;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;


CREATE OR REPLACE FUNCTION obtener_resumen_sorteo_activo()
RETURNS TABLE (
  sorteo_id UUID,
  sorteo_nombre TEXT,
  total_chances INTEGER,
  estado TEXT,
  total_compradores BIGINT,
  chances_vendidas BIGINT,
  total_recaudado NUMERIC,
  porcentaje_completado NUMERIC,
  cantidad_ganadores_express BIGINT
) AS $$
DECLARE
  v_sorteo_activo_id UUID;
  v_total_chances INTEGER;
BEGIN
  SELECT s.id, s.total_chances INTO v_sorteo_activo_id, v_total_chances
  FROM sorteos s
  WHERE s.estado = 'activo'
  ORDER BY s.created_at DESC
  LIMIT 1;

  IF v_sorteo_activo_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH stats AS (
    SELECT * FROM obtener_estadisticas_sorteo(v_sorteo_activo_id)
  ),
  ganadores_count AS (
    SELECT COUNT(*)::BIGINT as total
    FROM ganadores_express
    WHERE ganadores_express.sorteo_id = v_sorteo_activo_id AND visible = true
  )
  SELECT
    v_sorteo_activo_id,
    s.nombre::TEXT,
    s.total_chances,
    s.estado::TEXT,
    stats.total_compradores,
    stats.chances_vendidas,
    stats.total_recaudado,
    CASE WHEN s.total_chances > 0
      THEN ROUND((stats.chances_vendidas::NUMERIC / s.total_chances::NUMERIC * 100), 2)
      ELSE 0
    END as porcentaje_completado,
    ganadores_count.total as cantidad_ganadores_express
  FROM sorteos s, stats, ganadores_count
  WHERE s.id = v_sorteo_activo_id;
END;
$$ LANGUAGE plpgsql STABLE;


-- ── 4.5 Diagnóstico de duplicados ───────────────────────────────────────────
-- Las usan /api/health/duplicados, lib/verificarFuncionesSQL.ts y
-- scripts/fix-duplicates.ts. Son de sólo lectura: no modifican nada.

CREATE OR REPLACE FUNCTION diagnosticar_duplicados_rapido(p_sorteo_id UUID)
RETURNS TABLE(
  total_numeros_asignados BIGINT,
  numeros_unicos BIGINT,
  numeros_duplicados BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH numeros_expandidos AS (
    SELECT unnest(numeros_asignados) as numero
    FROM compradores
    WHERE sorteo_id = p_sorteo_id
      AND estado_pago = 'pagado'
  )
  SELECT
    COUNT(*)::BIGINT as total_numeros,
    COUNT(DISTINCT numero)::BIGINT as unicos,
    (COUNT(*) - COUNT(DISTINCT numero))::BIGINT as duplicados
  FROM numeros_expandidos;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION diagnosticar_duplicados(p_sorteo_id UUID DEFAULT NULL)
RETURNS TABLE(
  sorteo_id UUID,
  total_numeros_asignados BIGINT,
  numeros_unicos BIGINT,
  numeros_duplicados BIGINT,
  compradores_afectados BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH numeros_expandidos AS (
    SELECT
      c.sorteo_id,
      c.id as comprador_id,
      unnest(c.numeros_asignados) as numero
    FROM compradores c
    WHERE c.estado_pago = 'pagado'
      AND (p_sorteo_id IS NULL OR c.sorteo_id = p_sorteo_id)
  ),
  stats AS (
    SELECT
      ne.sorteo_id,
      COUNT(*) as total_numeros,
      COUNT(DISTINCT ne.numero) as unicos,
      COUNT(*) - COUNT(DISTINCT ne.numero) as duplicados,
      COUNT(DISTINCT CASE
        WHEN ne.numero IN (
          SELECT numero FROM numeros_expandidos ne2
          WHERE ne2.sorteo_id = ne.sorteo_id
          GROUP BY numero HAVING COUNT(*) > 1
        ) THEN ne.comprador_id
      END) as compradores_afect
    FROM numeros_expandidos ne
    GROUP BY ne.sorteo_id
  )
  SELECT s.sorteo_id, s.total_numeros, s.unicos, s.duplicados, s.compradores_afect
  FROM stats s;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION obtener_compradores_con_duplicados(p_sorteo_id UUID)
RETURNS TABLE(
  comprador_id UUID,
  comprador_nombre TEXT,
  numeros_duplicados INTEGER[],
  numeros_unicos INTEGER[],
  fecha_compra TIMESTAMPTZ,
  debe_mantener BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH numeros_expandidos AS (
    SELECT
      c.id as comprador_id,
      c.nombre,
      c.created_at,
      c.numeros_asignados,
      unnest(c.numeros_asignados) as numero
    FROM compradores c
    WHERE c.sorteo_id = p_sorteo_id
      AND c.estado_pago = 'pagado'
  ),
  numeros_duplicados_list AS (
    SELECT numero FROM numeros_expandidos
    GROUP BY numero HAVING COUNT(*) > 1
  ),
  primer_comprador_por_numero AS (
    SELECT DISTINCT ON (ne.numero)
      ne.numero,
      ne.comprador_id as primer_comprador_id,
      ne.created_at
    FROM numeros_expandidos ne
    WHERE ne.numero IN (SELECT numero FROM numeros_duplicados_list)
    ORDER BY ne.numero, ne.created_at ASC
  )
  SELECT DISTINCT
    ne.comprador_id,
    ne.nombre::TEXT,
    array_agg(DISTINCT ne.numero ORDER BY ne.numero) FILTER (
      WHERE ne.numero IN (SELECT numero FROM numeros_duplicados_list)
    ) as nums_duplicados,
    array_agg(DISTINCT ne.numero ORDER BY ne.numero) FILTER (
      WHERE ne.numero NOT IN (SELECT numero FROM numeros_duplicados_list)
    ) as nums_unicos,
    ne.created_at,
    -- Mantiene sus números quien llegó primero a TODOS sus duplicados
    bool_and(
      CASE
        WHEN ne.numero IN (SELECT numero FROM numeros_duplicados_list)
        THEN ne.comprador_id = (
          SELECT primer_comprador_id FROM primer_comprador_por_numero
          WHERE numero = ne.numero
        )
        ELSE true
      END
    ) as debe_mantener
  FROM numeros_expandidos ne
  WHERE ne.numero IN (SELECT numero FROM numeros_duplicados_list)
  GROUP BY ne.comprador_id, ne.nombre, ne.created_at;
END;
$$ LANGUAGE plpgsql;


CREATE OR REPLACE FUNCTION obtener_numeros_disponibles_para_reasignacion(
  p_sorteo_id UUID
)
RETURNS TABLE(numero INTEGER) AS $$
DECLARE
  v_total_chances INTEGER;
BEGIN
  SELECT total_chances INTO v_total_chances
  FROM sorteos WHERE id = p_sorteo_id;

  IF v_total_chances IS NULL THEN
    v_total_chances := 9999;
  END IF;

  RETURN QUERY
  WITH numeros_que_se_mantienen AS (
    SELECT DISTINCT unnest(numeros_asignados) as num
    FROM compradores c
    WHERE c.sorteo_id = p_sorteo_id
      AND c.estado_pago = 'pagado'
      AND c.id IN (
        SELECT comprador_id
        FROM obtener_compradores_con_duplicados(p_sorteo_id)
        WHERE debe_mantener = true
      )
    UNION
    SELECT DISTINCT unnest(numeros_asignados) as num
    FROM compradores c
    WHERE c.sorteo_id = p_sorteo_id
      AND c.estado_pago = 'pagado'
      AND NOT EXISTS (
        SELECT 1 FROM compradores c2
        WHERE c2.sorteo_id = p_sorteo_id
          AND c2.estado_pago = 'pagado'
          AND c2.id != c.id
          AND c.numeros_asignados && c2.numeros_asignados
      )
  )
  SELECT gs.num
  FROM generate_series(0, v_total_chances) gs(num)
  WHERE gs.num NOT IN (SELECT num FROM numeros_que_se_mantienen)
  ORDER BY gs.num;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- 5. TRIGGERS
-- ============================================================================

-- Validación de duplicados: la última línea de defensa
DROP TRIGGER IF EXISTS trigger_validar_numeros_unicos ON compradores;
CREATE TRIGGER trigger_validar_numeros_unicos
  BEFORE INSERT OR UPDATE ON compradores
  FOR EACH ROW
  EXECUTE FUNCTION validar_numeros_unicos_antes_cambio();

COMMENT ON TRIGGER trigger_validar_numeros_unicos ON compradores IS
'Previene la inserción de números duplicados. Última línea de defensa.';

-- updated_at automático
DROP TRIGGER IF EXISTS set_sorteos_updated_at ON sorteos;
CREATE TRIGGER set_sorteos_updated_at
  BEFORE UPDATE ON sorteos
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_compradores_updated_at ON compradores;
CREATE TRIGGER set_compradores_updated_at
  BEFORE UPDATE ON compradores
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_ganadores_express_updated_at ON ganadores_express;
CREATE TRIGGER set_ganadores_express_updated_at
  BEFORE UPDATE ON ganadores_express
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_ganadores_pasados_updated_at ON ganadores_pasados;
CREATE TRIGGER set_ganadores_pasados_updated_at
  BEFORE UPDATE ON ganadores_pasados
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_mural_ganadores_updated_at ON mural_ganadores;
CREATE TRIGGER set_mural_ganadores_updated_at
  BEFORE UPDATE ON mural_ganadores
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();


-- ============================================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================================
-- OJO: la app NO usa Supabase Auth. El backoffice se protege con una
-- contraseña validada en el frontend, y todo el acceso a datos va por la
-- anon key. Por eso estas políticas permiten todas las operaciones.
--
-- Consecuencia real: cualquiera con la anon key (que es pública, va en el
-- bundle del browser) puede leer y escribir estas tablas. Es el modelo que
-- traía el proyecto original. Si en algún momento se quiere endurecer, el
-- camino es mover las escrituras a route handlers con la service role key
-- y restringir estas políticas a SELECT.

ALTER TABLE sorteos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todas las operaciones en sorteos" ON sorteos;
CREATE POLICY "Permitir todas las operaciones en sorteos" ON sorteos
  FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE compradores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todas las operaciones en compradores" ON compradores;
CREATE POLICY "Permitir todas las operaciones en compradores" ON compradores
  FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todas las operaciones en configuracion" ON configuracion;
CREATE POLICY "Permitir todas las operaciones en configuracion" ON configuracion
  FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE ganadores_pasados ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Ganadores visibles son públicos" ON ganadores_pasados;
CREATE POLICY "Ganadores visibles son públicos" ON ganadores_pasados
  FOR SELECT USING (visible = true);
DROP POLICY IF EXISTS "Permitir todas las operaciones en ganadores" ON ganadores_pasados;
CREATE POLICY "Permitir todas las operaciones en ganadores" ON ganadores_pasados
  FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE ganadores_express ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ganadores_express_select_visible" ON ganadores_express;
CREATE POLICY "ganadores_express_select_visible" ON ganadores_express
  FOR SELECT USING (visible = true);
DROP POLICY IF EXISTS "ganadores_express_all_operations" ON ganadores_express;
CREATE POLICY "ganadores_express_all_operations" ON ganadores_express
  FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE mural_ganadores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mural_ganadores_select_visible" ON mural_ganadores;
CREATE POLICY "mural_ganadores_select_visible" ON mural_ganadores
  FOR SELECT USING (visible = true);
DROP POLICY IF EXISTS "mural_ganadores_all_operations" ON mural_ganadores;
CREATE POLICY "mural_ganadores_all_operations" ON mural_ganadores
  FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE sorteos_diarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir todas las operaciones en sorteos_diarios" ON sorteos_diarios;
CREATE POLICY "Permitir todas las operaciones en sorteos_diarios" ON sorteos_diarios
  FOR ALL USING (true) WITH CHECK (true);

-- Permisos de ejecución de las funciones
GRANT EXECUTE ON FUNCTION obtener_estadisticas_sorteo            TO anon, authenticated;
GRANT EXECUTE ON FUNCTION contar_compradores_sorteo              TO anon, authenticated;
GRANT EXECUTE ON FUNCTION contar_chances_vendidas                TO anon, authenticated;
GRANT EXECUTE ON FUNCTION verificar_sorteo_completo              TO anon, authenticated;
GRANT EXECUTE ON FUNCTION obtener_ganadores_express_visibles     TO anon, authenticated;
GRANT EXECUTE ON FUNCTION obtener_resumen_sorteo_activo          TO anon, authenticated;
GRANT EXECUTE ON FUNCTION generar_numeros_unicos_atomico         TO anon, authenticated;
GRANT EXECUTE ON FUNCTION diagnosticar_duplicados                TO anon, authenticated;
GRANT EXECUTE ON FUNCTION diagnosticar_duplicados_rapido         TO anon, authenticated;
GRANT EXECUTE ON FUNCTION obtener_compradores_con_duplicados     TO anon, authenticated;
GRANT EXECUTE ON FUNCTION obtener_numeros_disponibles_para_reasignacion TO anon, authenticated;


-- ============================================================================
-- 7. STORAGE (buckets y políticas)
-- ============================================================================
-- Las imágenes de sorteos van a Vercel Blob (/api/upload-image), pero estos
-- buckets quedan creados porque el proyecto original los usaba y el
-- comprobante de transferencia puede subirse acá.

INSERT INTO storage.buckets (id, name, public) VALUES
  ('sorteo-images',   'sorteo-images',   true),
  ('comprobantes',    'comprobantes',    true),
  ('tshirt-previews', 'tshirt-previews', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read access"   ON storage.objects;
CREATE POLICY "Public read access"   ON storage.objects FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public upload access" ON storage.objects;
CREATE POLICY "Public upload access" ON storage.objects FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public update access" ON storage.objects;
CREATE POLICY "Public update access" ON storage.objects FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public delete access" ON storage.objects;
CREATE POLICY "Public delete access" ON storage.objects FOR DELETE USING (true);


-- ============================================================================
-- 8. DATOS INICIALES
-- ============================================================================
-- Sólo las claves de configuración, vacías. Se completan desde el backoffice
-- (Contenido del sitio / Datos de transferencia). Van vacías a propósito:
-- así el sitio nunca muestra los datos bancarios de otro cliente.
--
-- No se inserta ningún sorteo: hasta que se cree uno desde /backoffice, la
-- landing muestra la pantalla "Próximamente", que es el comportamiento
-- correcto para una instalación nueva.

INSERT INTO configuracion (clave, valor) VALUES
  ('alias_transferencia',   ''),
  ('titular_transferencia', '')
ON CONFLICT (clave) DO NOTHING;


-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================
-- Corré estas consultas después del script. Los números esperados están
-- indicados en cada una.

-- 7 tablas
SELECT 'tablas' AS chequeo, COUNT(*) AS encontradas, 7 AS esperadas
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('sorteos','compradores','configuracion','ganadores_pasados',
                     'ganadores_express','mural_ganadores','sorteos_diarios');

-- 12 funciones
SELECT 'funciones' AS chequeo, COUNT(*) AS encontradas, 12 AS esperadas
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('generar_numeros_unicos_atomico','validar_numeros_unicos_antes_cambio',
                       'obtener_estadisticas_sorteo','contar_compradores_sorteo',
                       'contar_chances_vendidas','verificar_sorteo_completo',
                       'obtener_ganadores_express_visibles','obtener_resumen_sorteo_activo',
                       'diagnosticar_duplicados','diagnosticar_duplicados_rapido',
                       'obtener_compradores_con_duplicados',
                       'obtener_numeros_disponibles_para_reasignacion');

-- 6 triggers (1 de validación + 5 de updated_at).
-- DISTINCT es necesario: information_schema.triggers devuelve una fila por
-- evento, y el de validación cubre INSERT y UPDATE (contaría doble).
SELECT 'triggers' AS chequeo, COUNT(DISTINCT trigger_name) AS encontrados, 6 AS esperados
FROM information_schema.triggers
WHERE trigger_schema = 'public';

-- El trigger de duplicados tiene que estar activo, sobre INSERT y UPDATE
SELECT 'trigger duplicados' AS chequeo,
       string_agg(event_manipulation, '+' ORDER BY event_manipulation) AS eventos,
       'INSERT+UPDATE' AS esperado
FROM information_schema.triggers
WHERE trigger_name = 'trigger_validar_numeros_unicos';
