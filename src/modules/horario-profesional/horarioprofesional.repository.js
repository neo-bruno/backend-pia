const pool = require("../../database/pool");

/**
 * Obtiene el negocio asociado al profesional
 * que está realizando la operación.
 */
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

/**
 * Verifica que todos los horarios pertenezcan
 * al negocio del usuario.
 */
const validarHorariosDelNegocio = async (client, negocioId, horarioIds) => {
  if (horarioIds.length === 0) {
    return [];
  }

  const query = `
        SELECT
            id
        FROM horario

        WHERE negocio_id = $1

          AND id = ANY($2::integer[])
    `;

  const { rows } = await client.query(query, [negocioId, horarioIds]);

  return rows;
};

/**
 * Verifica que todos los profesionales pertenezcan
 * al negocio y estén habilitados.
 *
 * IMPORTANTE:
 * No filtramos acceso = ACEPTADO.
 *
 * Porque DENEGADO significa que pertenece al negocio
 * pero no tiene permisos administrativos.
 */
const validarProfesionalesDelNegocio = async (
  client,
  negocioId,
  profesionalIds,
) => {
  if (profesionalIds.length === 0) {
    return [];
  }

  const query = `
        SELECT
            pn.profesional_id
        FROM profesional_negocio pn

        WHERE pn.negocio_id = $1

          AND pn.profesional_id = ANY($2::integer[])

          AND pn.estado = 'HABILITADO'
    `;

  const { rows } = await client.query(query, [negocioId, profesionalIds]);

  return rows;
};

/**
 * Obtiene todas las asignaciones actuales
 * del negocio.
 */
const getAsignaciones = async (client, negocioId) => {
  const query = `
        SELECT
            hp.id,
            hp.horario_id,
            hp.profesional_id

        FROM horario_profesional hp

        INNER JOIN horario h
            ON h.id = hp.horario_id

        WHERE h.negocio_id = $1

        ORDER BY
            hp.horario_id ASC,
            hp.profesional_id ASC
    `;

  const { rows } = await client.query(query, [negocioId]);

  return rows;
};

/**
 * Crea una asignación.
 *
 * La protección contra duplicados también debe existir
 * en la BD mediante UNIQUE.
 */
const crearAsignacion = async (client, horarioId, profesionalId) => {
  const query = `
        INSERT INTO horario_profesional (
            horario_id,
            profesional_id
        )

        VALUES ($1, $2)

        ON CONFLICT (horario_id, profesional_id)
        DO NOTHING

        RETURNING *
    `;

  const { rows } = await client.query(query, [horarioId, profesionalId]);

  return rows[0] || null;
};

/**
 * Verifica si una asignación tiene slots.
 */
const tieneSlots = async (client, horarioProfesionalId) => {
  const query = `
        SELECT
            1

        FROM slot

        WHERE horario_profesional_id = $1

        LIMIT 1
    `;

  const { rows } = await client.query(query, [horarioProfesionalId]);

  return rows.length > 0;
};

/**
 * Elimina una asignación.
 *
 * Esta función solamente debe ejecutarse
 * después de verificar que no tenga slots.
 */
const eliminarAsignacion = async (client, horarioProfesionalId) => {
  const query = `
        DELETE FROM horario_profesional

        WHERE id = $1

        RETURNING *
    `;

  const { rows } = await client.query(query, [horarioProfesionalId]);

  return rows[0] || null;
};

/**-------------------------------------------------------------------------------- */

// =====================================================
// PROFESIONALES DEL NEGOCIO
// =====================================================

const getProfesionalesByNegocioId = async (client, negocioId) => {
  const query = `
    SELECT
      p.id AS profesional_id,
      per.nombre AS nombre,

      (
        SELECT tp.nombre
        FROM profesional_tipo_profesional ptp
        INNER JOIN tipo_profesional tp
          ON tp.id = ptp.tipo_profesional_id
        WHERE ptp.profesional_id = p.id
          AND tp.activo = TRUE
        ORDER BY ptp.id ASC
        LIMIT 1
      ) AS tipo,

      (
        SELECT a.url
        FROM profesional_archivo pa
        INNER JOIN archivo a
          ON a.id = pa.archivo_id
        WHERE pa.profesional_id = p.id
        ORDER BY pa.id ASC
        LIMIT 1
      ) AS foto

    FROM profesional_negocio pn

    INNER JOIN profesional p
      ON p.id = pn.profesional_id

    INNER JOIN persona per
      ON per.id = p.persona_id

    WHERE pn.negocio_id = $1
      AND pn.estado = 'HABILITADO'

    ORDER BY per.nombre ASC
  `;

  const { rows } = await client.query(query, [negocioId]);

  return rows;
};

// =====================================================
// HORARIOS DEL NEGOCIO
// =====================================================

const getHorariosByNegocioId = async (client, negocioId) => {
  const query = `
    SELECT
      h.id,
      h.negocio_id,
      h.dia_semana,
      h.turno,

      TO_CHAR(h.hora_inicio, 'HH24:MI') AS hora_inicio,
      TO_CHAR(h.hora_fin, 'HH24:MI') AS hora_fin

    FROM horario h

    WHERE h.negocio_id = $1

    ORDER BY
      h.dia_semana ASC,
      h.turno ASC
  `;

  const { rows } = await client.query(query, [negocioId]);

  return rows;
};

// =====================================================
// ASIGNACIONES HORARIO - PROFESIONAL
// =====================================================

const getAsignacionesByNegocioId = async (client, negocioId) => {
  const query = `
    SELECT
      hp.id,
      hp.horario_id,
      hp.profesional_id

    FROM horario_profesional hp

    INNER JOIN horario h
      ON h.id = hp.horario_id

    WHERE h.negocio_id = $1

    ORDER BY
      hp.horario_id ASC,
      hp.profesional_id ASC
  `;

  const { rows } = await client.query(query, [negocioId]);

  return rows;
};

// =====================================================
// OBTENER ASIGNACIONES HORARIO - PROFESIONAL
// =====================================================
const getProfessionalHours = async (client, profesionalId) => {

  const query = `
    SELECT
      hp.horario_id,
      hp.profesional_id

    FROM horario_profesional hp

    INNER JOIN horario h
      ON h.id = hp.horario_id

    INNER JOIN profesional_negocio pn
      ON pn.negocio_id = h.negocio_id
      AND pn.profesional_id = hp.profesional_id

    INNER JOIN profesional_negocio pn_admin
      ON pn_admin.negocio_id = h.negocio_id
      AND pn_admin.profesional_id = $1

    WHERE pn.estado = 'HABILITADO'
      AND pn_admin.estado = 'HABILITADO'
      AND pn_admin.acceso = 'ACEPTADO'

    ORDER BY
      hp.horario_id ASC,
      hp.profesional_id ASC
  `;

  const { rows } = await client.query(query, [profesionalId]);
  return rows;
};

// =====================================================
// EXPORT
// =====================================================
module.exports = {
  getProfessionalHours,

  getNegocioByProfesionalId,
  validarHorariosDelNegocio,
  validarProfesionalesDelNegocio,
  getAsignaciones,
  crearAsignacion,
  tieneSlots,
  eliminarAsignacion,

  getNegocioByProfesionalId,
  getProfesionalesByNegocioId,
  getHorariosByNegocioId,
  getAsignacionesByNegocioId,
};