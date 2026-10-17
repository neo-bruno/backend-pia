// =====================================================
// agenda.repository.js
// =====================================================

const pool = require("../../database/pool");

// =====================================================
// OBTENER NEGOCIO DEL PROFESIONAL AUTENTICADO
// =====================================================

const getNegocioByProfesionalId = async (client, profesionalId) => {
  const query = `
    SELECT
      pn.negocio_id,
      n.nombre AS negocio_nombre
    FROM profesional_negocio pn
    INNER JOIN negocio n
      ON n.id = pn.negocio_id
    INNER JOIN profesional p
      ON p.id = pn.profesional_id
    WHERE pn.profesional_id = $1
      AND pn.estado = 'HABILITADO'
      AND p.estado = 'ACTIVO'
    ORDER BY pn.id ASC
    LIMIT 1
  `;

  const { rows } = await client.query(query, [profesionalId]);

  return rows[0] || null;
};

// =====================================================
// OBTENER AGENDA DE UNA FECHA
//
// IMPORTANTE:
// - slot NO tiene fecha.
// - slot es una plantilla semanal.
// - reserva.fecha determina la fecha real.
// - reserva_slot relaciona la reserva con los slots.
// =====================================================
const getAgendaByFecha = async (client, negocioId, profesionalId, fecha) => {
  const query = `
    SELECT
      -- =================================================
      -- NEGOCIO
      -- =================================================
      n.id AS negocio_id,
      n.nombre AS negocio_nombre,

      -- =================================================
      -- PROFESIONAL
      -- =================================================
      p.id AS profesional_id,
      per.nombre AS profesional_nombre,
      p.foto AS profesional_foto,

      -- =================================================
      -- HORARIO PROFESIONAL
      -- =================================================
      hp.id AS horario_profesional_id,
      h.id AS horario_id,
      h.dia_semana,
      h.turno,
      TO_CHAR(h.hora_inicio, 'HH24:MI') AS horario_inicio,
      TO_CHAR(h.hora_fin, 'HH24:MI') AS horario_fin,

      -- =================================================
      -- SLOT
      -- =================================================
      s.id AS slot_id,
      TO_CHAR(s.hora_inicio, 'HH24:MI') AS slot_inicio,
      TO_CHAR(s.hora_fin, 'HH24:MI') AS slot_fin,
      s.duracion AS slot_duracion,
      s.estado AS slot_estado_configuracion,

      -- =================================================
      -- BLOQUEO
      -- =================================================
      b.id AS bloqueo_id,
      TO_CHAR(b.hora_inicio, 'HH24:MI') AS bloqueo_hora_inicio,
      TO_CHAR(b.hora_fin, 'HH24:MI') AS bloqueo_hora_fin,
      b.motivo AS bloqueo_motivo,
      b.estado AS bloqueo_estado,

      -- =================================================
      -- RESERVA DEL DÍA
      -- =================================================
      r.id AS reserva_id,
      r.numero AS reserva_numero,
      r.fecha AS reserva_fecha,
      TO_CHAR(r.hora_inicio, 'HH24:MI') AS reserva_hora_inicio,
      TO_CHAR(r.hora_fin, 'HH24:MI') AS reserva_hora_fin,
      r.estado AS reserva_estado,

      -- =================================================
      -- CLIENTE
      -- =================================================
      c.id AS cliente_id,
      pc.nombre AS cliente_nombre,
      c.telefono AS cliente_telefono,

      -- =================================================
      -- SERVICIO
      -- =================================================
      se.id AS servicio_id,
      se.nombre AS servicio_nombre,
      se.duracion AS servicio_duracion,
      se.precio AS servicio_precio,

      (
        SELECT a.url
        FROM servicio_archivo sa
        INNER JOIN archivo a
          ON a.id = sa.archivo_id
        WHERE sa.servicio_id = se.id
          AND sa.tipo = 'FOTO'
        ORDER BY sa.principal DESC, sa.orden ASC
        LIMIT 1
      ) AS servicio_imagen

    FROM profesional_negocio pn

    INNER JOIN negocio n
      ON n.id = pn.negocio_id

    INNER JOIN profesional p
      ON p.id = pn.profesional_id
      AND p.estado = 'ACTIVO'

    INNER JOIN persona per
      ON per.id = p.persona_id

    INNER JOIN horario_profesional hp
      ON hp.profesional_id = p.id

    INNER JOIN horario h
      ON h.id = hp.horario_id
      AND h.negocio_id = pn.negocio_id
      AND h.dia_semana =
        EXTRACT(ISODOW FROM $3::DATE)::INTEGER

    INNER JOIN slot s
      ON s.horario_profesional_id = hp.id

    -- =================================================
    -- RELACIÓN ACTIVA DEL SLOT
    -- =================================================
    LEFT JOIN reserva_slot rs
      ON rs.slot_id = s.id
      AND rs.activo = TRUE

    -- =================================================
    -- BLOQUEO ACTIVO ASOCIADO AL SLOT
    -- =================================================
    LEFT JOIN bloqueo b
      ON b.id = rs.bloqueo_id
      AND b.negocio_id = pn.negocio_id
      AND b.profesional_id = p.id
      AND b.fecha = $3::DATE
      AND b.estado = 'ACTIVO'
      AND s.hora_inicio < b.hora_fin
      AND s.hora_fin > b.hora_inicio
   
    -- =================================================
    -- RESERVA DEL DÍA
    -- =================================================
    LEFT JOIN reserva r
      ON r.id = rs.reserva_id
      AND r.fecha = $3::DATE
      AND r.estado IN (
        'PENDIENTE',
        'CONFIRMADA',
        'COMPLETADA'
      )

    LEFT JOIN cliente c
      ON c.id = r.cliente_id

    LEFT JOIN persona pc
      ON pc.id = c.persona_id

    LEFT JOIN servicio se
      ON se.id = r.servicio_id

    WHERE pn.negocio_id = $1
      AND pn.profesional_id = $2
      AND pn.estado = 'HABILITADO'

    ORDER BY
      p.id ASC,
      h.dia_semana ASC,
      h.turno ASC,
      s.hora_inicio ASC
  `;

  const { rows } = await client.query(query, [negocioId, profesionalId, fecha]);

  return rows;
};

module.exports = {
  getNegocioByProfesionalId,
  getAgendaByFecha,
};
