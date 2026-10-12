const pool = require("../../database/pool");

const slugify = (texto) => {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};
async function getNegocioByCodigo(codigo) {
  const query = `
    SELECT
      id,
      codigo,
      nombre,
      descripcion,
      telefono,
      departamento,
      municipio,
      zona,
      direccion,
      latitud,
      longitud,
      logo,
      portada,
      color_1,
      color_2,
      color_3,
      estado
    FROM negocio
    WHERE codigo = $1
    LIMIT 1;
  `;

  const { rows } = await pool.query(query, [codigo]);

  return rows[0] || null;
}

// =====================================================
// NEGOCIO
// =====================================================
async function getNegocioById(client, negocioId) {
  const result = await client.query(
    `
      SELECT
        id,
        codigo,
        nombre,
        estado
      FROM negocio
      WHERE id = $1
      LIMIT 1
    `,
    [negocioId],
  );

  return result.rows[0] || null;
}

// =====================================================
// TIPO PROFESIONAL
// =====================================================
async function getTipoProfesionalById(client, id) {
  const result = await client.query(
    `
      SELECT
        id,
        nombre,
        descripcion,
        activo
      FROM tipo_profesional
      WHERE id = $1
    `,
    [id],
  );

  return result.rows[0] || null;
}

// =====================================================
// ROL
// =====================================================
async function getRolAdmin(client) {
  const result = await client.query(
    `
      SELECT
        id,
        nombre
      FROM rol
      WHERE UPPER(nombre) = 'ADMIN'
      LIMIT 1
    `,
  );

  return result.rows[0] || null;
}

// =====================================================
// MÉTODO DE PAGO QR
// =====================================================
async function getMetodoPagoQR(client) {
  const result = await client.query(
    `
      SELECT
        id,
        nombre,
        codigo,
        estado
      FROM metodo_pago
      WHERE UPPER(codigo) = 'QR'
        AND estado = 'ACTIVO'
      LIMIT 1
    `,
  );

  return result.rows[0] || null;
}

// =====================================================
// GERENCIA
// =====================================================
async function getGerenciaActiva(client) {
  const result = await client.query(
    `
      SELECT
        id,
        gerente_id,
        nombre,
        direccion,
        monto_qr,
        estado
      FROM gerencia
      WHERE estado = 'ACTIVO'
      ORDER BY id
      LIMIT 1
    `,
  );

  return result.rows[0] || null;
}

// =====================================================
// PERSONA
// =====================================================
async function createPersona(client, profesional) {
  const nombreCompleto =
    `${profesional.nombres} ${profesional.apellidos}`.trim();

  const result = await client.query(
    `
      INSERT INTO persona (
        nombre,
        telefono,
        sexo,
        fecha_nacimiento
      )
      VALUES ($1, $2, $3, $4)
      RETURNING
        id,
        nombre,
        telefono,
        sexo,
        fecha_nacimiento
    `,
    [
      nombreCompleto,
      profesional.telefono,
      profesional.sexo,
      profesional.fecha_nacimiento || null,
    ],
  );

  return result.rows[0];
}

// =====================================================
// PROFESIONAL
// =====================================================
const existsSlugProfesional = async (client, slug) => {
  const query = `
    SELECT 1
    FROM profesional
    WHERE slug = $1
    LIMIT 1
  `;

  const { rows } = await client.query(query, [slug]);

  return rows.length > 0;
};

async function createProfesional(client, personaId, slug) {
  const result = await client.query(
    `
      INSERT INTO profesional (
          persona_id,
          slug,
          estado,
          estado_funciones
      )
      VALUES (
          $1,
          $2,
          'ACTIVO',
          'DESHABILITADO'
      )
      RETURNING id, persona_id, estado, estado_funciones
    `,
    [personaId, slug],
  );

  return result.rows[0];
}

// =====================================================
// USUARIO
// =====================================================

async function createUsuario(client, personaId, rolId, telefono, password) {
  const result = await client.query(
    `
      INSERT INTO usuario (
        persona_id,
        rol_id,
        telefono,
        password,
        estado
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        'HABILITADO'
      )
      RETURNING
        id,
        persona_id,
        rol_id,
        telefono,
        estado
    `,
    [personaId, rolId, telefono, password],
  );

  return result.rows[0];
}

// =====================================================
// PROFESIONAL - TIPO PROFESIONAL
// =====================================================

async function createProfesionalTipo(client, profesionalId, tipoProfesionalId) {
  const result = await client.query(
    `
      INSERT INTO profesional_tipo_profesional (
        profesional_id,
        tipo_profesional_id
      )
      VALUES ($1, $2)
      RETURNING *
    `,
    [profesionalId, tipoProfesionalId],
  );

  return result.rows[0];
}

async function getTipoProfesionalByNombre(client, nombre) {
  const result = await client.query(
    `
    SELECT *
    FROM tipo_profesional
    WHERE LOWER(nombre) = LOWER($1)
    LIMIT 1
    `,
    [nombre],
  );

  return result.rows[0] || null;
}

async function createTipoProfesional(client, data) {
  const result = await client.query(
    `
    INSERT INTO tipo_profesional (
      nombre,
      descripcion
    )
    VALUES ($1, $2)
    RETURNING *
    `,
    [data.nombre, data.descripcion || null],
  );

  return result.rows[0];
}

// =====================================================
// PROFESIONAL - NEGOCIO
// =====================================================

async function createProfesionalNegocio(client, negocioId, profesionalId) {
  const result = await client.query(
    `
      INSERT INTO profesional_negocio (
        negocio_id,
        profesional_id,
        acceso,
        estado
      )
      VALUES (
        $1,
        $2,
        'DENEGADO',
        'DESHABILITADO'
      )
      RETURNING
        id,
        negocio_id,
        profesional_id,
        acceso,
        estado,
        fecha_creacion
    `,
    [negocioId, profesionalId],
  );

  return result.rows[0];
}

// =====================================================
// MEMBRESÍA
// =====================================================

async function createMembresia(client, profesionalNegocioId, membresia) {
  const result = await client.query(
    `
      INSERT INTO membresia (
        profesional_negocio_id,
        fecha_inicio,
        fecha_fin,
        monto,
        estado_pagado,
        estado
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        FALSE,
        'ACTIVO'
      )
      RETURNING *
    `,
    [
      profesionalNegocioId,
      membresia.fecha_inicio,
      membresia.fecha_fin,
      membresia.monto,
    ],
  );

  return result.rows[0];
}

// =====================================================
// ARCHIVO
// =====================================================

async function createArchivo(client, file) {
  const url = `/uploads/profesionales/${file.filename}`;

  const result = await client.query(
    `
      INSERT INTO archivo (
        nombre,
        url,
        tipo,
        mime_type,
        tamano_bytes
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
    [file.originalname, url, "COMPROBANTE", file.mimetype, file.size],
  );

  return result.rows[0];
}

// =====================================================
// PAGO
// =====================================================

function generarNumeroPago() {
  const fecha = new Date();

  const parteFecha =
    fecha.getFullYear().toString() +
    String(fecha.getMonth() + 1).padStart(2, "0") +
    String(fecha.getDate()).padStart(2, "0");

  const parteAleatoria = Math.floor(100000 + Math.random() * 900000);

  return `MEM-${parteFecha}-${parteAleatoria}`;
}

async function createPago(
  client,
  metodoPagoId,
  profesionalId,
  membresiaId,
  monto,
) {
  const numero = generarNumeroPago();

  const result = await client.query(
    `
      INSERT INTO pago (
        metodo_pago_id,
        profesional_id,
        membresia_id,
        numero,
        fecha,
        hora,
        monto,
        estado
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        CURRENT_DATE,
        CURRENT_TIME,
        $5,
        'ACTIVO'
      )
      RETURNING *
    `,
    [metodoPagoId, profesionalId, membresiaId, numero, monto],
  );

  return result.rows[0];
}

// =====================================================
// COMPROBANTE
// =====================================================

async function createComprobante(client, pagoId, archivoId, gerenciaId) {
  const result = await client.query(
    `
      INSERT INTO comprobante (
        pago_id,
        archivo_id,
        estado,
        validado_por_gerencia_id
      )
      VALUES (
        $1,
        $2,
        'PENDIENTE',
        $3
      )
      RETURNING *
    `,
    [pagoId, archivoId, gerenciaId],
  );

  return result.rows[0];
}

const obtenerProfesional = async (client, profesionalId) => {
  const query = `
    SELECT
      p.id,
      p.persona_id,
      p.slug,
      per.nombre,

      p.foto,
      p.portada,
      p.fecha_trabajo,
      p.descripcion,
      p.lema,
      p.pago_qr,

      p.estado,
      p.estado_funciones,

      p.created_at,
      p.updated_at

    FROM profesional p

    INNER JOIN persona per
      ON per.id = p.persona_id

    WHERE p.id = $1

    FOR UPDATE
  `;

  const { rows } = await client.query(query, [profesionalId]);

  return rows[0] || null;
};

// =====================================================
// ACTUALIZAR PERSONA
// =====================================================
const actualizarPersona = async (client, personaId, nombre) => {
  const query = `
    UPDATE persona
    SET
      nombre = $1,
      updated_at = CURRENT_TIMESTAMP

    WHERE id = $2

    RETURNING id, nombre, telefono;
  `;

  const { rows } = await client.query(query, [nombre, personaId]);

  return rows[0];
};

// =====================================================
// ACTUALIZAR PROFESIONAL
// =====================================================
const actualizarProfesional = async (client, profesionalId, datos) => {
  const campos = [];
  const valores = [];

  let posicion = 1;

  // ===================================================
  // DATOS TEXTUALES
  // ===================================================

  campos.push(`fecha_trabajo = $${posicion++}`);

  valores.push(datos.fecha_trabajo);

  campos.push(`descripcion = $${posicion++}`);

  valores.push(datos.descripcion);

  campos.push(`lema = $${posicion++}`);

  valores.push(datos.lema);

  // ===================================================
  // FOTO
  // ===================================================

  if (datos.eliminar_foto) {
    campos.push(`foto = NULL`);
  } else if (datos.foto) {
    campos.push(`foto = $${posicion++}`);

    valores.push(`/uploads/profesionales/${datos.foto.filename}`);
  }

  // ===================================================
  // PORTADA
  // ===================================================

  if (datos.eliminar_portada) {
    campos.push(`portada = NULL`);
  } else if (datos.portada) {
    campos.push(`portada = $${posicion++}`);

    valores.push(`/uploads/profesionales/${datos.portada.filename}`);
  }

  // ===================================================
  // QR
  // ===================================================

  if (datos.eliminar_qr) {
    campos.push(`pago_qr = NULL`);
  } else if (datos.qr) {
    campos.push(`pago_qr = $${posicion++}`);

    valores.push(`/uploads/profesionales/${datos.qr.filename}`);
  }

  // ===================================================
  // UPDATED
  // ===================================================

  campos.push(`updated_at = CURRENT_TIMESTAMP`);

  valores.push(profesionalId);

  const query = `
    UPDATE profesional
    SET
      ${campos.join(",\n      ")}

    WHERE id = $${posicion}

    RETURNING *;
  `;

  const { rows } = await client.query(query, valores);

  return rows[0];
};

// =====================================================
// VERIFICAR TIPOS
// =====================================================
const obtenerTiposValidos = async (client, tipos) => {
  if (!tipos.length) {
    return [];
  }

  const query = `
    SELECT
      id,
      nombre,
      descripcion

    FROM tipo_profesional

    WHERE id = ANY($1::integer[])
      AND activo = TRUE

    ORDER BY id;
  `;

  const { rows } = await client.query(query, [tipos]);

  return rows;
};

// =====================================================
// ELIMINAR TIPOS ACTUALES
// =====================================================
const eliminarTipos = async (client, profesionalId) => {
  await client.query(
    `
      DELETE FROM profesional_tipo_profesional

      WHERE profesional_id = $1
    `,
    [profesionalId],
  );
};

// =====================================================
// INSERTAR TIPOS
// =====================================================
const insertarTipos = async (client, profesionalId, tipos) => {
  for (const tipoId of tipos) {
    await client.query(
      `
        INSERT INTO profesional_tipo_profesional (
          profesional_id,
          tipo_profesional_id
        )
        VALUES ($1, $2)
      `,
      [profesionalId, tipoId],
    );
  }
};

// =====================================================
// OBTENER TIPOS DEL PROFESIONAL
// =====================================================
const obtenerTiposProfesional = async (client, profesionalId) => {
  const query = `
    SELECT
      tp.id,
      tp.nombre,
      tp.descripcion

    FROM profesional_tipo_profesional ptp

    INNER JOIN tipo_profesional tp
      ON tp.id = ptp.tipo_profesional_id

    WHERE ptp.profesional_id = $1

    ORDER BY ptp.id;
  `;

  const { rows } = await client.query(query, [profesionalId]);

  return rows;
};

const getDataProfessional = async (client, profesionalId) => {
  const query = `
    SELECT
      p.id,
      p.persona_id,

      per.nombre,

      p.slug,
      p.foto,
      p.portada,
      p.fecha_trabajo,
      p.descripcion,
      p.lema,
      p.pago_qr,

      p.estado,
      p.estado_funciones,

      /* ============================
         EXPERIENCIA
         ============================ */
      CASE
        WHEN p.fecha_trabajo IS NULL THEN 0
        ELSE DATE_PART(
          'year',
          AGE(CURRENT_DATE, p.fecha_trabajo)
        )::INTEGER
      END AS anios_experiencia,

      /* ============================
         TIPOS DE PROFESIONAL
         ============================ */
      COALESCE(
        (
          SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', tp.id,
              'nombre', tp.nombre,
              'descripcion', tp.descripcion
            )
            ORDER BY ptp.id
          )
          FROM profesional_tipo_profesional ptp
          INNER JOIN tipo_profesional tp
            ON tp.id = ptp.tipo_profesional_id
          WHERE ptp.profesional_id = p.id
            AND tp.activo = TRUE
        ),
        '[]'::json
      ) AS tipos,

      /* ============================
         CALIFICACIÓN ATENCIÓN
         ============================ */
      COALESCE(
        (
          SELECT ROUND(AVG(c.puntaje), 2)
          FROM calificacion c
          INNER JOIN tipo_calificacion tc
            ON tc.id = c.tipo_calificacion_id
          WHERE c.profesional_id = p.id
            AND tc.nombre ILIKE 'Atención'
            AND tc.estado = 'ACTIVO'
            AND c.estado = 'ACTIVA'
        ),
        0
      ) AS calificacion,

      COALESCE(
        (
          SELECT COUNT(*)
          FROM calificacion c
          INNER JOIN tipo_calificacion tc
            ON tc.id = c.tipo_calificacion_id
          WHERE c.profesional_id = p.id
            AND tc.nombre ILIKE 'Atención'
            AND tc.estado = 'ACTIVO'
            AND c.estado = 'ACTIVA'
        ),
        0
      ) AS cantidad_calificaciones,

      /* ============================
         CLIENTES ATENDIDOS
         ============================ */
      COALESCE(
        (
          SELECT COUNT(DISTINCT h.cliente_id)
          FROM historial h
          WHERE h.profesional_id = p.id
        ),
        0
      ) AS clientes_atendidos

    FROM profesional p

    INNER JOIN persona per
      ON per.id = p.persona_id

    WHERE p.id = $1

    LIMIT 1
  `;

  const { rows } = await client.query(query, [profesionalId]);

  return rows[0] || null;
};

// profesional.repository.js
const getProfessionals = async () => {
  const query = `
    SELECT
      p.id,
      p.persona_id,
      p.slug,
      p.foto,
      p.portada,
      p.fecha_trabajo,
      p.descripcion,
      p.lema,
      p.pago_qr,
      p.estado,
      p.estado_funciones,
      p.created_at,
      p.updated_at,

      -- ==========================================
      -- PERSONA
      -- ==========================================

      per.id AS persona_id,
      per.nombre,
      per.telefono,
      per.sexo,
      per.fecha_nacimiento,

      -- ==========================================
      -- TIPOS DE PROFESIONAL
      -- ==========================================

      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'id', tp.id,
              'nombre', tp.nombre,
              'descripcion', tp.descripcion
            )
            ORDER BY tp.nombre
          )
          FROM profesional_tipo_profesional ptp
          INNER JOIN tipo_profesional tp
            ON tp.id = ptp.tipo_profesional_id
          WHERE ptp.profesional_id = p.id
            AND tp.activo = true
        ),
        '[]'::json
      ) AS tipos_profesional,

      -- ==========================================
      -- SERVICIOS
      -- ==========================================

      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'id', s.id,
              'nombre', s.nombre,
              'descripcion', s.descripcion,
              'duracion', s.duracion,
              'precio', s.precio,
              'estado', s.estado
            )
            ORDER BY s.nombre
          )
          FROM servicio s
          WHERE s.profesional_id = p.id
            AND s.estado = 'HABILITADO'
        ),
        '[]'::json
      ) AS servicios,

      -- ==========================================
      -- PRECIO MÍNIMO
      -- ==========================================

      (
        SELECT MIN(s.precio)
        FROM servicio s
        WHERE s.profesional_id = p.id
          AND s.estado = 'HABILITADO'
      ) AS precio_minimo,

      -- ==========================================
      -- CALIFICACIÓN
      -- ==========================================

      COALESCE(
        (
          SELECT ROUND(AVG(c.puntaje), 1)
          FROM calificacion c
          WHERE c.profesional_id = p.id
            AND c.estado = 'ACTIVA'
        ),
        0
      ) AS rating,

      -- ==========================================
      -- CANTIDAD DE RESEÑAS
      -- ==========================================

      (
        SELECT COUNT(*)
        FROM calificacion c
        WHERE c.profesional_id = p.id
          AND c.estado = 'ACTIVA'
      ) AS resenas,

      -- ==========================================
      -- RANKING ACTUAL
      -- ==========================================

      (
        SELECT rd.posicion
        FROM ranking_detalle rd
        INNER JOIN ranking r
          ON r.id = rd.ranking_id
        WHERE rd.profesional_id = p.id
          AND r.estado = 'ACTIVO'
        ORDER BY
          rd.posicion ASC,
          rd.id DESC
        LIMIT 1
      ) AS posicion,

      -- ==========================================
      -- NEGOCIOS
      -- ==========================================

      COALESCE(
        (
          SELECT json_agg(
            json_build_object(
              'id', n.id,
              'nombre', n.nombre,
              'slug', n.slug
            )
            ORDER BY n.nombre
          )
          FROM profesional_negocio pn
          INNER JOIN negocio n
            ON n.id = pn.negocio_id
          WHERE pn.profesional_id = p.id
        ),
        '[]'::json
      ) AS negocios

    FROM profesional p

    INNER JOIN persona per
      ON per.id = p.persona_id

    WHERE p.estado = 'ACTIVO'
      AND p.estado_funciones = 'HABILITADO'

    ORDER BY
      posicion ASC NULLS LAST,
      p.created_at DESC;
  `;

  const { rows } = await pool.query(query);

  return rows;
};

// =====================================================
// PROFESIONAL POR SLUG
// =====================================================
async function getProfessionalBySlug(slug) {
  const query = `
    SELECT

      -- =====================================================
      -- PROFESIONAL
      -- =====================================================

      p.id,
      p.slug,
      p.foto,
      p.portada,
      p.fecha_trabajo,
      p.descripcion,
      p.lema,
      p.pago_qr,
      p.estado,
      p.estado_funciones,

      per.id AS persona_id,
      per.nombre,

      -- =====================================================
      -- EXPERIENCIA
      -- =====================================================

      GREATEST(
        DATE_PART(
          'year',
          AGE(CURRENT_DATE, p.fecha_trabajo)
        ),
        0
      )::INTEGER AS anios_experiencia,

      -- =====================================================
      -- CALIFICACIÓN - ATENCIÓN
      -- =====================================================

      COALESCE(
        ROUND(
          AVG(c.puntaje)
          FILTER (
            WHERE tc.codigo = 'ATENCION'
              AND c.estado = 'ACTIVA'
              AND tc.estado = 'ACTIVO'
          ),
          1
        ),
        0
      ) AS calificacion,

      COUNT(c.id)
        FILTER (
          WHERE tc.codigo = 'ATENCION'
            AND c.estado = 'ACTIVA'
            AND tc.estado = 'ACTIVO'
        ) AS cantidad_calificaciones,

      -- =====================================================
      -- CLIENTES ATENDIDOS
      -- =====================================================

      COUNT(
        DISTINCT h.cliente_id
      ) AS clientes_atendidos,

      -- =====================================================
      -- TIPOS PROFESIONALES
      -- =====================================================

      COALESCE(
        json_agg(
          DISTINCT jsonb_build_object(
            'id', tp.id,
            'nombre', tp.nombre,
            'descripcion', tp.descripcion
          )
        )
        FILTER (
          WHERE tp.id IS NOT NULL
        ),
        '[]'
      ) AS tipos,

      -- =====================================================
      -- NEGOCIO
      -- =====================================================

      n.id AS negocio_id,
      n.nombre AS negocio_nombre,
      n.slug AS negocio_slug,
      n.telefono AS negocio_telefono,
      n.departamento,
      n.municipio,
      n.zona,
      n.direccion,
      n.latitud,
      n.longitud,
      n.logo AS negocio_logo,

      -- =====================================================
      -- SERVICIOS DEL PROFESIONAL
      -- =====================================================

      COALESCE(
        (
          SELECT json_agg(
            jsonb_build_object(

              'id', s.id,
              'nombre', s.nombre,
              'descripcion', s.descripcion,
              'duracion', s.duracion,
              'precio', s.precio,
              'estado', s.estado,

              -- -------------------------------------------
              -- ARCHIVOS DEL SERVICIO
              -- -------------------------------------------

              'archivos',
              COALESCE(
                (
                  SELECT json_agg(
                    jsonb_build_object(
                      'id', a.id,
                      'nombre', a.nombre,
                      'url', a.url,
                      'tipo', sa.tipo,
                      'mime_type', a.mime_type,
                      'tamano_bytes', a.tamano_bytes,
                      'orden', sa.orden,
                      'principal', sa.principal
                    )
                    ORDER BY sa.orden ASC, a.id ASC
                  )
                  FROM servicio_archivo sa
                  INNER JOIN archivo a
                    ON a.id = sa.archivo_id
                  WHERE sa.servicio_id = s.id
                ),
                '[]'
              )

            )
            ORDER BY s.id DESC
          )
          FROM servicio s
          WHERE s.profesional_id = p.id
            AND s.estado = 'HABILITADO'
        ),
        '[]'
      ) AS servicios,

      -- =====================================================
      -- GALERÍA GENERAL DEL PROFESIONAL
      -- =====================================================
      -- Junta todas las fotos y videos de sus servicios
      -- para poder mostrarlos como una galería.

      COALESCE(
        (
          SELECT json_agg(
            jsonb_build_object(

              'id', a.id,
              'url', a.url,
              'nombre', a.nombre,
              'tipo', sa.tipo,
              'mime_type', a.mime_type,
              'orden', sa.orden,
              'principal', sa.principal,

              'servicio_id', s.id,
              'servicio_nombre', s.nombre

            )
            ORDER BY
              s.id DESC,
              sa.orden ASC,
              a.id ASC
          )

          FROM servicio s

          INNER JOIN servicio_archivo sa
            ON sa.servicio_id = s.id

          INNER JOIN archivo a
            ON a.id = sa.archivo_id

          WHERE s.profesional_id = p.id
            AND s.estado = 'HABILITADO'
        ),
        '[]'
      ) AS galeria

    FROM profesional p

    INNER JOIN persona per
      ON per.id = p.persona_id

    -- =====================================================
    -- TIPOS PROFESIONALES
    -- =====================================================

    LEFT JOIN profesional_tipo_profesional ptp
      ON ptp.profesional_id = p.id

    LEFT JOIN tipo_profesional tp
      ON tp.id = ptp.tipo_profesional_id

    -- =====================================================
    -- NEGOCIO
    -- =====================================================

    LEFT JOIN profesional_negocio pn
      ON pn.profesional_id = p.id
      AND pn.estado = 'HABILITADO'

    LEFT JOIN negocio n
      ON n.id = pn.negocio_id
    
    -- =====================================================
    -- CALIFICACIONES
    -- =====================================================

    LEFT JOIN calificacion c
      ON c.profesional_id = p.id

    LEFT JOIN evaluacion e
      ON e.id = c.evaluacion_id

    LEFT JOIN tipo_calificacion tc
      ON tc.id = e.tipo_calificacion_id

    -- =====================================================
    -- HISTORIAL
    -- =====================================================

    LEFT JOIN historial h
      ON h.profesional_id = p.id

    WHERE p.slug = $1
      AND p.estado = 'ACTIVO'
      AND p.estado_funciones = 'HABILITADO'

    GROUP BY
      p.id,
      per.id,
      n.id

    LIMIT 1;
  `;

  const result = await pool.query(query, [slug]);

  if (!result.rows.length) {
    return null;
  }

  const row = result.rows[0];

  return {
    // =====================================================
    // PROFESIONAL
    // =====================================================

    profesional: {
      id: row.id,
      persona_id: row.persona_id,
      nombre: row.nombre,

      slug: row.slug,

      foto: row.foto,
      portada: row.portada,

      fecha_trabajo: row.fecha_trabajo,

      descripcion: row.descripcion,
      lema: row.lema,

      pago_qr: row.pago_qr,

      estado: row.estado,
      estado_funciones: row.estado_funciones,

      anios_experiencia: Number(row.anios_experiencia || 0),

      calificacion: Number(row.calificacion || 0),

      cantidad_calificaciones: Number(row.cantidad_calificaciones || 0),

      clientes_atendidos: Number(row.clientes_atendidos || 0),

      tipos: row.tipos || [],
    },

    // =====================================================
    // NEGOCIO
    // =====================================================

    negocio: row.negocio_id
      ? {
          id: row.negocio_id,

          nombre: row.negocio_nombre,

          slug: row.negocio_slug,

          telefono: row.negocio_telefono,

          departamento: row.departamento,

          municipio: row.municipio,

          zona: row.zona,

          direccion: row.direccion,

          latitud: row.latitud,

          longitud: row.longitud,

          logo: row.negocio_logo,
        }
      : null,

    // =====================================================
    // SERVICIOS
    // =====================================================

    servicios: row.servicios || [],

    // =====================================================
    // GALERÍA
    // =====================================================

    galeria: row.galeria || [],
  };
}

module.exports = {
  getNegocioByCodigo,
  getNegocioById,
  getTipoProfesionalById,
  getTipoProfesionalByNombre,
  createTipoProfesional,
  getRolAdmin,
  getMetodoPagoQR,
  getGerenciaActiva,
  createPersona,
  slugify,
  existsSlugProfesional,
  createProfesional,
  createUsuario,
  createProfesionalTipo,
  createProfesionalNegocio,
  createMembresia,
  createArchivo,
  createPago,
  createComprobante,
  getProfessionalBySlug,
  getProfessionals,  
};
