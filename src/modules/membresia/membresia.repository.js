const pool = require("../../database/pool");

// ============================================================
// OBTENER MEMBRESÍAS DEL PROFESIONAL
// ============================================================
async function getMembresiasByProfesionalId(profesionalId) {
	const query = `
    SELECT
      m.id AS membresia_id,
      m.profesional_negocio_id,
      m.fecha_inicio,
      m.fecha_fin,
      m.monto,
      m.estado_pagado,
      m.estado AS membresia_estado,
      m.created_at,
      pn.negocio_id,
      pn.estado AS profesional_negocio_estado,
      n.nombre AS negocio_nombre,
      n.logo AS negocio_logo,
      p.id AS pago_id,
      p.numero AS pago_numero,
      p.estado AS pago_estado,
      c.id AS comprobante_id,
      c.estado AS comprobante_estado,
      c.observacion AS comprobante_observacion,
      c.fecha_validacion AS comprobante_fecha_validacion
    FROM membresia m
    INNER JOIN profesional_negocio pn ON pn.id = m.profesional_negocio_id
    INNER JOIN negocio n ON n.id = pn.negocio_id
    LEFT JOIN LATERAL (
      SELECT pa.id, pa.numero, pa.estado
      FROM pago pa
      WHERE pa.membresia_id = m.id
      ORDER BY pa.id DESC
      LIMIT 1
    ) p ON TRUE
    LEFT JOIN LATERAL (
      SELECT co.id, co.estado, co.observacion, co.fecha_validacion
      FROM comprobante co
      WHERE co.pago_id = p.id
      ORDER BY co.id DESC
      LIMIT 1
    ) c ON TRUE
    WHERE pn.profesional_id = $1
    ORDER BY m.fecha_fin DESC, m.id DESC;
  `;
	const { rows } = await pool.query(query, [profesionalId]);
	return rows;
}

// ============================================================
// QR OFICIAL DE GERENCIA: gerencia.archivo_id -> archivo.id
// ============================================================
async function getQrGerenciaMembresia() {
	const { rows } = await pool.query(
		`
      SELECT
        g.id AS gerencia_id,
        g.nombre AS gerencia_nombre,
        a.id AS archivo_id,
        a.nombre AS archivo_nombre,
        a.url,
        a.tipo,
        a.mime_type
      FROM gerencia g
      INNER JOIN archivo a ON a.id = g.archivo_id
      WHERE g.estado = 'ACTIVO'
        AND a.tipo = 'QR_MEMBRESIA'
      ORDER BY g.id DESC
      LIMIT 1
    `,
	);
	return rows[0] || null;
}

// ============================================================
// OBTENER MEMBRESÍA PERTENECIENTE AL PROFESIONAL
// ============================================================
async function getMembresiaParaRenovar(client, membresiaId, profesionalId) {
	const { rows } = await client.query(
		`
      SELECT m.id, m.profesional_negocio_id, m.fecha_inicio, m.fecha_fin,
             m.monto, m.estado_pagado, m.estado AS membresia_estado,
             pn.profesional_id, pn.negocio_id
      FROM membresia m
      INNER JOIN profesional_negocio pn ON pn.id = m.profesional_negocio_id
      WHERE m.id = $1 AND pn.profesional_id = $2
      FOR UPDATE OF m
    `,
		[membresiaId, profesionalId],
	);
	return rows[0] || null;
}

async function existePeriodoPendiente(client, profesionalNegocioId) {
	const { rows } = await client.query(
		`
      SELECT id
      FROM membresia
      WHERE profesional_negocio_id = $1 AND estado_pagado = FALSE
      ORDER BY id DESC
      LIMIT 1
    `,
		[profesionalNegocioId],
	);
	return rows[0] || null;
}

async function getUltimaMembresia(client, profesionalNegocioId) {
	const { rows } = await client.query(
		`
      SELECT id, fecha_inicio, fecha_fin, monto, estado_pagado
      FROM membresia
      WHERE profesional_negocio_id = $1
      ORDER BY fecha_fin DESC, id DESC
      LIMIT 1
      FOR UPDATE
    `,
		[profesionalNegocioId],
	);
	return rows[0] || null;
}

async function getMetodoPagoQR(client) {
	const { rows } = await client.query(
		`
      SELECT id
      FROM metodo_pago
      WHERE codigo = 'QR' AND estado = 'ACTIVO'
      LIMIT 1
    `,
	);
	return rows[0] || null;
}

async function createPeriodoMembresia(
	client,
	{ profesionalNegocioId, fechaInicio, fechaFin, monto },
) {
	const { rows } = await client.query(
		`
      INSERT INTO membresia (
        profesional_negocio_id, fecha_inicio, fecha_fin, monto, estado_pagado
      )
      VALUES ($1, $2, $3, $4, FALSE)
      RETURNING id, profesional_negocio_id, fecha_inicio, fecha_fin, monto, estado_pagado, estado
    `,
		[profesionalNegocioId, fechaInicio, fechaFin, monto],
	);
	return rows[0];
}

async function createPagoMembresia(
	client,
	{ metodoPagoId, profesionalId, membresiaId, numero, fecha, hora, monto },
) {
	const { rows } = await client.query(
		`
      INSERT INTO pago (
        metodo_pago_id, profesional_id, membresia_id, numero, fecha, hora, monto
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, numero, fecha, hora, monto, estado, membresia_id
    `,
		[metodoPagoId, profesionalId, membresiaId, numero, fecha, hora, monto],
	);
	return rows[0];
}

// Crea el registro del archivo después de que Multer guarda el archivo en disco.
async function createArchivoComprobante(client, file) {
	const url = `/uploads/comprobantes/${file.filename}`;
	const { rows } = await client.query(
		`
      INSERT INTO archivo (nombre, url, tipo, mime_type, tamano_bytes)
      VALUES ($1, $2, 'COMPROBANTE', $3, $4)
      RETURNING id, nombre, url, tipo, mime_type, tamano_bytes
    `,
		[file.originalname, url, file.mimetype, file.size],
	);
	return rows[0];
}

async function getPagoRenovacion(client, pagoId, profesionalId) {
	const { rows } = await client.query(
		`
        SELECT
            pa.id AS pago_id,
            pa.profesional_id,
            pa.membresia_id,
            pa.estado AS pago_estado,
            pa.monto,
            m.profesional_negocio_id,
            m.estado_pagado AS membresia_pagada
        FROM pago pa
        INNER JOIN membresia m
            ON m.id = pa.membresia_id
        INNER JOIN profesional_negocio pn
            ON pn.id = m.profesional_negocio_id
        WHERE pa.id = $1
          AND pa.profesional_id = $2
          AND pn.profesional_id = $2
        FOR UPDATE OF pa, m
        `,
		[pagoId, profesionalId],
	);

	return rows[0] || null;
}

async function existeComprobantePendiente(client, pagoId) {
	const { rows } = await client.query(
		`
      SELECT id FROM comprobante
      WHERE pago_id = $1 AND estado = 'PENDIENTE'
      LIMIT 1
    `,
		[pagoId],
	);
	return Boolean(rows[0]);
}

async function createComprobantePendiente(client, pagoId, archivoId) {
	const { rows } = await client.query(
		`
      INSERT INTO comprobante (pago_id, archivo_id, estado)
      VALUES ($1, $2, 'PENDIENTE')
      RETURNING id, pago_id, archivo_id, estado, created_at
    `,
		[pagoId, archivoId],
	);
	return rows[0];
}

module.exports = {
	getMembresiasByProfesionalId,
	getQrGerenciaMembresia,
	getMembresiaParaRenovar,
	existePeriodoPendiente,
	getUltimaMembresia,
	getMetodoPagoQR,
	createPeriodoMembresia,
	createPagoMembresia,
	getPagoRenovacion,
	existeComprobantePendiente,
	createArchivoComprobante,
	createComprobantePendiente,
};
