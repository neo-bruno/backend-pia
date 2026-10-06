const pool = require("../../database/pool");

// ============================================================
// OBTENER PROFESIONAL DEL USUARIO AUTENTICADO
// ============================================================

exports.obtenerProfesionalIdPorUsuario = async (usuarioId) => {
  const query = `
    SELECT
      p.id AS profesional_id
    FROM usuario u
    INNER JOIN profesional p
      ON p.persona_id = u.persona_id
    WHERE u.id = $1
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [usuarioId]);

  return rows[0]?.profesional_id || null;
};

// ============================================================
// OBTENER TODAS LAS NOTIFICACIONES DEL PROFESIONAL
// ============================================================

exports.obtenerNotificaciones = async (profesionalId) => {
  const query = `
    SELECT
      n.id,
      n.profesional_id,
      n.reserva_id,
      n.pago_id,
      n.membresia_id,
      n.reclamo_id,
      n.promocion_id,
      n.descuento_id,
      n.servicio_id,
      n.titulo,
      n.mensaje,
      n.tipo,
      n.estado,
      n.fecha_creacion,
      n.fecha_lectura,
      n.created_at,
      n.updated_at
    FROM notificacion n
    WHERE n.profesional_id = $1
    ORDER BY
      n.created_at DESC,
      n.id DESC
  `;

  const { rows } = await pool.query(query, [profesionalId]);

  return rows;
};

// ============================================================
// OBTENER SOLAMENTE LAS NO LEÍDAS
// ============================================================

exports.obtenerNotificacionesNoLeidas = async (profesionalId) => {
  const query = `
    SELECT
      n.id,
      n.profesional_id,
      n.reserva_id,
      n.pago_id,
      n.membresia_id,
      n.reclamo_id,
      n.promocion_id,
      n.descuento_id,
      n.servicio_id,
      n.titulo,
      n.mensaje,
      n.tipo,
      n.estado,
      n.fecha_creacion,
      n.fecha_lectura,
      n.created_at,
      n.updated_at
    FROM notificacion n
    WHERE n.profesional_id = $1
      AND n.estado = 'NO_LEIDA'
    ORDER BY
      n.created_at DESC,
      n.id DESC
  `;

  const { rows } = await pool.query(query, [profesionalId]);

  return rows;
};

// ============================================================
// OBTENER UNA NOTIFICACIÓN
// ============================================================

exports.obtenerNotificacionPorId = async (profesionalId, notificacionId) => {
  const query = `
    SELECT
      n.id,
      n.profesional_id,
      n.reserva_id,
      n.pago_id,
      n.membresia_id,
      n.reclamo_id,
      n.promocion_id,
      n.descuento_id,
      n.servicio_id,
      n.titulo,
      n.mensaje,
      n.tipo,
      n.estado,
      n.fecha_creacion,
      n.fecha_lectura,
      n.created_at,
      n.updated_at
    FROM notificacion n
    WHERE n.id = $1
      AND n.profesional_id = $2
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [notificacionId, profesionalId]);

  return rows[0] || null;
};

// ============================================================
// MARCAR UNA NOTIFICACIÓN COMO LEÍDA
// ============================================================

exports.marcarComoLeida = async (profesionalId, notificacionId) => {
  const query = `
    UPDATE notificacion
    SET
      estado = 'LEIDA',
      fecha_lectura = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
      AND profesional_id = $2
    RETURNING
      id,
      profesional_id,
      reserva_id,
      pago_id,
      membresia_id,
      reclamo_id,
      promocion_id,
      descuento_id,
      servicio_id,
      titulo,
      mensaje,
      tipo,
      estado,
      fecha_creacion,
      fecha_lectura,
      created_at,
      updated_at
  `;

  const { rows } = await pool.query(query, [notificacionId, profesionalId]);

  return rows[0] || null;
};

// ============================================================
// MARCAR TODAS COMO LEÍDAS
// ============================================================

exports.marcarTodasComoLeidas = async (profesionalId) => {
  const query = `
    UPDATE notificacion
    SET
      estado = 'LEIDA',
      fecha_lectura = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE profesional_id = $1
      AND estado = 'NO_LEIDA'
  `;

  const result = await pool.query(query, [profesionalId]);

  return result.rowCount;
};
