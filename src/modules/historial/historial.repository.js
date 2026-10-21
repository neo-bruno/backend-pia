const pool = require("../../database/pool");

// =====================================================
// RESOLVER CLIENTE MEDIANTE SU TOKEN
// =====================================================

const getClienteByToken = async (token) => {
	const query = `
    SELECT id
    FROM cliente
    WHERE token = $1
    LIMIT 1
  `;

	const { rows } = await pool.query(query, [token]);
	return rows[0] || null;
};

// =====================================================
// RESOLVER PROFESIONAL MEDIANTE EL USUARIO AUTENTICADO
// =====================================================

const getProfesionalByUsuarioId = async (usuarioId) => {
	const query = `
    SELECT pr.id AS profesional_id
    FROM usuario u
    INNER JOIN profesional pr
      ON pr.persona_id = u.persona_id
    WHERE u.id = $1
    LIMIT 1
  `;

	const { rows } = await pool.query(query, [usuarioId]);
	return rows[0] || null;
};

// =====================================================
// CONSULTA BASE DEL HISTORIAL
// =====================================================

const getHistorial = async ({
	clienteId = null,
	profesionalId = null,
	negocioId = null,
	servicioId = null,
	fechaDesde = null,
	fechaHasta = null,
	estado = null,
	busqueda = null,
	pagina = 1,
	limite = 20,
}) => {
	const offset = (pagina - 1) * limite;

	const condiciones = [];
	const valores = [];

	const agregarCondicion = (sql, valor) => {
		valores.push(valor);
		condiciones.push(sql.replace("?", `$${valores.length}`));
	};

	// =====================================================
	// FILTROS
	// =====================================================

	if (clienteId) {
		agregarCondicion("h.cliente_id = ?", clienteId);
	}

	if (profesionalId) {
		agregarCondicion("h.profesional_id = ?", profesionalId);
	}

	if (negocioId) {
		agregarCondicion("h.negocio_id = ?", negocioId);
	}

	if (servicioId) {
		agregarCondicion("h.servicio_id = ?", servicioId);
	}

	if (fechaDesde) {
		agregarCondicion("h.fecha >= ?::date", fechaDesde);
	}

	if (fechaHasta) {
		agregarCondicion("h.fecha <= ?::date", fechaHasta);
	}

	if (estado) {
		agregarCondicion("r.estado::text = ?", estado);
	}

	if (busqueda) {
		valores.push(`%${busqueda}%`);
		const parametro = `$${valores.length}`;

		condiciones.push(`(
      p.nombre ILIKE ${parametro}
      OR c.alias ILIKE ${parametro}
      OR n.nombre ILIKE ${parametro}
      OR s.nombre ILIKE ${parametro}
      OR prp.nombre ILIKE ${parametro}
      OR r.numero::text ILIKE ${parametro}
    )`);
	}

	const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";

	// =====================================================
	// CONSULTA BASE
	// =====================================================

	const joins = `
    FROM historial h

    INNER JOIN negocio n
      ON n.id = h.negocio_id

    INNER JOIN cliente c
      ON c.id = h.cliente_id

    INNER JOIN persona p
      ON p.id = c.persona_id

    INNER JOIN profesional pr
      ON pr.id = h.profesional_id

    INNER JOIN persona prp
      ON prp.id = pr.persona_id

    INNER JOIN servicio s
      ON s.id = h.servicio_id

    INNER JOIN reserva r
      ON r.id = h.reserva_id
  `;

	// =====================================================
	// REGISTROS DE LA PÁGINA SOLICITADA
	// =====================================================

	const sql = `
    SELECT
      h.id,
      h.fecha,
      h.created_at,

      h.negocio_id,
      n.nombre AS negocio_nombre,
      n.slug AS negocio_slug,
      n.logo AS negocio_logo,

      h.cliente_id,
      c.alias AS cliente_alias,
      p.nombre AS cliente_nombre,
      p.telefono AS cliente_telefono,

      h.profesional_id,
      prp.nombre AS profesional_nombre,
      pr.foto AS profesional_foto,
      pr.slug AS profesional_slug,

      h.servicio_id,
      s.nombre AS servicio_nombre,
      s.descripcion AS servicio_descripcion,
      s.duracion AS servicio_duracion,
      s.precio AS servicio_precio,

      r.id AS reserva_id,
      r.numero AS reserva_numero,
      r.fecha AS reserva_fecha,
      r.hora_inicio,
      r.hora_fin,
      r.estado AS reserva_estado,
      r.precio_original,
      r.monto_promocion,
      r.monto_descuento,
      r.precio_aplicable,
      r.monto_pagado,
      r.saldo

    ${joins}

    ${where}

    ORDER BY
      h.fecha DESC,
      h.created_at DESC,
      h.id DESC

    LIMIT $${valores.length + 1}
    OFFSET $${valores.length + 2}
  `;

	// =====================================================
	// TOTAL DE REGISTROS FILTRADOS
	// =====================================================

	const countSql = `
    SELECT COUNT(*)::int AS total
    ${joins}
    ${where}
  `;

	// =====================================================
	// RESUMEN GLOBAL DE LOS REGISTROS FILTRADOS
	// No depende de la página actual.
	// =====================================================

	const resumenSql = `
    SELECT
      COUNT(*)::int AS total,

      COUNT(*) FILTER (
        WHERE UPPER(r.estado::text) IN (
          'COMPLETADA',
          'ATENDIDO',
          'ATENDIDA'
        )
      )::int AS atendidos,

      COUNT(*) FILTER (
        WHERE UPPER(r.estado::text) = 'NO_ASISTIO'
      )::int AS "noAsistio",

      COUNT(*) FILTER (
        WHERE UPPER(r.estado::text) IN (
          'CANCELADA',
          'CANCELADO'
        )
      )::int AS cancelados

    ${joins}
    ${where}
  `;

	// =====================================================
	// CINCO SERVICIOS MÁS SOLICITADOS
	// Dentro de los mismos filtros aplicados.
	// =====================================================

	const serviciosPopularesSql = `
    SELECT
      s.id AS servicio_id,
      s.nombre AS nombre,
      COUNT(*)::int AS cantidad

    ${joins}
    ${where}

    GROUP BY s.id, s.nombre

    ORDER BY
      cantidad DESC,
      s.nombre ASC

    LIMIT 5
  `;

	// =====================================================
	// EJECUTAR CONSULTAS
	// =====================================================

	const params = [...valores, limite, offset];

	const [resultado, totalResultado, resumenResultado, serviciosResultado] =
		await Promise.all([
			pool.query(sql, params),
			pool.query(countSql, valores),
			pool.query(resumenSql, valores),
			pool.query(serviciosPopularesSql, valores),
		]);

	// =====================================================
	// PREPARAR RESPUESTA
	// =====================================================

	const total = Number(totalResultado.rows[0]?.total || 0);
	const resumenDb = resumenResultado.rows[0] || {};

	return {
		registros: resultado.rows,

		total,

		pagina: Number(pagina),
		limite: Number(limite),
		totalPaginas: Math.ceil(total / limite),

		resumen: {
			total: Number(resumenDb.total || 0),
			atendidos: Number(resumenDb.atendidos || 0),
			noAsistio: Number(resumenDb.noAsistio || 0),
			cancelados: Number(resumenDb.cancelados || 0),
		},

		serviciosPopulares: serviciosResultado.rows.map((servicio) => ({
			servicio_id: Number(servicio.servicio_id),
			nombre: servicio.nombre,
			cantidad: Number(servicio.cantidad),
		})),
	};
};

module.exports = {
	getClienteByToken,
	getProfesionalByUsuarioId,
	getHistorial,
};
