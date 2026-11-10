const pool = require("../../database/pool");

// ============================================================
// OBTENER EVALUACIÓN PARA CLIENTE
//
// La reserva determina:
// - Servicio
// - Profesional
// - Negocio
//
// La evaluación determina:
// - Criterio de calificación
// - Objetivo
// ============================================================

async function getEvaluacionParaCliente(clienteToken, evaluacionId, reservaId) {
	const query = `
    SELECT
      e.id,
      e.tipo_calificacion_id,

      tc.codigo AS tipo_codigo,
      tc.tipo AS tipo_nombre,
      tc.descripcion AS tipo_descripcion,
      tc.objetivo,

      e.puntaje_promedio,
      e.cantidad_calificaciones,

      e.estado AS evaluacion_estado,
      tc.estado AS tipo_estado,

      -- ================================================
      -- SERVICIO DE LA RESERVA
      -- ================================================

      r.servicio_id,
      s.nombre AS servicio_nombre,

      -- ================================================
      -- PROFESIONAL DEL SERVICIO
      -- ================================================

      s.profesional_id,
      pp.nombre AS profesional_nombre,

      -- ================================================
      -- NEGOCIO DE LA RESERVA
      -- ================================================

      COALESCE(
        negocio_reserva.negocio_id,
        h.negocio_id
      ) AS negocio_id,

      ne.nombre AS negocio_nombre,

      -- ================================================
      -- NOMBRE SEGÚN OBJETIVO
      -- ================================================

      CASE tc.objetivo
        WHEN 'SERVICIO' THEN s.nombre
        WHEN 'PROFESIONAL' THEN pp.nombre
        WHEN 'NEGOCIO' THEN ne.nombre
        WHEN 'PIA' THEN 'PIA'
        ELSE NULL
      END AS objetivo_nombre

    FROM cliente c

    INNER JOIN notificacion n
      ON n.cliente_id = c.id

    INNER JOIN reserva r
      ON r.id = n.reserva_id
     AND r.cliente_id = c.id

    INNER JOIN servicio s
      ON s.id = r.servicio_id

    INNER JOIN profesional p
      ON p.id = s.profesional_id

    INNER JOIN persona pp
      ON pp.id = p.persona_id

    INNER JOIN evaluacion e
      ON e.id = n.evaluacion_id

    INNER JOIN tipo_calificacion tc
      ON tc.id = e.tipo_calificacion_id

    -- ================================================
    -- NEGOCIO OBTENIDO DESDE LOS SLOTS DE LA RESERVA
    -- ================================================

    LEFT JOIN LATERAL (
      SELECT
        h2.negocio_id

      FROM reserva_slot rs

      INNER JOIN slot sl
        ON sl.id = rs.slot_id

      INNER JOIN horario_profesional hp
        ON hp.id = sl.horario_profesional_id

      INNER JOIN horario h2
        ON h2.id = hp.horario_id

      WHERE rs.reserva_id = r.id

      ORDER BY rs.id

      LIMIT 1

    ) negocio_reserva ON TRUE

    -- ================================================
    -- HISTORIAL DE LA RESERVA
    -- RESPALDO DEL NEGOCIO
    -- ================================================

    LEFT JOIN historial h
      ON h.reserva_id = r.id

    LEFT JOIN negocio ne
      ON ne.id = COALESCE(
        negocio_reserva.negocio_id,
        h.negocio_id
      )

    WHERE c.token = $1

      AND n.reserva_id = $2

      AND n.evaluacion_id = $3

      AND n.tipo = 'EVALUACION_PENDIENTE'

    ORDER BY n.id DESC

    LIMIT 1;
  `;

	const { rows } = await pool.query(query, [
		clienteToken,
		reservaId,
		evaluacionId,
	]);

	return rows[0] || null;
}

module.exports = {
	getEvaluacionParaCliente,
};
