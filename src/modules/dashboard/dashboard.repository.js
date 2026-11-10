// ============================================================
// PIA - MÓDULO DASHBOARD
// Capa: repository
// ============================================================

const pool = require("../../database/pool");

// ============================================================
// OBTENER RESUMEN DE INDICADORES
// ============================================================

// ============================================================
// RESUMEN DE INDICADORES DEL DÍA
// ============================================================

const getResumen = async (profesionalId, fecha) => {
	const sql = `
		SELECT

			-- RESERVAS DEL DÍA SELECCIONADO
			(
				SELECT COUNT(*)::int
				FROM reserva r
				INNER JOIN servicio s ON s.id = r.servicio_id
				WHERE s.profesional_id = $1
					AND r.fecha = $2::date
					AND r.estado::text IN (
						'PENDIENTE',
						'CONFIRMADA',
						'COMPLETADA'
					)
			) AS reservas_dia,

			-- ATENCIONES DEL DÍA SELECCIONADO
			-- Una atención equivale a una reserva completada.
			(
					SELECT COUNT(*)::int
					FROM reserva r
					INNER JOIN servicio s
							ON s.id = r.servicio_id
					WHERE s.profesional_id = $1
							AND r.fecha = $2::date
							AND r.estado::text = 'COMPLETADA'
			) AS atenciones_dia,

			-- CLIENTES ACTIVOS: ÚLTIMOS 30 DÍAS
			(
				SELECT COUNT(DISTINCT h.cliente_id)::int
				FROM historial h
				WHERE h.profesional_id = $1
					AND h.fecha >= $2::date - 29
					AND h.fecha <= $2::date
			) AS clientes_activos,

			-- TOTAL DE CLIENTES DE LA CARTERA DEL PROFESIONAL
			(
					SELECT COUNT(DISTINCT clientes.cliente_id)::int
					FROM (
							SELECT r.cliente_id
							FROM reserva r
							INNER JOIN servicio sv
									ON sv.id = r.servicio_id
							WHERE sv.profesional_id = $1

							UNION

							SELECT h.cliente_id
							FROM historial h
							WHERE h.profesional_id = $1
					) clientes
			) AS total_clientes,

			-- INGRESOS DEL DÍA
			-- Una reserva COMPLETADA se considera pagada.
			(
				SELECT COALESCE(
					SUM(r.precio_aplicable),
					0
				)::numeric(12,2)

				FROM reserva r
				INNER JOIN servicio s
					ON s.id = r.servicio_id

				WHERE s.profesional_id = $1
					AND r.fecha = $2::date
					AND r.estado::text = 'COMPLETADA'
			) AS ingresos_dia
	`;

	const { rows } = await pool.query(sql, [profesionalId, fecha]);

	const fila = rows[0] || {};

	return {
		reservasHoy: Number(fila.reservas_dia || 0),
		atencionesHoy: Number(fila.atenciones_dia || 0),
		clientesActivos: Number(fila.clientes_activos || 0),
		totalClientes: Number(fila.total_clientes || 0),
		ingresosDia: Number(fila.ingresos_dia || 0),
	};
};

// ============================================================
// RESERVAS DEL DÍA SELECCIONADO
// ============================================================

const getProximasReservas = async (profesionalId, fecha) => {
	const sql = `
		SELECT
			r.id AS reserva_id,
			r.numero AS reserva_numero,
			r.fecha,

			TO_CHAR(r.hora_inicio, 'HH24:MI') AS hora_inicio,
			TO_CHAR(r.hora_fin, 'HH24:MI') AS hora_fin,

			r.estado::text AS estado,

			c.id AS cliente_id,
			c.alias AS cliente_alias,
			pc.nombre AS cliente_nombre,

			s.id AS servicio_id,
			s.nombre AS servicio_nombre,

			pr.id AS profesional_id,
			pp.nombre AS profesional_nombre

		FROM reserva r

		INNER JOIN servicio s
			ON s.id = r.servicio_id

		INNER JOIN cliente c
			ON c.id = r.cliente_id

		INNER JOIN persona pc
			ON pc.id = c.persona_id

		INNER JOIN profesional pr
			ON pr.id = s.profesional_id

		INNER JOIN persona pp
			ON pp.id = pr.persona_id

		WHERE s.profesional_id = $1
			AND r.fecha = $2::date
			AND r.estado::text IN (
				'PENDIENTE',
				'CONFIRMADA'
			)

		ORDER BY r.hora_inicio ASC
		LIMIT 10
	`;

	const { rows } = await pool.query(sql, [profesionalId, fecha]);

	return rows;
};

// ============================================================
// OBTENER TODOS LOS DATOS DEL DASHBOARD
// ============================================================

const getDashboard = async (profesionalId, fecha) => {
	const [
		resumen,
		proximasReservas,
		clientesPorSegmentacion,
		serviciosPopulares,
	] = await Promise.all([
		getResumen(profesionalId, fecha),
		getProximasReservas(profesionalId, fecha),
		getClientesPorSegmentacion(profesionalId, fecha),
		getServiciosPopulares(profesionalId, fecha),
	]);

	return {
		resumen,
		proximasReservas,
		clientesPorSegmentacion,
		serviciosPopulares,
	};
};

// ============================================================
// CLIENTES POR SEGMENTACIÓN - MISMA LÓGICA DE CLIENTES ADMIN
// HISTÓRICO, INDEPENDIENTE DE LA FECHA DEL DASHBOARD
// ============================================================

const getClientesPorSegmentacion = async (profesionalId) => {
	const sql = `
		WITH clientes_profesional AS (
			SELECT DISTINCT r.cliente_id
			FROM reserva r
			INNER JOIN servicio sv
				ON sv.id = r.servicio_id
			WHERE sv.profesional_id = $1

			UNION

			SELECT DISTINCT h.cliente_id
			FROM historial h
			WHERE h.profesional_id = $1
		),

		datos_clientes AS (
			SELECT
				c.id AS cliente_id,
				seg.id AS segmentacion_id

			FROM clientes_profesional cp

			INNER JOIN cliente c
				ON c.id = cp.cliente_id

			LEFT JOIN LATERAL (
				SELECT
					s.id,
					s.nombre,
					s.orden

				FROM historial h

				INNER JOIN reserva r
					ON r.id = h.reserva_id

				INNER JOIN historial_segmentacion hs
					ON hs.historial_id = h.id

				INNER JOIN segmentacion s
					ON s.id = hs.segmentacion_id

				WHERE h.cliente_id = c.id
					AND h.profesional_id = $1
					AND r.estado::text = 'COMPLETADA'
					AND s.estado = 'ACTIVO'

				ORDER BY
					h.fecha DESC,
					h.id DESC,
					s.orden DESC

				LIMIT 1
			) seg ON TRUE
		)

		SELECT
			s.id AS segmentacion_id,
			s.nombre AS segmentacion,
			s.orden,
			COUNT(dc.cliente_id)::int AS cantidad

		FROM segmentacion s

		LEFT JOIN datos_clientes dc
			ON dc.segmentacion_id = s.id

		WHERE s.estado = 'ACTIVO'

		GROUP BY
			s.id,
			s.nombre,
			s.orden

		ORDER BY s.orden ASC
	`;

	const { rows } = await pool.query(sql, [profesionalId]);

	return rows.map((item) => ({
		segmentacionId: Number(item.segmentacion_id),
		nombre: item.segmentacion,
		cantidad: Number(item.cantidad),
	}));
};

// ============================================================
// SERVICIOS MÁS SOLICITADOS - HISTÓRICO
// TODAS LAS RESERVAS COMPLETADAS
// ============================================================

const getServiciosPopulares = async (profesionalId) => {
	const sql = `
		SELECT
			s.id AS servicio_id,
			s.nombre,
			COUNT(DISTINCT r.id)::int AS cantidad

		FROM servicio s

		LEFT JOIN reserva r
			ON r.servicio_id = s.id
			AND r.estado::text = 'COMPLETADA'

		WHERE s.profesional_id = $1

		GROUP BY
			s.id,
			s.nombre

		ORDER BY
			cantidad DESC,
			s.nombre ASC
	`;

	const { rows } = await pool.query(sql, [profesionalId]);

	return rows.map((item) => ({
		servicioId: Number(item.servicio_id),
		nombre: item.nombre,
		cantidad: Number(item.cantidad),
	}));
};

module.exports = {
	getDashboard,
};
