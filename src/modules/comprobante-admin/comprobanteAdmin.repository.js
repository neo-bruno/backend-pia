const pool = require("../../database/pool");

// ============================================================
// BUSCAR COMPROBANTE
// ============================================================

exports.obtenerComprobantePorId = async (comprobanteId) => {
  const query = `
    SELECT
      c.id,
      c.pago_id,
      c.archivo_id,
      c.estado,
      c.observacion,
      c.validado_por_profesional_id,
      c.validado_por_gerencia_id,
      c.fecha_validacion,
      c.created_at,
      c.updated_at
    FROM comprobante c
    WHERE c.id = $1
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [comprobanteId]);

  return rows[0] || null;
};

// ============================================================
// OBTENER INFORMACIÓN DEL COMPROBANTE PARA NOTIFICACIÓN
// ============================================================

exports.obtenerDatosComprobante = async (client, comprobanteId) => {
  const query = `
    SELECT
      c.id AS comprobante_id,
      c.pago_id,
      p.reserva_id,
      r.cliente_id,
      r.numero AS reserva_numero
    FROM comprobante c
    INNER JOIN pago p
      ON p.id = c.pago_id
    INNER JOIN reserva r
      ON r.id = p.reserva_id
    WHERE c.id = $1
    LIMIT 1
  `;

  const { rows } = await client.query(query, [comprobanteId]);

  return rows[0] || null;
};

// ============================================================
// CAMBIAR ESTADO
// ============================================================

exports.cambiarEstado = async (
  client,
  comprobanteId,
  estado,
  profesionalId,
  observacion = null,
) => {
  const query = `
    UPDATE comprobante
    SET
      estado = $1,
      observacion = $2,
      validado_por_profesional_id = $3,
      fecha_validacion = CURRENT_TIMESTAMP,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $4
    RETURNING
      id,
      pago_id,
      archivo_id,
      estado,
      observacion,
      validado_por_profesional_id,
      validado_por_gerencia_id,
      fecha_validacion,
      created_at,
      updated_at
  `;

  const values = [estado, observacion, profesionalId, comprobanteId];

  const { rows } = await client.query(query, values);

  return rows[0] || null;
};
