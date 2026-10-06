const pool = require("../../database/pool");

/**
 * Obtiene los negocios activos asociados
 * al profesional autenticado.
 */
const getNegociosByProfesionalId = async (client, profesionalId) => {
  const query = `
    SELECT
      pn.negocio_id,
      pn.profesional_id
    FROM profesional_negocio pn
    INNER JOIN negocio n
      ON n.id = pn.negocio_id
    WHERE pn.profesional_id = $1
      AND pn.acceso = 'ACEPTADO'
      AND pn.estado = 'HABILITADO'
    ORDER BY pn.id DESC
  `;

  const { rows } = await client.query(query, [profesionalId]);

  return rows;
};

/**
 * Obtiene los horarios actuales del negocio.
 */
const getHorariosByNegocioId = async (client, negocioId) => {
  const query = `
    SELECT
      id,
      negocio_id,
      dia_semana,
      turno,
      TO_CHAR(hora_inicio, 'HH24:MI') AS hora_inicio,
      TO_CHAR(hora_fin, 'HH24:MI') AS hora_fin
    FROM horario
    WHERE negocio_id = $1
    ORDER BY
      dia_semana,
      turno
  `;

  const { rows } = await client.query(query, [negocioId]);

  return rows;
};

/**
 * Actualiza un horario existente.
 */
const updateHorario = async (client, horarioId, horaInicio, horaFin) => {
  const query = `
    UPDATE horario
    SET
      hora_inicio = $1,
      hora_fin = $2,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $3
    RETURNING
      id,
      negocio_id,
      dia_semana,
      turno,
      TO_CHAR(hora_inicio, 'HH24:MI') AS hora_inicio,
      TO_CHAR(hora_fin, 'HH24:MI') AS hora_fin
  `;

  const { rows } = await client.query(query, [horaInicio, horaFin, horarioId]);

  return rows[0];
};

/**
 * Crea un nuevo horario.
 */
const createHorario = async (
  client,
  negocioId,
  diaSemana,
  turno,
  horaInicio,
  horaFin,
) => {
  const query = `
    INSERT INTO horario (
      negocio_id,
      dia_semana,
      turno,
      hora_inicio,
      hora_fin
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING
      id,
      negocio_id,
      dia_semana,
      turno,
      TO_CHAR(hora_inicio, 'HH24:MI') AS hora_inicio,
      TO_CHAR(hora_fin, 'HH24:MI') AS hora_fin
  `;

  const { rows } = await client.query(query, [
    negocioId,
    diaSemana,
    turno,
    horaInicio,
    horaFin,
  ]);

  return rows[0];
};

/**
 * Verifica si un horario tiene profesionales asignados.
 */
const horarioTieneProfesionales = async (client, horarioId) => {
  const query = `
    SELECT EXISTS (
      SELECT 1
      FROM horario_profesional
      WHERE horario_id = $1
    ) AS tiene_profesionales
  `;

  const { rows } = await client.query(query, [horarioId]);

  return rows[0].tiene_profesionales;
};

/**
 * Verifica si un horario tiene slots asociados
 * indirectamente mediante horario_profesional.
 */
const horarioTieneSlots = async (client, horarioId) => {
  const query = `
    SELECT EXISTS (
      SELECT 1
      FROM horario_profesional hp
      INNER JOIN slot s
        ON s.horario_profesional_id = hp.id
      WHERE hp.horario_id = $1
    ) AS tiene_slots
  `;

  const { rows } = await client.query(query, [horarioId]);

  return rows[0].tiene_slots;
};

/**
 * Elimina un horario solamente si todavía
 * no tiene dependencias.
 */
const deleteHorario = async (client, horarioId) => {
  const query = `
    DELETE FROM horario
    WHERE id = $1
    RETURNING id
  `;

  const { rows } = await client.query(query, [horarioId]);

  return rows[0];
};

/**
 * Obtiene el negocio asociado al profesional.
 */
const getBusinessByProfessionalId = async (client, profesionalId) => {
  const query = `
    SELECT
      pn.negocio_id,
      n.nombre AS negocio_nombre,
      n.slug AS negocio_slug

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

module.exports = {
  getNegociosByProfesionalId,
  getHorariosByNegocioId,
  updateHorario,
  createHorario,
  horarioTieneProfesionales,
  horarioTieneSlots,
  deleteHorario,

  getBusinessByProfessionalId,
  getHorariosByNegocioId,
};
