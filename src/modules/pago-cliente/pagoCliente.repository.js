const pool = require("../../database/pool");

// =====================================================
// OBTENER CLIENTE POR TOKEN
// =====================================================

const getClienteByToken = async (token) => {
	const query = `
    SELECT
      c.id,
      c.persona_id,
      c.alias,
      c.telefono
    FROM cliente c
    WHERE c.token = $1
    LIMIT 1
  `;

	const { rows } = await pool.query(query, [token]);

	return rows[0] || null;
};

// =====================================================
// OBTENER PAGOS DEL CLIENTE
// =====================================================

const getPagosByCliente = async (clienteId) => {
	const query = `
    SELECT
      p.id,
      p.numero,
      p.fecha,
      p.hora,
      p.monto,
      p.estado,

      -- MÉTODO DE PAGO
      mp.id AS metodo_pago_id,
      mp.nombre AS metodo_pago_nombre,
      mp.codigo AS metodo_pago_codigo,

      -- RESERVA
      r.id AS reserva_id,
      r.numero AS reserva_numero,
      r.fecha AS reserva_fecha,
      r.hora_inicio AS reserva_hora_inicio,
      r.hora_fin AS reserva_hora_fin,
      r.precio_original AS reserva_precio_original,
      r.monto_promocion AS reserva_monto_promocion,
      r.monto_descuento AS reserva_monto_descuento,
      r.precio_aplicable AS reserva_precio_aplicable,
      r.monto_pagado AS reserva_monto_pagado,
      r.saldo AS reserva_saldo,
      r.estado AS reserva_estado,

      -- SERVICIO
      s.id AS servicio_id,
      s.nombre AS servicio_nombre,
      s.descripcion AS servicio_descripcion,
      s.duracion AS servicio_duracion,
      s.precio AS servicio_precio,

      -- PROFESIONAL
      pr.id AS profesional_id,
      pr.slug AS profesional_slug,
      pr.foto AS profesional_foto,
      pr.portada AS profesional_portada,

      -- NEGOCIO
      n.id AS negocio_id,
      n.nombre AS negocio_nombre,
      n.direccion AS negocio_direccion,
      n.telefono AS negocio_telefono,
      n.logo AS negocio_logo,
      n.portada AS negocio_portada,
      n.color_1 AS negocio_color_1,
      n.color_2 AS negocio_color_2,
      n.color_3 AS negocio_color_3,

      -- COMPROBANTE
      comp.id AS comprobante_id,
      comp.estado AS comprobante_estado,
      comp.observacion AS comprobante_observacion,
      comp.fecha_validacion AS comprobante_fecha_validacion,

      -- ARCHIVO DEL COMPROBANTE
      arch.id AS archivo_id,
      arch.nombre AS archivo_nombre,
      arch.url AS archivo_url,
      arch.tipo AS archivo_tipo,
      arch.mime_type AS archivo_mime_type,
      arch.tamano_bytes AS archivo_tamano_bytes

    FROM pago p

    INNER JOIN metodo_pago mp
      ON mp.id = p.metodo_pago_id

    LEFT JOIN reserva r
      ON r.id = p.reserva_id

    LEFT JOIN servicio s
      ON s.id = r.servicio_id

    LEFT JOIN profesional pr
      ON pr.id = p.profesional_id

    LEFT JOIN profesional_negocio pn
      ON pn.profesional_id = pr.id
      AND pn.estado = 'HABILITADO'

    LEFT JOIN negocio n
      ON n.id = pn.negocio_id

    LEFT JOIN LATERAL (
      SELECT
        c.id,
        c.estado,
        c.observacion,
        c.fecha_validacion,
        c.archivo_id
      FROM comprobante c
      WHERE c.pago_id = p.id
      ORDER BY c.id DESC
      LIMIT 1
    ) comp
      ON TRUE

    LEFT JOIN archivo arch
      ON arch.id = comp.archivo_id

    WHERE p.cliente_id = $1

    ORDER BY
      p.fecha DESC,
      p.hora DESC,
      p.id DESC
  `;

	const { rows } = await pool.query(query, [clienteId]);

	return rows;
};

// =====================================================
// PAGOS DEL CLIENTE
// =====================================================

async function getPagosByClienteId(clienteId) {
	const query = `
    SELECT
      p.id,
      p.numero,
      p.fecha,
      p.hora,
      p.monto,
      p.estado,

      -- =====================================================
      -- MÉTODO DE PAGO
      -- =====================================================

      mp.id AS metodo_pago_id,
      mp.nombre AS metodo_pago_nombre,
      mp.codigo AS metodo_pago_codigo,

      -- =====================================================
      -- RESERVA
      -- =====================================================

      r.id AS reserva_id,
      r.numero AS reserva_numero,
      r.fecha AS reserva_fecha,
      r.hora_inicio AS reserva_hora_inicio,
      r.hora_fin AS reserva_hora_fin,
      r.precio_original AS reserva_precio_original,
      r.monto_promocion AS reserva_monto_promocion,
      r.monto_descuento AS reserva_monto_descuento,
      r.precio_aplicable AS reserva_precio_aplicable,
      r.monto_pagado AS reserva_monto_pagado,
      r.saldo AS reserva_saldo,
      r.estado AS reserva_estado,

      -- =====================================================
      -- SERVICIO
      -- =====================================================

      s.id AS servicio_id,
      s.nombre AS servicio_nombre,
      s.descripcion AS servicio_descripcion,
      s.duracion AS servicio_duracion,
      s.precio AS servicio_precio,

      -- =====================================================
      -- IMAGEN DEL SERVICIO
      -- =====================================================

      servicio_archivo.id AS servicio_archivo_id,
      servicio_archivo.nombre AS servicio_archivo_nombre,
      servicio_archivo.url AS servicio_archivo_url,
      servicio_archivo.mime_type AS servicio_archivo_mime_type,
      servicio_archivo.tamano_bytes AS servicio_archivo_tamano_bytes,

      -- =====================================================
      -- PROFESIONAL
      -- =====================================================

      pro.id AS profesional_id,
      pro.slug AS profesional_slug,
      pro.foto AS profesional_foto,
      pro.portada AS profesional_portada,
      perpro.nombre AS profesional_nombre,

      -- =====================================================
      -- NEGOCIO
      -- =====================================================

      n.id AS negocio_id,
      n.nombre AS negocio_nombre,
      n.direccion AS negocio_direccion,
      n.telefono AS negocio_telefono,
      n.logo AS negocio_logo,
      n.portada AS negocio_portada,
      n.eslogan AS negocio_eslogan,
      n.informacion AS negocio_informacion,
      n.recomendacion AS negocio_recomendacion,

      -- =====================================================
      -- COMPROBANTE
      -- =====================================================

      c.id AS comprobante_id,
      c.estado AS comprobante_estado,
      c.observacion AS comprobante_observacion,
      c.fecha_validacion AS comprobante_fecha_validacion,

      -- =====================================================
      -- ARCHIVO DEL COMPROBANTE
      -- =====================================================

      a.id AS archivo_id,
      a.nombre AS archivo_nombre,
      a.url AS archivo_url,
      a.tipo AS archivo_tipo,
      a.mime_type AS archivo_mime_type,
      a.tamano_bytes AS archivo_tamano_bytes

    FROM pago p

    -- =====================================================
    -- MÉTODO DE PAGO
    -- =====================================================

    INNER JOIN metodo_pago mp
      ON mp.id = p.metodo_pago_id

    -- =====================================================
    -- RESERVA
    -- =====================================================

    INNER JOIN reserva r
      ON r.id = p.reserva_id

    -- =====================================================
    -- SERVICIO
    -- =====================================================

    INNER JOIN servicio s
      ON s.id = r.servicio_id

    -- =====================================================
    -- IMAGEN DEL SERVICIO
    -- =====================================================

    LEFT JOIN LATERAL (
      SELECT
        sa.id,
        ar.nombre,
        ar.url,
        ar.mime_type,
        ar.tamano_bytes
      FROM servicio_archivo sa

      INNER JOIN archivo ar
        ON ar.id = sa.archivo_id

      WHERE sa.servicio_id = s.id
        AND ar.mime_type LIKE 'image/%'

      ORDER BY
        sa.principal DESC,
        sa.orden ASC,
        sa.id DESC

      LIMIT 1
    ) AS servicio_archivo
      ON TRUE

    -- =====================================================
    -- PROFESIONAL
    -- =====================================================

    INNER JOIN profesional pro
      ON pro.id = s.profesional_id

    INNER JOIN persona perpro
      ON perpro.id = pro.persona_id

    -- =====================================================
    -- NEGOCIO
    -- =====================================================

    LEFT JOIN profesional_negocio pn
      ON pn.profesional_id = pro.id
      AND pn.estado = 'HABILITADO'

    LEFT JOIN negocio n
      ON n.id = pn.negocio_id

    -- =====================================================
    -- COMPROBANTE
    -- =====================================================

    LEFT JOIN comprobante c
      ON c.pago_id = p.id

    -- =====================================================
    -- ARCHIVO DEL COMPROBANTE
    -- =====================================================

    LEFT JOIN archivo a
      ON a.id = c.archivo_id

    -- =====================================================
    -- CLIENTE
    -- =====================================================

    WHERE p.cliente_id = $1

    ORDER BY
      p.fecha DESC,
      p.hora DESC,
      p.id DESC
  `;

	const { rows } = await pool.query(query, [clienteId]);

	return rows.map(mapPago);
}

// =====================================================
// PAGO POR ID + CLIENTE
// =====================================================

async function getPagoByIdAndCliente(pagoId, clienteId) {
	const query = `
    SELECT
      p.id,
      p.numero,
      p.fecha,
      p.hora,
      p.monto,
      p.estado,

      -- MÉTODO DE PAGO
      mp.id AS metodo_pago_id,
      mp.nombre AS metodo_pago_nombre,
      mp.codigo AS metodo_pago_codigo,

      -- RESERVA
      r.id AS reserva_id,
      r.numero AS reserva_numero,
      r.fecha AS reserva_fecha,
      r.hora_inicio AS reserva_hora_inicio,
      r.hora_fin AS reserva_hora_fin,
      r.precio_original AS reserva_precio_original,
      r.monto_promocion AS reserva_monto_promocion,
      r.monto_descuento AS reserva_monto_descuento,
      r.precio_aplicable AS reserva_precio_aplicable,
      r.monto_pagado AS reserva_monto_pagado,
      r.saldo AS reserva_saldo,
      r.estado AS reserva_estado,

      -- SERVICIO
      s.id AS servicio_id,
      s.nombre AS servicio_nombre,
      s.descripcion AS servicio_descripcion,
      s.duracion AS servicio_duracion,
      s.precio AS servicio_precio,

      -- IMAGEN DEL SERVICIO
      servicio_archivo.id AS servicio_archivo_id,
      servicio_archivo.nombre AS servicio_archivo_nombre,
      servicio_archivo.url AS servicio_archivo_url,
      servicio_archivo.mime_type AS servicio_archivo_mime_type,
      servicio_archivo.tamano_bytes AS servicio_archivo_tamano_bytes,

      -- PROFESIONAL
      pro.id AS profesional_id,
      pro.slug AS profesional_slug,
      pro.foto AS profesional_foto,
      pro.portada AS profesional_portada,
      perpro.nombre AS profesional_nombre,

      -- NEGOCIO (sin columnas de colores)
      n.id AS negocio_id,
      n.nombre AS negocio_nombre,
      n.direccion AS negocio_direccion,
      n.telefono AS negocio_telefono,
      n.logo AS negocio_logo,
      n.portada AS negocio_portada,

      -- COMPROBANTE
      c.id AS comprobante_id,
      c.estado AS comprobante_estado,
      c.observacion AS comprobante_observacion,
      c.fecha_validacion AS comprobante_fecha_validacion,

      -- ARCHIVO DEL COMPROBANTE
      a.id AS archivo_id,
      a.nombre AS archivo_nombre,
      a.url AS archivo_url,
      a.tipo AS archivo_tipo,
      a.mime_type AS archivo_mime_type,
      a.tamano_bytes AS archivo_tamano_bytes

    FROM pago p

    INNER JOIN metodo_pago mp
      ON mp.id = p.metodo_pago_id

    INNER JOIN reserva r
      ON r.id = p.reserva_id

    INNER JOIN servicio s
      ON s.id = r.servicio_id

    LEFT JOIN LATERAL (
      SELECT
        sa.id,
        ar.nombre,
        ar.url,
        ar.mime_type,
        ar.tamano_bytes
      FROM servicio_archivo sa
      INNER JOIN archivo ar
        ON ar.id = sa.archivo_id
      WHERE sa.servicio_id = s.id
        AND ar.mime_type LIKE 'image/%'
      ORDER BY
        sa.principal DESC,
        sa.orden ASC,
        sa.id DESC
      LIMIT 1
    ) AS servicio_archivo
      ON TRUE

    INNER JOIN profesional pro
      ON pro.id = s.profesional_id

    INNER JOIN persona perpro
      ON perpro.id = pro.persona_id

    LEFT JOIN profesional_negocio pn
      ON pn.profesional_id = pro.id
      AND pn.estado = 'HABILITADO'

    LEFT JOIN negocio n
      ON n.id = pn.negocio_id

    LEFT JOIN comprobante c
      ON c.pago_id = p.id

    LEFT JOIN archivo a
      ON a.id = c.archivo_id

    WHERE p.id = $1
      AND p.cliente_id = $2

    LIMIT 1
  `;

	const { rows } = await pool.query(query, [pagoId, clienteId]);

	if (!rows.length) {
		return null;
	}

	return mapPago(rows[0]);
}

// =====================================================
// MAPEAR PAGO
// =====================================================

function mapPago(row) {
	return {
		id: row.id,
		numero: row.numero,
		fecha: row.fecha,
		hora: row.hora,
		monto: Number(row.monto),
		estado: row.estado,

		metodo_pago: {
			id: row.metodo_pago_id,
			nombre: row.metodo_pago_nombre,
			codigo: row.metodo_pago_codigo,
		},

		reserva: {
			id: row.reserva_id,
			numero: row.reserva_numero,
			fecha: row.reserva_fecha,
			hora_inicio: row.reserva_hora_inicio,
			hora_fin: row.reserva_hora_fin,
			precio_original: Number(row.reserva_precio_original),
			monto_promocion: Number(row.reserva_monto_promocion),
			monto_descuento: Number(row.reserva_monto_descuento),
			precio_aplicable: Number(row.reserva_precio_aplicable),
			monto_pagado: Number(row.reserva_monto_pagado),
			saldo: Number(row.reserva_saldo),
			estado: row.reserva_estado,
		},

		servicio: {
			id: row.servicio_id,
			nombre: row.servicio_nombre,
			descripcion: row.servicio_descripcion,
			duracion: row.servicio_duracion,
			precio: row.servicio_precio,

			imagen: row.servicio_archivo_url || null,

			archivo: row.servicio_archivo_id
				? {
						id: row.servicio_archivo_id,
						nombre: row.servicio_archivo_nombre,
						url: row.servicio_archivo_url,
						mime_type: row.servicio_archivo_mime_type,
						tamano_bytes: row.servicio_archivo_tamano_bytes,
					}
				: null,
		},

		profesional: {
			id: row.profesional_id,
			nombre: row.profesional_nombre,
			slug: row.profesional_slug,
			foto: row.profesional_foto,
			portada: row.profesional_portada,
		},

		negocio: {
			id: row.negocio_id,
			nombre: row.negocio_nombre,
			direccion: row.negocio_direccion,
			telefono: row.negocio_telefono,
			logo: row.negocio_logo,
			portada: row.negocio_portada,
			color_1: row.negocio_color_1,
			color_2: row.negocio_color_2,
			color_3: row.negocio_color_3,
		},

		comprobante: row.comprobante_id
			? {
					id: row.comprobante_id,
					estado: row.comprobante_estado,
					observacion: row.comprobante_observacion,
					fecha_validacion: row.comprobante_fecha_validacion,

					archivo: row.archivo_id
						? {
								id: row.archivo_id,
								nombre: row.archivo_nombre,
								url: row.archivo_url,
								tipo: row.archivo_tipo,
								mime_type: row.archivo_mime_type,
								tamano_bytes: row.archivo_tamano_bytes,
							}
						: null,
				}
			: null,
	};
}

module.exports = {
	getClienteByToken,
	getPagosByClienteId,
	getPagoByIdAndCliente,
};
