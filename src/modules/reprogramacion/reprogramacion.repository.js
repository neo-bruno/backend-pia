async function getClienteByToken(client, token) {
	const { rows } = await client.query(
		`SELECT c.id, c.persona_id, c.token
       FROM cliente c
      WHERE c.token = $1
      LIMIT 1`,
		[token],
	);
	return rows[0] || null;
}

async function getReservaParaReprogramar(
	client,
	reservaId,
	clienteId,
	lock = false,
) {
	const { rows } = await client.query(
		`SELECT
        -- Identificación y estado de la reserva
        r.id AS reserva_id,
        r.cliente_id,
        r.servicio_id,
        r.numero,
        r.estado,
        r.fecha,
        r.hora_inicio,
        r.hora_fin,

        -- Importes originales de la reserva
        r.precio_original,
        r.monto_promocion,
        r.monto_descuento,
        r.precio_aplicable,
        r.monto_pagado,
        r.saldo,

        -- Datos del servicio
        s.nombre AS servicio_nombre,
        s.descripcion AS servicio_descripcion,
        s.duracion AS servicio_duracion,
        s.precio AS servicio_precio,
        s.profesional_id,

        -- Imagen principal del servicio
        foto_servicio.url AS servicio_foto,

        -- Datos del profesional
        p.id AS profesional_id_real,
        p.slug AS profesional_slug,
        p.foto AS profesional_foto,
        per.nombre AS profesional_nombre,

        -- Calificación del profesional
        COALESCE(calificaciones.rating, 0)::numeric
          AS profesional_calificacion_promedio,
        COALESCE(calificaciones.resenas, 0)::integer
          AS profesional_total_resenas,

        -- Verificar si ya fue reprogramada
        EXISTS (
          SELECT 1
          FROM reprogramacion rp
          WHERE rp.reserva_original_id = r.id
        ) AS ya_reprogramada

      FROM reserva r

      JOIN servicio s
        ON s.id = r.servicio_id

      JOIN profesional p
        ON p.id = s.profesional_id

      JOIN persona per
        ON per.id = p.persona_id

      LEFT JOIN LATERAL (
        SELECT a.url
        FROM servicio_archivo sa
        JOIN archivo a
          ON a.id = sa.archivo_id
        WHERE sa.servicio_id = s.id
          AND sa.tipo = 'FOTO'
        ORDER BY
          sa.principal DESC,
          sa.orden ASC,
          sa.id DESC
        LIMIT 1
      ) foto_servicio ON TRUE

      LEFT JOIN LATERAL (
        SELECT
          ROUND(AVG(c.puntaje), 1) AS rating,
          COUNT(DISTINCT c.id)::integer AS resenas
        FROM calificacion c
        JOIN evaluacion e
          ON e.id = c.evaluacion_id
        JOIN tipo_calificacion tc
          ON tc.id = e.tipo_calificacion_id
        JOIN servicio ss
          ON ss.id = c.servicio_id
        WHERE ss.profesional_id = p.id
          AND c.estado = 'ACTIVA'
          AND e.estado = 'HABILITADO'
          AND tc.objetivo = 'SERVICIO'
          AND tc.estado = 'ACTIVO'
      ) calificaciones ON TRUE

      WHERE r.id = $1
        AND r.cliente_id = $2

      ${lock ? "FOR UPDATE OF r" : ""}`,
		[reservaId, clienteId],
	);

	return rows[0] || null;
}

async function getCondicionesServicio(client, servicioId) {
	const { rows } = await client.query(
		`SELECT c.id, c.nombre, c.descripcion, c.permite_reprogramar,
            c.limite_horas_reprogramacion
       FROM servicio_condicion sc
       JOIN condicion c ON c.id = sc.condicion_id
      WHERE sc.servicio_id = $1
      ORDER BY c.id`,
		[servicioId],
	);
	return rows;
}

async function getSlotsOriginales(client, reservaId) {
	const { rows } = await client.query(
		`SELECT rs.slot_id, rs.orden, sl.hora_inicio, sl.hora_fin, sl.duracion
       FROM reserva_slot rs
       JOIN slot sl ON sl.id = rs.slot_id
      WHERE rs.reserva_id = $1 AND rs.activo = TRUE
      ORDER BY rs.orden`,
		[reservaId],
	);
	return rows;
}

async function getSlotsFecha(
	client,
	profesionalId,
	fecha,
	reservaOriginalId = null,
) {
	const { rows } = await client.query(
		`SELECT
        sl.id AS slot_id,
        sl.hora_inicio,
        sl.hora_fin,
        sl.duracion,
        sl.estado AS slot_estado,

        -- Identifica si el horario pertenece a la reserva actual.
        EXISTS (
          SELECT 1
          FROM reserva_slot rs
          JOIN reserva r ON r.id = rs.reserva_id
          WHERE rs.slot_id = sl.id
            AND rs.activo = TRUE
            AND r.id = $3
            AND r.fecha = $2::date
        ) AS mi_reserva,

        -- Identifica horarios ocupados por otras reservas.
        EXISTS (
          SELECT 1
          FROM reserva_slot rs
          JOIN reserva r ON r.id = rs.reserva_id
          WHERE rs.slot_id = sl.id
            AND rs.activo = TRUE
            AND r.estado IN (
              'PENDIENTE',
              'CONFIRMADA',
              'COMPLETADA'
            )
            AND r.fecha = $2::date
            AND r.id <> COALESCE($3::integer, -1)
        ) AS reservado,

        -- Identifica horarios bloqueados.
        EXISTS (
          SELECT 1
          FROM reserva_slot rs
          JOIN bloqueo b ON b.id = rs.bloqueo_id
          WHERE rs.slot_id = sl.id
            AND rs.activo = TRUE
            AND b.profesional_id = hp.profesional_id
            AND b.fecha = $2::date
            AND b.estado = 'ACTIVO'
            AND sl.hora_inicio < b.hora_fin
            AND sl.hora_fin > b.hora_inicio
        ) AS bloqueado

     FROM slot sl
     JOIN horario_profesional hp
       ON hp.id = sl.horario_profesional_id
     JOIN horario h
       ON h.id = hp.horario_id

     WHERE hp.profesional_id = $1
       AND h.dia_semana =
           EXTRACT(ISODOW FROM $2::date)::integer

     ORDER BY sl.hora_inicio
     FOR UPDATE OF sl`,
		[profesionalId, fecha, reservaOriginalId],
	);

	return rows;
}

async function getSlotsSeleccionados(
	client,
	slotIds,
	profesionalId,
	fecha,
	reservaOriginalId,
) {
	const { rows } = await client.query(
		`SELECT sl.id AS slot_id, sl.hora_inicio, sl.hora_fin, sl.duracion,
            sl.estado AS slot_estado,
            hp.profesional_id,
            EXISTS (
              SELECT 1 FROM reserva_slot rs
               JOIN reserva r ON r.id = rs.reserva_id
              WHERE rs.slot_id = sl.id AND rs.activo = TRUE
                AND r.fecha = $3::date
                AND r.estado IN ('PENDIENTE','CONFIRMADA','COMPLETADA')
                AND r.id <> $4
            ) AS reservado,
            EXISTS (
              SELECT 1 FROM reserva_slot rs
               JOIN bloqueo b ON b.id = rs.bloqueo_id
              WHERE rs.slot_id = sl.id AND rs.activo = TRUE
                AND b.profesional_id = hp.profesional_id
                AND b.fecha = $3::date AND b.estado = 'ACTIVO'
                AND sl.hora_inicio < b.hora_fin
                AND sl.hora_fin > b.hora_inicio
            ) AS bloqueado
       FROM slot sl
       JOIN horario_profesional hp ON hp.id = sl.horario_profesional_id
       JOIN horario h ON h.id = hp.horario_id
      WHERE sl.id = ANY($1::integer[])
        AND hp.profesional_id = $2
        AND h.dia_semana = EXTRACT(ISODOW FROM $3::date)::integer
      ORDER BY sl.hora_inicio
      FOR UPDATE OF sl`,
		[slotIds, profesionalId, fecha, reservaOriginalId],
	);
	return rows;
}

async function generarNumeroReserva(client) {
	await client.query("SELECT pg_advisory_xact_lock(847215)");
	const { rows } = await client.query(
		"SELECT COALESCE(MAX(numero), 0) + 1 AS numero FROM reserva",
	);
	return Number(rows[0].numero);
}

async function desactivarSlotsOriginales(client, reservaId) {
	await client.query(
		`UPDATE reserva_slot SET activo = FALSE
      WHERE reserva_id = $1 AND activo = TRUE`,
		[reservaId],
	);
}

async function crearReserva(client, r, numero, fecha, horaInicio, horaFin) {
	const { rows } = await client.query(
		`INSERT INTO reserva (
       cliente_id, servicio_id, numero, fecha, hora_inicio, hora_fin,
       precio_original, monto_promocion, monto_descuento, precio_aplicable,
       monto_pagado, saldo, estado
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
     RETURNING *`,
		[
			r.cliente_id,
			r.servicio_id,
			numero,
			fecha,
			horaInicio,
			horaFin,
			r.precio_original,
			r.monto_promocion,
			r.monto_descuento,
			r.precio_aplicable,
			r.monto_pagado,
			r.saldo,
			r.estado,
		],
	);
	return rows[0];
}

async function crearReservaSlot(client, reservaId, slotId, orden) {
	await client.query(
		`INSERT INTO reserva_slot (reserva_id, slot_id, orden, activo)
     VALUES ($1, $2, $3, TRUE)`,
		[reservaId, slotId, orden],
	);
}

async function crearHistorial(client, reservaId) {
	const { rows } = await client.query(
		`INSERT INTO historial (negocio_id, cliente_id, profesional_id, servicio_id, reserva_id, fecha)
     SELECT h.negocio_id, r.cliente_id, s.profesional_id, r.servicio_id, r.id, r.fecha
       FROM reserva r
       JOIN servicio s ON s.id = r.servicio_id
       JOIN reserva_slot rs ON rs.reserva_id = r.id AND rs.activo = TRUE AND rs.orden = 1
       JOIN slot sl ON sl.id = rs.slot_id
       JOIN horario_profesional hp ON hp.id = sl.horario_profesional_id
       JOIN horario h ON h.id = hp.horario_id
      WHERE r.id = $1
     RETURNING id`,
		[reservaId],
	);
	if (!rows.length)
		throw new Error("No se pudo registrar el historial de la nueva reserva.");
}

async function crearRelacionReprogramacion(
	client,
	originalId,
	nuevaId,
	fecha,
	hora,
) {
	const { rows } = await client.query(
		`INSERT INTO reprogramacion (reserva_original_id, reserva_nueva_id, fecha, hora)
     VALUES ($1, $2, $3, $4) RETURNING *`,
		[originalId, nuevaId, fecha, hora],
	);
	return rows[0];
}

async function getReservaResultado(client, reservaId) {
	const { rows } = await client.query(
		`SELECT r.id, r.numero, r.fecha, r.hora_inicio, r.hora_fin,
            r.precio_original, r.monto_promocion, r.monto_descuento,
            r.precio_aplicable, r.monto_pagado, r.saldo, r.estado,
            s.id AS servicio_id, s.nombre AS servicio_nombre,
            p.id AS profesional_id, per.nombre AS profesional_nombre
       FROM reserva r
       JOIN servicio s ON s.id = r.servicio_id
       JOIN profesional p ON p.id = s.profesional_id
       JOIN persona per ON per.id = p.persona_id
      WHERE r.id = $1`,
		[reservaId],
	);
	return rows[0] || null;
}

async function existeReprogramacionPosterior(client, reservaId) {
	const { rows } = await client.query(
		"SELECT 1 FROM reprogramacion WHERE reserva_original_id = $1 LIMIT 1",
		[reservaId],
	);
	return rows.length > 0;
}

module.exports = {
	getClienteByToken,
	getReservaParaReprogramar,
	getCondicionesServicio,
	getSlotsOriginales,
	getSlotsFecha,
	getSlotsSeleccionados,
	generarNumeroReserva,
	desactivarSlotsOriginales,
	crearReserva,
	crearReservaSlot,
	crearHistorial,
	crearRelacionReprogramacion,
	getReservaResultado,
	existeReprogramacionPosterior,
};
