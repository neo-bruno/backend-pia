// =====================================================
// bloqueo.repository.js
// =====================================================

const pool = require("../../database/pool");

// =====================================================
// REGISTRAR BLOQUEO
// Recibe un client para trabajar dentro de una transacción.
// =====================================================

const crearBloqueo = async (client, datos) => {
  const query = `
    INSERT INTO bloqueo (
      negocio_id,
      profesional_id,
      fecha,
      hora_inicio,
      hora_fin,
      motivo,
      estado
    )
    VALUES ($1, $2, $3, $4, $5, $6, 'ACTIVO')
    RETURNING
      id,
      negocio_id,
      profesional_id,
      fecha,
      hora_inicio,
      hora_fin,
      motivo,
      estado,
      created_at
  `;

  const values = [
    datos.negocio_id,
    datos.profesional_id,
    datos.fecha,
    datos.hora_inicio,
    datos.hora_fin,
    datos.motivo || null,
  ];

  const { rows } = await client.query(query, values);

  return rows[0];
};

// =====================================================
// OBTENER SLOTS QUE SE SUPERPONEN CON EL BLOQUEO
// La fecha determina el día semanal del horario.
// =====================================================

const obtenerSlotsAfectados = async (
  client,
  negocioId,
  profesionalId,
  fecha,
  horaInicio,
  horaFin,
) => {
  const query = `
    SELECT
      s.id AS slot_id,
      s.hora_inicio,
      s.hora_fin,
      s.estado AS slot_estado,
      hp.id AS horario_profesional_id,
      h.id AS horario_id
    FROM horario_profesional hp
    INNER JOIN horario h
      ON h.id = hp.horario_id
    INNER JOIN slot s
      ON s.horario_profesional_id = hp.id
    WHERE h.negocio_id = $1
      AND hp.profesional_id = $2
      AND h.dia_semana =
        EXTRACT(ISODOW FROM $3::DATE)::INTEGER
      AND s.hora_inicio < $5::TIME
      AND s.hora_fin > $4::TIME
    ORDER BY s.hora_inicio ASC
    FOR UPDATE OF s
  `;

  const values = [negocioId, profesionalId, fecha, horaInicio, horaFin];

  const { rows } = await client.query(query, values);

  return rows;
};

// =====================================================
// VERIFICAR RESERVAS ACTIVAS EN LOS SLOTS
// =====================================================

const obtenerReservasActivasDeSlots = async (client, slotsIds, fecha) => {
  if (!Array.isArray(slotsIds) || slotsIds.length === 0) {
    return [];
  }

  const query = `
    SELECT DISTINCT
      s.id AS slot_id,
      r.id AS reserva_id,
      r.numero AS reserva_numero,
      r.fecha,
      r.hora_inicio,
      r.hora_fin,
      r.estado
    FROM slot s
    INNER JOIN reserva_slot rs
      ON rs.slot_id = s.id
      AND rs.activo = TRUE
    INNER JOIN reserva r
      ON r.id = rs.reserva_id
      AND r.fecha = $2::DATE
      AND r.estado IN ('PENDIENTE', 'CONFIRMADA')
    WHERE s.id = ANY($1::INTEGER[])
    ORDER BY s.id
  `;

  const { rows } = await client.query(query, [slotsIds, fecha]);

  return rows;
};

// =====================================================
// VERIFICAR SLOTS CON RELACIONES ACTIVAS
// Detecta reservas u otros bloqueos antes de insertar.
// =====================================================

const obtenerSlotsConRelacionActiva = async (client, slotsIds, fecha) => {
  if (!Array.isArray(slotsIds) || slotsIds.length === 0) {
    return [];
  }

  const query = `
    SELECT
      rs.slot_id,
      rs.reserva_id,
      rs.bloqueo_id
    FROM reserva_slot rs

    LEFT JOIN reserva r
      ON r.id = rs.reserva_id
      AND r.fecha = $2::DATE
      AND r.estado IN ('PENDIENTE', 'CONFIRMADA')

    LEFT JOIN bloqueo b
      ON b.id = rs.bloqueo_id
      AND b.fecha = $2::DATE
      AND b.estado = 'ACTIVO'

    WHERE rs.slot_id = ANY($1::INTEGER[])
      AND rs.activo = TRUE
      AND (
        r.id IS NOT NULL
        OR b.id IS NOT NULL
      )

    ORDER BY rs.slot_id
  `;

  const { rows } = await client.query(query, [slotsIds, fecha]);

  return rows;
};

// =====================================================
// RELACIONAR SLOT CON BLOQUEO
// No modifica slot.estado.
// No ignora conflictos del índice único.
// =====================================================

const relacionarSlotConBloqueo = async (client, bloqueoId, slotId, orden) => {
  const query = `
    INSERT INTO reserva_slot (
      reserva_id,
      slot_id,
      orden,
      activo,
      bloqueo_id
    )
    VALUES (
      NULL,
      $1,
      $2,
      TRUE,
      $3
    )
    RETURNING
      id,
      reserva_id,
      slot_id,
      orden,
      activo,
      bloqueo_id,
      created_at
  `;

  const { rows } = await client.query(query, [slotId, orden, bloqueoId]);

  return rows[0];
};

// =====================================================
// OBTENER BLOQUEOS POR FECHA Y PROFESIONAL
// =====================================================

const obtenerBloqueosPorFecha = async (
  client,
  negocioId,
  profesionalId,
  fecha,
) => {
  const query = `
    SELECT
      b.id,
      b.negocio_id,
      b.profesional_id,
      b.fecha,
      b.hora_inicio,
      b.hora_fin,
      b.motivo,
      b.estado,
      b.created_at,
      COUNT(rs.id)::INTEGER AS cantidad_slots
    FROM bloqueo b
    LEFT JOIN reserva_slot rs
      ON rs.bloqueo_id = b.id
      AND rs.activo = TRUE
    WHERE b.negocio_id = $1
      AND b.profesional_id = $2
      AND b.fecha = $3::DATE
    GROUP BY
      b.id,
      b.negocio_id,
      b.profesional_id,
      b.fecha,
      b.hora_inicio,
      b.hora_fin,
      b.motivo,
      b.estado,
      b.created_at
    ORDER BY b.hora_inicio ASC, b.id ASC
  `;

  const { rows } = await client.query(query, [negocioId, profesionalId, fecha]);

  return rows;
};

// =====================================================
// OBTENER BLOQUEO POR ID
// =====================================================

const obtenerBloqueoPorId = async (
  client,
  bloqueoId,
  negocioId,
  profesionalId,
) => {
  const query = `
    SELECT
      id,
      negocio_id,
      profesional_id,
      fecha,
      hora_inicio,
      hora_fin,
      motivo,
      estado,
      created_at
    FROM bloqueo
    WHERE id = $1
      AND negocio_id = $2
      AND profesional_id = $3
    LIMIT 1
    FOR UPDATE
  `;

  const { rows } = await client.query(query, [
    bloqueoId,
    negocioId,
    profesionalId,
  ]);

  return rows[0] || null;
};

// =====================================================
// CANCELAR BLOQUEO
// Conserva el registro histórico.
// =====================================================

const cancelarBloqueo = async (client, bloqueoId, negocioId, profesionalId) => {
  const query = `
    UPDATE bloqueo
    SET estado = 'CANCELADO'
    WHERE id = $1
      AND negocio_id = $2
      AND profesional_id = $3
      AND estado = 'ACTIVO'
    RETURNING
      id,
      negocio_id,
      profesional_id,
      fecha,
      hora_inicio,
      hora_fin,
      motivo,
      estado,
      created_at
  `;

  const { rows } = await client.query(query, [
    bloqueoId,
    negocioId,
    profesionalId,
  ]);

  return rows[0] || null;
};

// =====================================================
// DESACTIVAR RELACIONES DEL BLOQUEO
// Conserva las filas históricas de reserva_slot.
// =====================================================

const desactivarRelacionesDelBloqueo = async (client, bloqueoId) => {
  const query = `
    UPDATE reserva_slot
    SET activo = FALSE
    WHERE bloqueo_id = $1
      AND activo = TRUE
    RETURNING id, slot_id, bloqueo_id, activo
  `;

  const { rows } = await client.query(query, [bloqueoId]);

  return rows;
};

// =====================================================
// EXPORTACIONES
// =====================================================

module.exports = {
  crearBloqueo,
  obtenerSlotsAfectados,
  obtenerReservasActivasDeSlots,
  obtenerSlotsConRelacionActiva,

  relacionarSlotConBloqueo,
  obtenerBloqueosPorFecha,
  obtenerBloqueoPorId,
  cancelarBloqueo,
  desactivarRelacionesDelBloqueo,
};
