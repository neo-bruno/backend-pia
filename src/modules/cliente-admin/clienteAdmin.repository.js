const pool = require("../../database/pool");

// =====================================================
// LISTA DE CLIENTES DEL PROFESIONAL
// Incluye contadores de descuentos vigentes y programados
// =====================================================

exports.getClientes = async (
	client,
	profesionalId,
	{ pagina, limite, busqueda, segmentacionId },
) => {
	const offset = (pagina - 1) * limite;

	const query = `
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
        c.persona_id,
        c.alias,
        c.telefono,
        p.nombre,
        c.created_at,

        seg.id AS segmentacion_id,
        seg.nombre AS segmentacion_nombre,
        seg.orden AS segmentacion_orden,

        COALESCE(atenciones.total, 0)::INTEGER
          AS total_atenciones,

        atenciones.ultima_atencion,

        COALESCE(descuentos.vigentes, 0)::INTEGER
          AS descuentos_vigentes,

        COALESCE(descuentos.programados, 0)::INTEGER
          AS descuentos_programados

      FROM clientes_profesional cp

      INNER JOIN cliente c
        ON c.id = cp.cliente_id

      INNER JOIN persona p
        ON p.id = c.persona_id

      LEFT JOIN LATERAL (
        SELECT
          s.id,
          s.nombre,
          s.orden
        FROM historial h
        INNER JOIN historial_segmentacion hs
          ON hs.historial_id = h.id
        INNER JOIN segmentacion s
          ON s.id = hs.segmentacion_id
        WHERE h.cliente_id = c.id
          AND h.profesional_id = $1
          AND s.estado = 'ACTIVO'
        ORDER BY
          h.fecha DESC,
          h.id DESC,
          s.orden DESC
        LIMIT 1
      ) seg ON TRUE

      LEFT JOIN LATERAL (
        SELECT
          COUNT(*) AS total,
          MAX(h.fecha) AS ultima_atencion
        FROM historial h
        WHERE h.cliente_id = c.id
          AND h.profesional_id = $1
      ) atenciones ON TRUE

      -- DESCUENTOS ASIGNADOS AL CLIENTE
      LEFT JOIN LATERAL (
        SELECT
          COUNT(*) FILTER (
            WHERE
              (
                d.fecha_inicio IS NULL
                OR d.fecha_inicio <= CURRENT_DATE
              )
              AND (
                d.fecha_fin IS NULL
                OR d.fecha_fin >= CURRENT_DATE
              )
          ) AS vigentes,

          COUNT(*) FILTER (
            WHERE d.fecha_inicio > CURRENT_DATE
          ) AS programados

        FROM descuento_servicio_cliente dsc

        INNER JOIN descuento_servicio ds
          ON ds.id = dsc.descuento_servicio_id

        INNER JOIN descuento d
          ON d.id = ds.descuento_id

        INNER JOIN servicio sv
          ON sv.id = ds.servicio_id

        WHERE dsc.cliente_id = c.id
          AND dsc.estado_asignacion = 'ACTIVO'
          AND ds.tipo_descuento = 'CLIENTE'
          AND ds.estado = 'ACTIVO'
          AND d.estado = 'ACTIVO'
          AND sv.estado = 'HABILITADO'
          AND sv.profesional_id = $1

          AND (
            d.fecha_fin IS NULL
            OR d.fecha_fin >= CURRENT_DATE
          )
      ) descuentos ON TRUE

      WHERE (
        $2 = ''
        OR p.nombre ILIKE '%' || $2 || '%'
        OR c.alias ILIKE '%' || $2 || '%'
        OR c.telefono ILIKE '%' || $2 || '%'
      )

      AND (
        $3::INTEGER IS NULL
        OR seg.id = $3
      )
    )

    SELECT
      *,
      COUNT(*) OVER()::INTEGER AS total_registros
    FROM datos_clientes
    ORDER BY
      ultima_atencion DESC NULLS LAST,
      nombre ASC
    LIMIT $4 OFFSET $5
  `;

	const { rows } = await client.query(query, [
		profesionalId,
		busqueda,
		segmentacionId,
		limite,
		offset,
	]);

	return {
		clientes: rows.map(({ total_registros, ...cliente }) => cliente),
		total: rows.length ? rows[0].total_registros : 0,
	};
};

// =====================================================
// VERIFICAR QUE EL CLIENTE ESTÉ VINCULADO AL PROFESIONAL
// =====================================================

exports.existeClienteProfesional = async (client, profesionalId, clienteId) => {
	const query = `
    SELECT 1
    WHERE EXISTS (
      SELECT 1
      FROM reserva r

      INNER JOIN servicio sv
        ON sv.id = r.servicio_id

      WHERE r.cliente_id = $2
        AND sv.profesional_id = $1
    )

    OR EXISTS (
      SELECT 1
      FROM historial h
      WHERE h.cliente_id = $2
        AND h.profesional_id = $1
    )

    LIMIT 1
  `;

	const { rows } = await client.query(query, [profesionalId, clienteId]);

	return rows.length > 0;
};

// =====================================================
// HISTORIAL DEL CLIENTE
// =====================================================

exports.getHistorialCliente = async (client, profesionalId, clienteId) => {
	const query = `
    SELECT
      h.id AS historial_id,
      h.fecha,
      h.reserva_id,
      h.negocio_id,

      sv.id AS servicio_id,
      sv.nombre AS servicio_nombre,
      sv.duracion,
      sv.precio,

      r.numero AS reserva_numero,
      r.hora_inicio,
      r.hora_fin,
      r.estado AS reserva_estado,
      r.precio_aplicable,
      r.monto_pagado,
      r.saldo

    FROM historial h

    INNER JOIN servicio sv
      ON sv.id = h.servicio_id

    INNER JOIN reserva r
      ON r.id = h.reserva_id

    WHERE h.cliente_id = $1
      AND h.profesional_id = $2

    ORDER BY h.fecha DESC, h.id DESC
  `;

	const { rows } = await client.query(query, [clienteId, profesionalId]);

	return rows;
};

// =====================================================
// SEGMENTACIÓN DEL CLIENTE
// =====================================================

exports.getSegmentacionCliente = async (client, profesionalId, clienteId) => {
	const query = `
    SELECT
      h.id AS historial_id,
      h.fecha AS fecha_atencion,

      s.id AS segmentacion_id,
      s.nombre AS segmentacion_nombre,
      s.descripcion,
      s.orden,
      s.min_atenciones,
      s.periodo_dias,
      s.max_intervalo_dias,
      s.max_dias_ultima_atencion

    FROM historial h

    INNER JOIN historial_segmentacion hs
      ON hs.historial_id = h.id

    INNER JOIN segmentacion s
      ON s.id = hs.segmentacion_id

    WHERE h.cliente_id = $1
      AND h.profesional_id = $2

    ORDER BY h.fecha DESC, h.id DESC, s.orden DESC
  `;

	const { rows } = await client.query(query, [clienteId, profesionalId]);

	return rows;
};

// =====================================================
// PROMOCIONES ASIGNADAS AL CLIENTE
// =====================================================

exports.getPromocionesCliente = async (client, profesionalId, clienteId) => {
	const query = `
    SELECT
      pr.id AS promocion_id,
      pr.tipo_promocion_id,
      tp.codigo AS tipo_codigo,
      tp.nombre AS tipo_nombre,

      pr.cliente_id,
      pr.servicio_id,
      sv.nombre AS servicio_nombre,

      pr.fecha_inicio,
      pr.fecha_final,
      pr.descripcion,
      pr.monto_descuento,
      pr.porcentaje_descuento,
      pr.limite_cortes,
      pr.fecha_especial,
      pr.fecha_cumpleanos,
      pr.estado

    FROM promocion pr

    INNER JOIN servicio sv
      ON sv.id = pr.servicio_id

    INNER JOIN tipo_promocion tp
      ON tp.id = pr.tipo_promocion_id

    WHERE pr.cliente_id = $1
      AND sv.profesional_id = $2

    ORDER BY pr.created_at DESC, pr.id DESC
  `;

	const { rows } = await client.query(query, [clienteId, profesionalId]);

	return rows;
};

// =====================================================
// DESCUENTOS ASIGNADOS AL CLIENTE
// Incluye descuentos futuros, vigentes y vencidos.
// =====================================================

exports.getDescuentosCliente = async (client, profesionalId, clienteId) => {
	const sql = `
    SELECT
      dsc.id AS asignacion_id,
      dsc.cliente_id,
      dsc.descuento_servicio_id,
      dsc.estado_aplicado,
      dsc.fecha_aplicada,
      dsc.hora_aplicada,
      dsc.codigo_aplicado,
      dsc.monto_aplicado,
      dsc.created_at AS fecha_asignacion,

      ds.tipo_descuento,
      ds.estado AS estado_descuento_servicio,

      d.id AS descuento_id,
      d.codigo,
      d.titulo AS descuento_titulo,
      d.descripcion AS descuento_descripcion,
      d.monto,
      d.porcentaje,
      d.fecha_inicio,
      d.fecha_fin,
      d.estado AS estado_descuento,

      s.id AS servicio_id,
      s.nombre AS servicio_nombre,
      s.descripcion AS servicio_descripcion,
      s.duracion,
      s.precio,
      s.estado AS servicio_estado

    FROM descuento_servicio_cliente dsc

    INNER JOIN descuento_servicio ds
      ON ds.id = dsc.descuento_servicio_id

    INNER JOIN descuento d
      ON d.id = ds.descuento_id

    INNER JOIN servicio s
      ON s.id = ds.servicio_id

    WHERE dsc.cliente_id = $1
      AND d.profesional_id = $2
      AND ds.tipo_descuento = 'CLIENTE'

    ORDER BY dsc.created_at DESC, dsc.id DESC
  `;

	const { rows } = await client.query(sql, [clienteId, profesionalId]);

	return rows;
};
