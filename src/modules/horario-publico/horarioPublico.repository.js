const getScheduleByProfessional = async (
  client,
  profesionalId,
  fecha,
  clienteId = null,
) => {
  const query = `
    SELECT

      /* =====================================================
         PROFESIONAL
      ====================================================== */

      p.id AS profesional_id,
      per.nombre AS profesional_nombre,
      p.slug AS profesional_slug,
      p.foto AS profesional_foto,
      p.pago_qr AS profesional_pago_qr,


      /* =====================================================
         HORARIO
      ====================================================== */

      hp.id AS horario_profesional_id,
      h.id AS horario_id,
      h.negocio_id,
      h.dia_semana,
      h.turno,
      h.hora_inicio AS horario_inicio,
      h.hora_fin AS horario_fin,


      /* =====================================================
         SLOT
      ====================================================== */

      s.id AS slot_id,
      s.hora_inicio AS slot_inicio,
      s.hora_fin AS slot_fin,
      s.duracion AS slot_duracion,
      s.estado AS slot_estado,


      /* =====================================================
         RESERVA
      ====================================================== */

      r.id AS reserva_id,
      r.cliente_id AS reserva_cliente_id,
      r.fecha AS reserva_fecha,
      r.hora_inicio AS reserva_hora_inicio,
      r.hora_fin AS reserva_hora_fin,
      r.estado AS reserva_estado,


      /* =====================================================
         NOMBRE DEL CLIENTE
      ====================================================== */

      CASE
        WHEN r.cliente_id = $3
        THEN c.alias
        ELSE NULL
      END AS reserva_cliente_nombre


    FROM profesional p

    INNER JOIN persona per
      ON per.id = p.persona_id

    INNER JOIN horario_profesional hp
      ON hp.profesional_id = p.id

    INNER JOIN horario h
      ON h.id = hp.horario_id

    INNER JOIN slot s
      ON s.horario_profesional_id = hp.id


    /* =====================================================
       RESERVA DEL SLOT
    ====================================================== */

    LEFT JOIN reserva_slot rs
      ON rs.slot_id = s.id
      AND rs.activo = TRUE

    LEFT JOIN reserva r
      ON r.id = rs.reserva_id
      AND r.fecha = $2
      AND r.estado = 'CONFIRMADA'


    LEFT JOIN cliente c
      ON c.id = r.cliente_id


    WHERE p.id = $1

      AND p.estado = 'ACTIVO'

      AND p.estado_funciones = 'HABILITADO'

      AND h.dia_semana =
          EXTRACT(
            ISODOW FROM $2::DATE
          )::INTEGER


    ORDER BY
      h.hora_inicio ASC,
      s.hora_inicio ASC
  `;

  const values = [profesionalId, fecha, clienteId];

  const result = await client.query(query, values);

  return result.rows;
};

// ============================================================
// OBTENER SERVICIO
// ============================================================

const getServiceById = async (client, servicioId, profesionalId) => {
  const query = `
    SELECT
      id,
      profesional_id,
      nombre,
      descripcion,
      duracion,
      precio,
      estado
    FROM servicio
    WHERE id = $1
      AND profesional_id = $2
      AND estado = 'HABILITADO'
    LIMIT 1
  `;

  const values = [servicioId, profesionalId];

  const result = await client.query(query, values);

  return result.rows[0] || null;
};

module.exports = {
  getScheduleByProfessional,
  getServiceById,
};
