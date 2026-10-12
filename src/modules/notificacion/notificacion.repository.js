const pool = require("../../database/pool");

// ============================================================
// OBTENER CLIENTE POR TOKEN
// ============================================================

async function getClienteByToken(client, token) {
  const query = `
    SELECT
      c.id,
      c.persona_id,
      c.alias,
      c.telefono,
      per.nombre
    FROM cliente c

    INNER JOIN persona per
      ON per.id = c.persona_id

    WHERE c.token = $1

    LIMIT 1
  `;

  const { rows } = await client.query(query, [token]);

  return rows[0] || null;
}

// ============================================================
// OBTENER NOTIFICACIONES DEL CLIENTE
// ============================================================

async function getNotificacionesByCliente(client, clienteId) {
  const query = `
    SELECT
      n.id,
      n.cliente_id,

      n.reserva_id,
      n.evaluacion_id,
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
      n.updated_at,

      CASE
        WHEN n.tipo = 'EVALUACION_PENDIENTE'
          AND EXISTS (
            SELECT 1
            FROM calificacion c
            WHERE c.reserva_id = n.reserva_id
              AND c.evaluacion_id = n.evaluacion_id
              AND c.cliente_id = n.cliente_id
              AND c.estado = 'ACTIVA'
          )
        THEN TRUE
        ELSE FALSE
      END AS calificada

    FROM notificacion n

    WHERE n.cliente_id = $1

    ORDER BY
      n.created_at DESC,
      n.id DESC
  `;

  const { rows } = await client.query(query, [clienteId]);

  return rows;
}

// ============================================================
// OBTENER NOTIFICACIONES NO LEÍDAS
// ============================================================

async function getNotificacionesNoLeidasByCliente(client, clienteId) {
  const query = `
    SELECT
      n.id,
      n.cliente_id,

      n.reserva_id,
      n.evaluacion_id,
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
      n.updated_at,

      CASE
        WHEN n.tipo = 'EVALUACION_PENDIENTE'
          AND EXISTS (
            SELECT 1
            FROM calificacion c
            WHERE c.reserva_id = n.reserva_id
              AND c.evaluacion_id = n.evaluacion_id
              AND c.cliente_id = n.cliente_id
              AND c.estado = 'ACTIVA'
          )
        THEN TRUE
        ELSE FALSE
      END AS calificada

    FROM notificacion n

    WHERE n.cliente_id = $1
      AND n.estado = 'NO_LEIDA'

    ORDER BY
      n.created_at DESC,
      n.id DESC
  `;

  const { rows } = await client.query(query, [clienteId]);

  return rows;
}

// ============================================================
// OBTENER UNA NOTIFICACIÓN
// ============================================================

async function getNotificacionById(client, notificacionId, clienteId) {
  const query = `
    SELECT
      n.id,
      n.cliente_id,

      n.reserva_id,
      n.evaluacion_id,
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
      n.updated_at,

      CASE
        WHEN n.tipo = 'EVALUACION_PENDIENTE'
          AND EXISTS (
            SELECT 1
            FROM calificacion c
            WHERE c.reserva_id = n.reserva_id
              AND c.evaluacion_id = n.evaluacion_id
              AND c.cliente_id = n.cliente_id
              AND c.estado = 'ACTIVA'
          )
        THEN TRUE
        ELSE FALSE
      END AS calificada

    FROM notificacion n

    WHERE n.id = $1
      AND n.cliente_id = $2

    LIMIT 1
  `;

  const { rows } = await client.query(query, [notificacionId, clienteId]);

  return rows[0] || null;
}

// ============================================================
// MARCAR UNA NOTIFICACIÓN COMO LEÍDA
// ============================================================

async function marcarComoLeida(client, notificacionId, clienteId) {
  const query = `
    UPDATE notificacion

    SET
      estado = 'LEIDA',
      fecha_lectura = COALESCE(
        fecha_lectura,
        CURRENT_TIMESTAMP
      ),
      updated_at = CURRENT_TIMESTAMP

    WHERE id = $1
      AND cliente_id = $2

    RETURNING
      id,
      cliente_id,

      reserva_id,
      evaluacion_id,
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

  const { rows } = await client.query(query, [notificacionId, clienteId]);

  return rows[0] || null;
}

// ============================================================
// MARCAR TODAS COMO LEÍDAS
// ============================================================

async function marcarTodasComoLeidas(client, clienteId) {
  const query = `
    UPDATE notificacion

    SET
      estado = 'LEIDA',
      fecha_lectura = COALESCE(
        fecha_lectura,
        CURRENT_TIMESTAMP
      ),
      updated_at = CURRENT_TIMESTAMP

    WHERE cliente_id = $1
      AND estado = 'NO_LEIDA'
      AND tipo <> 'EVALUACION_PENDIENTE'

    RETURNING id
  `;

  const { rows } = await client.query(query, [clienteId]);

  return rows;
}

// ============================================================
// CREAR NOTIFICACIÓN
// ============================================================
//
// Esta función NO se expone directamente por una ruta.
// Será utilizada posteriormente por otros módulos:
//
// reserva
// pago
// promoción
// descuento
// etc.
// ============================================================

async function crearNotificacion(client, datos) {
  const query = `
    INSERT INTO notificacion (
      cliente_id,
      reserva_id,
      evaluacion_id,
      pago_id,
      membresia_id,
      reclamo_id,
      promocion_id,
      descuento_id,
      servicio_id,
      titulo,
      mensaje,
      tipo,
      estado
    )
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
      'NO_LEIDA'
    )
    RETURNING
      id,
      cliente_id,
      reserva_id,
      evaluacion_id,
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

  const values = [
    datos.cliente_id,
    datos.reserva_id || null,
    datos.evaluacion_id || null,
    datos.pago_id || null,
    datos.membresia_id || null,
    datos.reclamo_id || null,
    datos.promocion_id || null,
    datos.descuento_id || null,
    datos.servicio_id || null,
    datos.titulo,
    datos.mensaje,
    datos.tipo,
  ];

  const { rows } = await client.query(query, values);

  return rows[0];
}

async function crearNotificacionProfesional(client, datos) {
  const query = `
    INSERT INTO notificacion (
      profesional_id,
      reserva_id,
      pago_id,
      servicio_id,
      titulo,
      mensaje,
      tipo,
      estado
    )
    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5,
      $6,
      $7,
      'NO_LEIDA'
    )
    RETURNING
      id,
      profesional_id,
      reserva_id,
      pago_id,
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

  const values = [
    datos.profesional_id,
    datos.reserva_id || null,
    datos.pago_id || null,
    datos.servicio_id || null,
    datos.titulo,
    datos.mensaje,
    datos.tipo,
  ];

  const { rows } = await client.query(query, values);

  return rows[0];
}

module.exports = {
  getClienteByToken,

  getNotificacionesByCliente,
  getNotificacionesNoLeidasByCliente,
  getNotificacionById,

  marcarComoLeida,
  marcarTodasComoLeidas,

  crearNotificacion,
  crearNotificacionProfesional,
};
