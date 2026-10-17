const pool = require("../../database/pool");

// =====================================================
// OBTENER SLOTS DEL PROFESIONAL
// =====================================================

const getSlotsByProfesionalId = async (client, profesionalId) => {
  const query = `
    SELECT

      -- =================================================
      -- PROFESIONAL
      -- =================================================

      p.id AS profesional_id,
      per.nombre AS profesional_nombre,

      -- =================================================
      -- HORARIO_PROFESIONAL
      -- =================================================

      hp.id AS horario_profesional_id,

      -- =================================================
      -- HORARIO
      -- =================================================

      h.id AS horario_id,
      h.dia_semana,
      h.turno,

      TO_CHAR(
        h.hora_inicio,
        'HH24:MI'
      ) AS horario_inicio,

      TO_CHAR(
        h.hora_fin,
        'HH24:MI'
      ) AS horario_fin,

      -- =================================================
      -- SLOT
      -- =================================================

      s.id AS slot_id,

      TO_CHAR(
        s.hora_inicio,
        'HH24:MI'
      ) AS slot_inicio,

      TO_CHAR(
        s.hora_fin,
        'HH24:MI'
      ) AS slot_fin,

      s.duracion,

      s.estado AS slot_estado

    FROM horario_profesional hp

    INNER JOIN profesional p
      ON p.id = hp.profesional_id

    INNER JOIN persona per
      ON per.id = p.persona_id

    INNER JOIN horario h
      ON h.id = hp.horario_id

    LEFT JOIN slot s
      ON s.horario_profesional_id = hp.id

    WHERE hp.profesional_id = $1

    ORDER BY
      h.dia_semana ASC,
      h.turno ASC,
      s.hora_inicio ASC
  `;

  const { rows } = await client.query(query, [profesionalId]);

  return rows;
};

// =====================================================
// NEGOCIO DEL PROFESIONAL
// =====================================================
//
// Se conserva porque puede ser utilizado por otros
// módulos o métodos.
//
// NO se utiliza para guardar slots.
// =====================================================

const getNegocioByProfesionalId = async (client, profesionalId) => {
  const query = `
    SELECT
      pn.negocio_id,
      pn.profesional_id,
      pn.acceso,
      pn.estado,
      n.nombre AS negocio_nombre

    FROM profesional_negocio pn

    INNER JOIN negocio n
      ON n.id = pn.negocio_id

    WHERE pn.profesional_id = $1
      AND pn.acceso = 'ACEPTADO'
      AND pn.estado = 'HABILITADO'

    ORDER BY pn.id DESC

    LIMIT 1
  `;

  const { rows } = await client.query(query, [profesionalId]);

  return rows[0] || null;
};

// =====================================================
// HORARIOS PROFESIONALES
// =====================================================

const getHorariosProfesionales = async (client, profesionalId) => {
  const query = `
    SELECT

      hp.id AS horario_profesional_id,
      hp.horario_id,
      hp.profesional_id,

      h.negocio_id,
      h.dia_semana,
      h.turno,

      TO_CHAR(
        h.hora_inicio,
        'HH24:MI'
      ) AS hora_inicio,

      TO_CHAR(
        h.hora_fin,
        'HH24:MI'
      ) AS hora_fin

    FROM horario_profesional hp

    INNER JOIN horario h
      ON h.id = hp.horario_id

    WHERE hp.profesional_id = $1

    ORDER BY
      h.dia_semana ASC,
      h.turno ASC
  `;

  const { rows } = await client.query(query, [profesionalId]);

  return rows;
};

// =====================================================
// SLOTS ACTUALES
// =====================================================

const getSlotsActuales = async (client, profesionalId) => {
  const query = `
    SELECT
      s.id AS slot_id,
      hp.id AS horario_profesional_id,
      hp.profesional_id,

      h.id AS horario_id,
      h.negocio_id,
      h.dia_semana,
      h.turno,

      TO_CHAR(s.hora_inicio, 'HH24:MI') AS hora_inicio,
      TO_CHAR(s.hora_fin, 'HH24:MI') AS hora_fin,

      s.duracion,
      
      s.estado AS slot_estado

    FROM slot s

    INNER JOIN horario_profesional hp
      ON hp.id = s.horario_profesional_id

    INNER JOIN horario h
      ON h.id = hp.horario_id

    WHERE hp.profesional_id = $1

    ORDER BY
      h.dia_semana ASC,
      h.turno ASC,
      s.hora_inicio ASC
  `;

  const { rows } = await client.query(query, [profesionalId]);

  return rows;
};

// =====================================================
// SLOT POR ID
// =====================================================

const getSlotById = async (client, slotId) => {
  const query = `
    SELECT

      s.id,
      s.horario_profesional_id,
      s.hora_inicio,
      s.hora_fin,
      s.duracion,
      s.estado

    FROM slot s

    WHERE s.id = $1

    FOR UPDATE
  `;

  const { rows } = await client.query(query, [slotId]);

  return rows[0] || null;
};

// =====================================================
// RESERVA CONFIRMADA
// =====================================================
const tieneReservaConfirmada = async (client, slotId) => {
  const query = `
    SELECT 1

    FROM reserva_slot rs

    INNER JOIN reserva r
      ON r.id = rs.reserva_id

    WHERE rs.slot_id = $1
      AND rs.activo = TRUE
      AND r.estado = 'CONFIRMADA'

    LIMIT 1
  `;

  const { rows } = await client.query(query, [slotId]);

  return rows.length > 0;
};

// =====================================================
// CREAR SLOT
// =====================================================

const crearSlot = async (client, slot) => {
  const query = `
    INSERT INTO slot (
      horario_profesional_id,
      hora_inicio,
      hora_fin,
      duracion,
      estado
    )

    VALUES (
      $1,
      $2,
      $3,
      $4,
      $5
    )

    RETURNING

      id AS slot_id,
      horario_profesional_id,
      hora_inicio,
      hora_fin,
      duracion,
      estado
  `;

  const { rows } = await client.query(query, [
    slot.horario_profesional_id,
    slot.hora_inicio,
    slot.hora_fin,
    slot.duracion,
    slot.estado,
  ]);

  return rows[0];
};

// =====================================================
// MODIFICAR SLOT
// =====================================================

// =====================================================
// MODIFICAR SLOT
// =====================================================

const modificarSlot = async (client, slotId, datos) => {
  const query = `
    UPDATE slot
    SET
      hora_inicio = $1,
      hora_fin = $2,
      duracion = $3,
      estado = $4
    WHERE id = $5
    RETURNING
      id,
      horario_profesional_id,
      hora_inicio,
      hora_fin,
      duracion,
      estado;
  `;

  const values = [
    datos.hora_inicio,
    datos.hora_fin,
    datos.duracion,
    datos.estado,
    slotId,
  ];

  const result = await client.query(query, values);

  return result.rows[0] || null;
};

// =====================================================
// ELIMINAR SLOT
// =====================================================

const eliminarSlot = async (client, slotId) => {
  const query = `
    DELETE FROM slot

    WHERE id = $1

    RETURNING
      id AS slot_id
  `;

  const { rows } = await client.query(query, [slotId]);

  return rows[0] || null;
};

/**
 * Comprueba si el slot tiene alguna relación con una reserva.
 *
 * No filtra por activo ni por estado de la reserva:
 * PostgreSQL no permite eliminar el slot mientras exista
 * una referencia en reserva_slot.
 */
const tieneRelacionReserva = async (client, slotId) => {
  const query = `
    SELECT EXISTS (
      SELECT 1
      FROM reserva_slot rs
      WHERE rs.slot_id = $1
    ) AS tiene_reserva
  `;

  const { rows } = await client.query(query, [slotId]);

  return rows[0]?.tiene_reserva === true;
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  getSlotsByProfesionalId,

  getNegocioByProfesionalId,

  getHorariosProfesionales,

  getSlotsActuales,

  getSlotById,

  tieneReservaConfirmada,

  crearSlot,

  modificarSlot,

  eliminarSlot,
  tieneRelacionReserva,
};
