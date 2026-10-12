const pool = require("../../database/pool");

// ============================================================
// PIA - MÓDULO CALIFICACIÓN
// Capa: repository
// ============================================================

// ============================================================
// OBTENER CLIENTE POR TOKEN
// ============================================================

async function getClienteByToken(token) {
  const query = `
    SELECT c.id
    FROM cliente c
    WHERE c.token = $1
    LIMIT 1;
  `;

  const { rows } = await pool.query(query, [token]);

  return rows[0] || null;
}

// ============================================================
// REGISTRAR CALIFICACIÓN Y ACTUALIZAR ESTADÍSTICAS
// ============================================================

async function registrarCalificacion(clienteId, datos) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // --------------------------------------------------------
    // 1. Verificar que la reserva pertenezca al cliente
    // --------------------------------------------------------

    const reservaQuery = `
      SELECT
        r.id,
        r.cliente_id,
        r.servicio_id,
        r.estado,
        s.profesional_id
      FROM reserva r
      INNER JOIN servicio s
        ON s.id = r.servicio_id
      WHERE r.id = $1
        AND r.cliente_id = $2
      FOR UPDATE OF r;
    `;

    const reservaResult = await client.query(reservaQuery, [
      datos.reserva_id,
      clienteId,
    ]);

    if (!reservaResult.rows.length) {
      const error = new Error(
        "La reserva no existe o no pertenece al cliente.",
      );
      error.status = 404;
      throw error;
    }

    const reserva = reservaResult.rows[0];

    // --------------------------------------------------------
    // 2. Verificar que la reserva esté completada
    // --------------------------------------------------------

    if (reserva.estado !== "COMPLETADA") {
      const error = new Error("Solo puedes calificar reservas completadas.");
      error.status = 400;
      throw error;
    }

    // --------------------------------------------------------
    // 3. Verificar que la evaluación esté habilitada
    // --------------------------------------------------------

    const evaluacionQuery = `
      SELECT
        e.id,
        e.estado,
        tc.estado AS tipo_estado
      FROM evaluacion e
      INNER JOIN tipo_calificacion tc
        ON tc.id = e.tipo_calificacion_id
      WHERE e.id = $1
      FOR UPDATE OF e;
    `;

    const evaluacionResult = await client.query(evaluacionQuery, [
      datos.evaluacion_id,
    ]);

    if (
      !evaluacionResult.rows.length ||
      evaluacionResult.rows[0].estado !== "HABILITADO" ||
      evaluacionResult.rows[0].tipo_estado !== "ACTIVO"
    ) {
      const error = new Error("La evaluación no existe o no está habilitada.");
      error.status = 400;
      throw error;
    }

    // --------------------------------------------------------
    // 4. Comprobar que exista la invitación para esta evaluación
    // --------------------------------------------------------

    const invitacionQuery = `
      SELECT 1
      FROM notificacion
      WHERE cliente_id = $1
        AND reserva_id = $2
        AND evaluacion_id = $3
        AND tipo = 'EVALUACION_PENDIENTE'
      LIMIT 1;
    `;

    const invitacionResult = await client.query(invitacionQuery, [
      clienteId,
      datos.reserva_id,
      datos.evaluacion_id,
    ]);

    if (!invitacionResult.rows.length) {
      const error = new Error(
        "No existe una invitación para calificar esta evaluación.",
      );
      error.status = 403;
      throw error;
    }

    // --------------------------------------------------------
    // 5. Insertar la calificación
    // --------------------------------------------------------

    const insertQuery = `
      INSERT INTO calificacion (
        evaluacion_id,
        reserva_id,
        cliente_id,
        profesional_id,
        servicio_id,
        puntaje,
        titulo,
        observacion,
        estado,
        fecha,
        hora
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        'ACTIVA',
        CURRENT_DATE,
        LOCALTIME(0)
      )
      RETURNING
        id,
        evaluacion_id,
        reserva_id,
        cliente_id,
        profesional_id,
        servicio_id,
        puntaje,
        titulo,
        observacion,
        estado,
        fecha,
        hora,
        created_at,
        updated_at;
    `;

    const insertValues = [
      datos.evaluacion_id,
      datos.reserva_id,
      clienteId,
      reserva.profesional_id,
      reserva.servicio_id,
      datos.puntaje,
      datos.titulo || null,
      datos.observacion || null,
    ];

    const insertResult = await client.query(insertQuery, insertValues);

    const calificacion = insertResult.rows[0];

    // --------------------------------------------------------
    // 6. Recalcular promedio y cantidad de calificaciones
    // --------------------------------------------------------

    const estadisticasQuery = `
      SELECT
        COALESCE(ROUND(AVG(puntaje), 2), 0) AS promedio,
        COUNT(*)::INTEGER AS cantidad
      FROM calificacion
      WHERE evaluacion_id = $1
        AND estado = 'ACTIVA';
    `;

    const estadisticasResult = await client.query(estadisticasQuery, [
      datos.evaluacion_id,
    ]);

    const estadisticas = estadisticasResult.rows[0];

    await client.query(
      `
        UPDATE evaluacion
        SET
          puntaje_promedio = $2,
          cantidad_calificaciones = $3,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1;
      `,
      [datos.evaluacion_id, estadisticas.promedio, estadisticas.cantidad],
    );

    // --------------------------------------------------------
    // 6.5. Marcar como leída la invitación calificada
    // --------------------------------------------------------

    const actualizarNotificacionQuery = `
      UPDATE notificacion
      SET
        estado = 'LEIDA',
        fecha_lectura = COALESCE(
          fecha_lectura,
          CURRENT_TIMESTAMP
        ),
        updated_at = CURRENT_TIMESTAMP
      WHERE cliente_id = $1
        AND reserva_id = $2
        AND evaluacion_id = $3
        AND tipo = 'EVALUACION_PENDIENTE'
      RETURNING id;
    `;

    const notificacionActualizada = await client.query(
      actualizarNotificacionQuery,
      [clienteId, datos.reserva_id, datos.evaluacion_id],
    );

    if (notificacionActualizada.rowCount === 0) {
      const error = new Error(
        "No se encontró la notificación asociada a esta evaluación y reserva.",
      );

      error.status = 409;
      throw error;
    }

    // --------------------------------------------------------
    // 7. Confirmar transacción
    // --------------------------------------------------------

    await client.query("COMMIT");

    return {
      ...calificacion,
      puntaje_promedio: estadisticas.promedio,
      cantidad_calificaciones: estadisticas.cantidad,
    };
  } catch (error) {
    await client.query("ROLLBACK");

    // La restricción UNIQUE protege también ante solicitudes
    // concurrentes para la misma reserva y evaluación.
    if (error.code === "23505") {
      const duplicado = new Error(
        "Ya calificaste esta evaluación para esta reserva.",
      );
      duplicado.status = 409;
      throw duplicado;
    }

    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  getClienteByToken,
  registrarCalificacion,
};
