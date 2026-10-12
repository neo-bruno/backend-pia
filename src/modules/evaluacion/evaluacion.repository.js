const pool = require("../../database/pool");

// ============================================================
// PIA - MÓDULO EVALUACIÓN
// Capa: repository
// ============================================================

// ============================================================
// OBTENER TODAS LAS EVALUACIONES
// Filtros opcionales: objetivo, estado y búsqueda
// ============================================================

exports.getEvaluaciones = async (filtros = {}) => {
  const { objetivo, estado, buscar } = filtros;

  const query = `
    SELECT
      e.id,
      e.tipo_calificacion_id,

      tc.codigo AS tipo_codigo,
      tc.tipo AS tipo_nombre,
      tc.descripcion AS tipo_descripcion,
      tc.objetivo,
      tc.estado AS tipo_estado,

      e.puntaje_promedio,
      e.cantidad_calificaciones,
      e.estado,

      e.created_at,
      e.updated_at

    FROM evaluacion e

    INNER JOIN tipo_calificacion tc
      ON tc.id = e.tipo_calificacion_id

    WHERE
      ($1::objetivo_calificacion_enum IS NULL
        OR tc.objetivo = $1)

      AND ($2::estado_evaluacion_enum IS NULL
        OR e.estado = $2)

      AND (
        $3::VARCHAR IS NULL
        OR tc.codigo ILIKE '%' || $3 || '%'
        OR tc.tipo ILIKE '%' || $3 || '%'
        OR tc.descripcion ILIKE '%' || $3 || '%'
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
      e.id ASC;
  `;

  const values = [objetivo || null, estado || null, buscar?.trim() || null];

  const { rows } = await pool.query(query, values);

  return rows;
};

// ============================================================
// OBTENER UNA EVALUACIÓN POR ID
// ============================================================

exports.getEvaluacionById = async (id) => {
  const query = `
    SELECT
      e.id,
      e.tipo_calificacion_id,

      tc.codigo AS tipo_codigo,
      tc.tipo AS tipo_nombre,
      tc.descripcion AS tipo_descripcion,
      tc.objetivo,
      tc.estado AS tipo_estado,

      e.puntaje_promedio,
      e.cantidad_calificaciones,
      e.estado,

      e.created_at,
      e.updated_at

    FROM evaluacion e

    INNER JOIN tipo_calificacion tc
      ON tc.id = e.tipo_calificacion_id

    WHERE e.id = $1

    LIMIT 1;
  `;

  const { rows } = await pool.query(query, [id]);

  return rows[0] || null;
};

// ============================================================
// CREAR UNA EVALUACIÓN
// Una evaluación por tipo_calificacion_id
// ============================================================

exports.createEvaluacion = async (tipoCalificacionId) => {
  const query = `
    INSERT INTO evaluacion (
      tipo_calificacion_id,
      puntaje_promedio,
      cantidad_calificaciones,
      estado
    )
    VALUES (
      $1,
      0,
      0,
      'DESHABILITADO'
    )

    RETURNING
      id,
      tipo_calificacion_id,
      puntaje_promedio,
      cantidad_calificaciones,
      estado,
      created_at,
      updated_at;
  `;

  const { rows } = await pool.query(query, [tipoCalificacionId]);

  return rows[0] || null;
};

// ============================================================
// CAMBIAR ESTADO DE UNA EVALUACIÓN
// Máximo una evaluación HABILITADA por objetivo
// ============================================================

exports.updateEstadoEvaluacion = async (id, estado) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Bloquear las evaluaciones para coordinar las actualizaciones.
    await client.query(`
      SELECT id
      FROM evaluacion
      ORDER BY id
      FOR UPDATE
    `);

    // Obtener el objetivo de la evaluación seleccionada.
    const evaluacionQuery = `
      SELECT
        e.id,
        tc.objetivo
      FROM evaluacion e
      INNER JOIN tipo_calificacion tc
        ON tc.id = e.tipo_calificacion_id
      WHERE e.id = $1
      LIMIT 1;
    `;

    const evaluacionResult = await client.query(evaluacionQuery, [id]);

    if (!evaluacionResult.rows.length) {
      const error = new Error("Evaluación no encontrada");
      error.status = 404;
      throw error;
    }

    const objetivo = evaluacionResult.rows[0].objetivo;

    // Deshabilitar las otras evaluaciones del mismo objetivo.
    if (estado === "HABILITADO") {
      await client.query(
        `
          UPDATE evaluacion e
          SET
            estado = 'DESHABILITADO',
            updated_at = CURRENT_TIMESTAMP
          FROM tipo_calificacion tc
          WHERE e.tipo_calificacion_id = tc.id
            AND tc.objetivo = $2
            AND e.id <> $1
            AND e.estado = 'HABILITADO';
        `,
        [id, objetivo],
      );
    }

    // Actualizar la evaluación seleccionada.
    const { rows } = await client.query(
      `
        UPDATE evaluacion
        SET
          estado = $2,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING
          id,
          tipo_calificacion_id,
          puntaje_promedio,
          cantidad_calificaciones,
          estado,
          created_at,
          updated_at;
      `,
      [id, estado],
    );

    await client.query("COMMIT");

    return rows[0] || null;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

// ============================================================
// COMPROBAR SI EXISTE UNA EVALUACIÓN PARA EL TIPO
// ============================================================

exports.getEvaluacionByTipoCalificacionId = async (tipoCalificacionId) => {
  const query = `
    SELECT
      id,
      tipo_calificacion_id,
      estado

    FROM evaluacion

    WHERE tipo_calificacion_id = $1

    LIMIT 1;
  `;

  const { rows } = await pool.query(query, [tipoCalificacionId]);

  return rows[0] || null;
};

exports.getTipoCalificacionById = async (tipoCalificacionId) => {
  const query = `
    SELECT
      id,
      codigo,
      tipo,
      descripcion,
      objetivo,
      estado
    FROM tipo_calificacion
    WHERE id = $1
    LIMIT 1;
  `;

  const { rows } = await pool.query(query, [tipoCalificacionId]);

  return rows[0] || null;
};
