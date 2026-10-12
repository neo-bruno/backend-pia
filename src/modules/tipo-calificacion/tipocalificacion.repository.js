const pool = require("../../database/pool");

// ============================================
// LISTAR TIPOS DE CALIFICACIÓN
// ============================================
exports.getTiposCalificacion = async (filtros = {}) => {
  const { objetivo, estado, buscar } = filtros;

  const query = `
    SELECT
      tc.id,
      tc.codigo,
      tc.tipo,
      tc.descripcion,
      tc.objetivo,
      tc.estado,
      tc.created_at,
      tc.updated_at,
      e.id AS evaluacion_id,
      e.estado AS estado_evaluacion,
      e.puntaje_promedio,
      e.cantidad_calificaciones
    FROM tipo_calificacion tc
    LEFT JOIN evaluacion e
      ON e.tipo_calificacion_id = tc.id
    WHERE
      ($1::objetivo_calificacion_enum IS NULL
        OR tc.objetivo = $1)
      AND
      ($2::estado_tipo_calificacion_enum IS NULL
        OR tc.estado = $2)
      AND (
        $3::VARCHAR IS NULL
        OR tc.codigo ILIKE '%' || $3 || '%'
        OR tc.tipo ILIKE '%' || $3 || '%'
        OR COALESCE(tc.descripcion, '') ILIKE '%' || $3 || '%'
      )
    ORDER BY
      CASE tc.objetivo
        WHEN 'PROFESIONAL' THEN 1
        WHEN 'SERVICIO' THEN 2
        WHEN 'NEGOCIO' THEN 3
        WHEN 'PIA' THEN 4
        ELSE 5
      END,
      tc.tipo ASC,
      tc.id ASC
  `;

  const values = [objetivo || null, estado || null, buscar?.trim() || null];

  const { rows } = await pool.query(query, values);

  return rows;
};

// ============================================
// OBTENER TIPO POR ID
// ============================================
exports.getTipoCalificacionById = async (id) => {
  const query = `
    SELECT
      tc.id,
      tc.codigo,
      tc.tipo,
      tc.descripcion,
      tc.objetivo,
      tc.estado,
      tc.created_at,
      tc.updated_at,
      e.id AS evaluacion_id,
      e.estado AS estado_evaluacion,
      e.puntaje_promedio,
      e.cantidad_calificaciones
    FROM tipo_calificacion tc
    LEFT JOIN evaluacion e
      ON e.tipo_calificacion_id = tc.id
    WHERE tc.id = $1
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [id]);

  return rows[0] || null;
};

// ============================================
// BUSCAR CÓDIGO DUPLICADO
// ============================================
exports.getTipoCalificacionByCodigo = async (
  codigo,
  objetivo,
  excluirId = null,
) => {
  const query = `
    SELECT id, codigo, objetivo
    FROM tipo_calificacion
    WHERE UPPER(codigo) = UPPER($1)
      AND objetivo = $2
      AND ($3::INTEGER IS NULL OR id <> $3)
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [codigo, objetivo, excluirId]);

  return rows[0] || null;
};

// ============================================
// CREAR TIPO DE CALIFICACIÓN
// ============================================
exports.createTipoCalificacion = async (datos) => {
  const { codigo, tipo, descripcion, objetivo, estado = "ACTIVO" } = datos;

  const query = `
    INSERT INTO tipo_calificacion (
      codigo,
      tipo,
      descripcion,
      objetivo,
      estado
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING
      id,
      codigo,
      tipo,
      descripcion,
      objetivo,
      estado,
      created_at,
      updated_at
  `;

  const values = [codigo, tipo, descripcion || null, objetivo, estado];

  const { rows } = await pool.query(query, values);

  return rows[0];
};

// ============================================
// ACTUALIZAR TIPO DE CALIFICACIÓN
// ============================================
exports.updateTipoCalificacion = async (id, datos) => {
  const { codigo, tipo, descripcion, objetivo } = datos;

  const query = `
    UPDATE tipo_calificacion
    SET
      codigo = $2,
      tipo = $3,
      descripcion = $4,
      objetivo = $5,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING
      id,
      codigo,
      tipo,
      descripcion,
      objetivo,
      estado,
      created_at,
      updated_at
  `;

  const values = [id, codigo, tipo, descripcion || null, objetivo];

  const { rows } = await pool.query(query, values);

  return rows[0] || null;
};

// ============================================
// CAMBIAR ESTADO
// ============================================
exports.updateEstadoTipoCalificacion = async (id, estado) => {
  const query = `
    UPDATE tipo_calificacion
    SET
      estado = $2,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING
      id,
      codigo,
      tipo,
      descripcion,
      objetivo,
      estado,
      created_at,
      updated_at
  `;

  const { rows } = await pool.query(query, [id, estado]);

  return rows[0] || null;
};
