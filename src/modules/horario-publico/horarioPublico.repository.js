const getScheduleByProfessional = async (
	client,
	profesionalId,
	fecha,
	clienteId = null,
) => {
	const query = `
    SELECT
      -- ================================================
      -- PROFESIONAL
      -- ================================================
      p.id AS profesional_id,
      per.nombre AS profesional_nombre,
      p.slug AS profesional_slug,
      p.foto AS profesional_foto,
      p.pago_qr AS profesional_pago_qr,

      -- EVALUACIÓN DEL PROFESIONAL
      COALESCE(ev.profesional_calificacion_promedio, 0)
        AS profesional_calificacion_promedio,

      COALESCE(ev.profesional_total_resenas, 0)
        AS profesional_total_resenas,

      -- ================================================
      -- HORARIO
      -- ================================================
      hp.id AS horario_profesional_id,
      h.id AS horario_id,
      h.negocio_id,
      h.dia_semana,
      h.turno,
      h.hora_inicio AS horario_inicio,
      h.hora_fin AS horario_fin,

      -- ================================================
      -- SLOT
      -- ================================================
      s.id AS slot_id,
      s.hora_inicio AS slot_inicio,
      s.hora_fin AS slot_fin,
      s.duracion AS slot_duracion,
      s.estado AS slot_estado,

      -- ================================================
      -- RESERVA
      -- ================================================
      r.id AS reserva_id,
      r.cliente_id AS reserva_cliente_id,
      r.fecha AS reserva_fecha,
      r.hora_inicio AS reserva_hora_inicio,
      r.hora_fin AS reserva_hora_fin,
      r.estado AS reserva_estado,

      -- CLIENTE
      c.alias AS reserva_cliente_nombre,

      -- SERVICIO
      se.nombre AS reserva_servicio_nombre,

      -- ================================================
      -- BLOQUEO
      -- ================================================
      b.id AS bloqueo_id,
      b.fecha AS bloqueo_fecha,
      b.hora_inicio AS bloqueo_hora_inicio,
      b.hora_fin AS bloqueo_hora_fin,
      b.motivo AS bloqueo_motivo,
      b.estado AS bloqueo_estado

    FROM profesional p

    INNER JOIN persona per
      ON per.id = p.persona_id

    -- ================================================
    -- EVALUACIONES DEL PROFESIONAL
    -- ================================================
    LEFT JOIN (
      SELECT
        cal.profesional_id,
        ROUND(AVG(cal.puntaje), 1)
          AS profesional_calificacion_promedio,
        COUNT(cal.id)::INTEGER
          AS profesional_total_resenas

      FROM calificacion cal

      INNER JOIN evaluacion e
        ON e.id = cal.evaluacion_id

      INNER JOIN tipo_calificacion tc
        ON tc.id = e.tipo_calificacion_id

      WHERE cal.profesional_id = $1
        AND tc.codigo = 'ATENCION'
        AND tc.objetivo = 'PROFESIONAL'
        AND tc.estado = 'ACTIVO'
        AND e.estado = 'HABILITADO'
        AND cal.estado = 'ACTIVA'

      GROUP BY cal.profesional_id
    ) ev
      ON ev.profesional_id = p.id

    -- ================================================
    -- HORARIOS Y SLOTS
    -- ================================================
    INNER JOIN horario_profesional hp
      ON hp.profesional_id = p.id

    INNER JOIN horario h
      ON h.id = hp.horario_id

    INNER JOIN slot s
      ON s.horario_profesional_id = hp.id

    -- ================================================
    -- RELACIÓN RESERVA-SLOT
    -- SOLO CONSIDERAR RESERVAS Y BLOQUEOS DE LA FECHA
    -- SOLICITADA
    -- ================================================
    LEFT JOIN reserva_slot rs
      ON rs.slot_id = s.id
      AND rs.activo = TRUE
      AND (
        -- La reserva pertenece a la fecha consultada.
        EXISTS (
          SELECT 1
          FROM reserva r_fecha
          WHERE r_fecha.id = rs.reserva_id
            AND r_fecha.fecha = $2::DATE
            AND r_fecha.estado IN (
              'PENDIENTE',
              'CONFIRMADA',
              'COMPLETADA'
            )
        )

        OR

        -- El bloqueo pertenece a la fecha consultada.
        EXISTS (
          SELECT 1
          FROM bloqueo b_fecha
          WHERE b_fecha.id = rs.bloqueo_id
            AND b_fecha.profesional_id = p.id
            AND b_fecha.fecha = $2::DATE
            AND UPPER(b_fecha.estado) IN (
              'ACTIVO',
              'HABILITADO'
            )
        )
      )

    -- ================================================
    -- RESERVA DE LA FECHA SOLICITADA
    -- ================================================
    LEFT JOIN reserva r
      ON r.id = rs.reserva_id
      AND r.fecha = $2::DATE
      AND r.estado IN (
        'PENDIENTE',
        'CONFIRMADA',
        'COMPLETADA'
      )

    LEFT JOIN cliente c
      ON c.id = r.cliente_id

    LEFT JOIN servicio se
      ON se.id = r.servicio_id

    -- ================================================
    -- BLOQUEO DEL SLOT
    -- ================================================
    LEFT JOIN bloqueo b
      ON b.id = rs.bloqueo_id
      AND b.profesional_id = p.id
      AND b.fecha = $2::DATE
      AND UPPER(b.estado) IN (
        'ACTIVO',
        'HABILITADO'
      )

    -- ================================================
    -- FILTROS
    -- ================================================
    WHERE p.id = $1
      AND p.estado = 'ACTIVO'
      AND p.estado_funciones = 'HABILITADO'
      AND h.dia_semana = EXTRACT(
        ISODOW FROM $2::DATE
      )::INTEGER

    ORDER BY
      h.hora_inicio ASC,
      s.hora_inicio ASC
  `;

	const values = [profesionalId, fecha];

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
