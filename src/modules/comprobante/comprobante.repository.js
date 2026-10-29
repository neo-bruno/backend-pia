const pool = require("../../database/pool");

/**
 * Obtiene todos los comprobantes pendientes.
 */

async function getPendingVouchers() {
	const result = await pool.query(`
    SELECT
      c.id AS comprobante_id,
      c.estado AS estado,
      c.observacion,
      c.fecha_validacion,

      a.id AS archivo_id,
      a.nombre AS archivo_nombre,
      a.url AS archivo_url,
      a.tipo AS archivo_tipo,
      a.mime_type AS archivo_mime_type,

      p.id AS pago_id,
      p.numero,
      p.monto AS pago_monto,
      p.fecha,

      m.id AS membresia_id,
      m.fecha_inicio,
      m.fecha_fin,
      m.monto AS membresia_monto,
      m.estado_pagado,

      pn.id AS profesional_negocio_id,
      pn.estado AS profesional_negocio_estado,
      pn.acceso AS profesional_negocio_acceso,

      n.id AS negocio_id,
      n.codigo AS negocio_codigo,
      n.nombre AS negocio_nombre,
      n.slug AS negocio_slug,
      n.estado AS negocio_estado,

      pr.id AS profesional_id,
      pr.estado AS profesional_estado,
      pr.estado_funciones,

      per.id AS persona_id,
      per.nombre AS profesional_nombre,
      per.telefono AS profesional_telefono

    FROM comprobante c

    INNER JOIN pago p
      ON p.id = c.pago_id

    INNER JOIN membresia m
      ON m.id = p.membresia_id

    INNER JOIN profesional_negocio pn
      ON pn.id = m.profesional_negocio_id

    INNER JOIN negocio n
      ON n.id = pn.negocio_id

    INNER JOIN profesional pr
      ON pr.id = pn.profesional_id

    INNER JOIN persona per
      ON per.id = pr.persona_id

    INNER JOIN archivo a
      ON a.id = c.archivo_id

    

    ORDER BY c.id DESC
  `);

	return result.rows;
}

/**
 * Obtiene un comprobante específico con toda su información.
 */
async function getVoucherById(comprobanteId) {
	const result = await pool.query(
		`
    SELECT
      c.id AS comprobante_id,
      c.estado AS comprobante_estado,
      c.observacion,
      c.fecha_validacion,

      a.id AS archivo_id,
      a.nombre AS archivo_nombre,
      a.url AS archivo_url,
      a.tipo AS archivo_tipo,
      a.mime_type AS archivo_mime_type,

      p.id AS pago_id,
      p.numero,
      p.monto AS pago_monto,
      p.fecha,

      m.id AS membresia_id,
      m.fecha_inicio,
      m.fecha_fin,
      m.monto AS membresia_monto,
      m.estado_pagado,

      pn.id AS profesional_negocio_id,
      pn.estado AS profesional_negocio_estado,

      n.id AS negocio_id,
      n.codigo AS negocio_codigo,
      n.nombre AS negocio_nombre,
      n.slug AS negocio_slug,
      n.estado AS negocio_estado,

      pr.id AS profesional_id,
      pr.estado AS profesional_estado,
      pr.estado_funciones,

      per.id AS persona_id,
      per.nombre AS profesional_nombre,
      per.telefono AS profesional_telefono

    FROM comprobante c

    INNER JOIN pago p
      ON p.id = c.pago_id

    INNER JOIN membresia m
      ON m.id = p.membresia_id

    INNER JOIN profesional_negocio pn
      ON pn.id = m.profesional_negocio_id

    INNER JOIN negocio n
      ON n.id = pn.negocio_id

    INNER JOIN profesional pr
      ON pr.id = pn.profesional_id

    INNER JOIN persona per
      ON per.id = pr.persona_id

    INNER JOIN archivo a
      ON a.id = c.archivo_id

    WHERE c.id = $1

    LIMIT 1
    `,
		[comprobanteId],
	);

	return result.rows[0] || null;
}

/**
 * Obtiene la gerencia activa.
 */
async function getActiveManagement(client) {
	const result = await client.query(`
    SELECT id
    FROM gerencia
    WHERE estado = 'ACTIVO'
    ORDER BY id
    LIMIT 1
  `);

	return result.rows[0] || null;
}

/**
 * Valida un comprobante y habilita todas las entidades
 * relacionadas con la membresía.
 */
async function acceptVoucher(client, comprobante) {
	await client.query(
		`
    UPDATE comprobante
    SET
      estado = 'ACEPTADO',
      observacion = $1,
      validado_por_gerencia_id = $2,
      fecha_validacion = CURRENT_TIMESTAMP
    WHERE id = $3
    `,
		[
			comprobante.observacion || null,
			comprobante.gerenciaId,
			comprobante.comprobanteId,
		],
	);

	await client.query(
		`
    UPDATE membresia
    SET estado_pagado = TRUE
    WHERE id = $1
    `,
		[comprobante.membresiaId],
	);

	await client.query(
		`
    UPDATE profesional_negocio
    SET estado = 'HABILITADO'
    WHERE id = $1
    `,
		[comprobante.profesionalNegocioId],
	);

	await client.query(
		`
    UPDATE profesional
    SET estado_funciones = 'HABILITADO'
    WHERE id = $1
    `,
		[comprobante.profesionalId],
	);

	await client.query(
		`
    UPDATE negocio
    SET estado = 'HABILITADO'
    WHERE id = $1
    `,
		[comprobante.negocioId],
	);
}

/**
 * Rechaza un comprobante.
 */
async function rejectVoucher(client, comprobante) {
	await client.query(
		`
    UPDATE comprobante
    SET
      estado = 'RECHAZADO',
      observacion = $1,
      validado_por_gerencia_id = $2,
      fecha_validacion = CURRENT_TIMESTAMP
    WHERE id = $3
    `,
		[
			comprobante.observacion,
			comprobante.gerenciaId,
			comprobante.comprobanteId,
		],
	);
}

module.exports = {
	getPendingVouchers,
	getVoucherById,
	getActiveManagement,
	acceptVoucher,
	rejectVoucher,
};
