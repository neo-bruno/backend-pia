const pool = require("../../database/pool");

// =====================================================
// OBTENER DESCUENTOS DE UN CLIENTE
// =====================================================

const getDescuentosByClienteId = async (clienteId) => {
	const query = `
    SELECT
      dsc.id AS asignacion_id,
      dsc.estado_asignacion,
      dsc.estado_aplicado,
      dsc.fecha_aplicada,
      dsc.hora_aplicada,
      dsc.codigo_aplicado,
      dsc.monto_aplicado,
      dsc.created_at AS fecha_asignacion,

      ds.id AS descuento_servicio_id,
      ds.tipo_descuento,

      d.id AS descuento_id,
      d.codigo AS descuento_codigo,
      d.titulo AS descuento_titulo,
      d.descripcion AS descuento_descripcion,
      d.monto AS descuento_monto,
      d.porcentaje AS descuento_porcentaje,
      d.fecha_inicio,
      d.fecha_fin,
      d.estado AS descuento_estado,

      s.id AS servicio_id,
      s.nombre AS servicio_nombre,
      s.descripcion AS servicio_descripcion,
      s.duracion AS servicio_duracion,
      s.precio AS servicio_precio,

      pro.id AS profesional_id,
      per.nombre AS profesional_nombre,
      per.telefono AS profesional_telefono,
      pro.slug AS profesional_slug,
      pro.foto AS profesional_foto,
      pro.portada AS profesional_portada,
      pro.descripcion AS profesional_descripcion,
      pro.lema AS profesional_lema,

      n.id AS negocio_id,
      n.nombre AS negocio_nombre,
      n.slug AS negocio_slug,
      n.telefono AS negocio_telefono,
      n.direccion AS negocio_direccion,
      n.zona AS negocio_zona,
      n.municipio AS negocio_municipio,
      n.departamento AS negocio_departamento,
      n.logo AS negocio_logo,
      n.portada AS negocio_portada,

      imagen.imagen_url,

      CASE
        WHEN dsc.fecha_aplicada IS NOT NULL
          OR dsc.codigo_aplicado IS NOT NULL
          OR dsc.monto_aplicado IS NOT NULL
          OR dsc.estado_aplicado IS NOT NULL
          THEN 'UTILIZADO'

        WHEN d.fecha_fin IS NOT NULL
          AND d.fecha_fin < CURRENT_DATE
          THEN 'VENCIDO'

        WHEN d.fecha_inicio IS NOT NULL
          AND d.fecha_inicio > CURRENT_DATE
          THEN 'PENDIENTE'

        ELSE 'DISPONIBLE'
      END AS categoria

    FROM descuento_servicio_cliente dsc

    INNER JOIN descuento_servicio ds
      ON ds.id = dsc.descuento_servicio_id

    INNER JOIN descuento d
      ON d.id = ds.descuento_id

    INNER JOIN servicio s
      ON s.id = ds.servicio_id

    INNER JOIN profesional pro
      ON pro.id = s.profesional_id

    INNER JOIN persona per
      ON per.id = pro.persona_id

    LEFT JOIN negocio n
      ON n.id = d.negocio_id

    LEFT JOIN LATERAL (
      SELECT a.url AS imagen_url
      FROM servicio_archivo sa
      INNER JOIN archivo a
        ON a.id = sa.archivo_id
      WHERE sa.servicio_id = s.id
        AND sa.tipo = 'FOTO'
        AND sa.principal = TRUE
      ORDER BY sa.id DESC
      LIMIT 1
    ) imagen ON TRUE

    WHERE dsc.cliente_id = $1
      AND dsc.estado_asignacion = 'ACTIVO'
      AND ds.tipo_descuento = 'CLIENTE'

    ORDER BY
      d.fecha_fin ASC NULLS LAST,
      s.nombre ASC,
      d.titulo ASC
  `;

	const { rows } = await pool.query(query, [clienteId]);

	return rows.map((row) => ({
		...row,
		descuento_monto:
			row.descuento_monto == null ? null : Number(row.descuento_monto),

		descuento_porcentaje:
			row.descuento_porcentaje == null
				? null
				: Number(row.descuento_porcentaje),

		servicio_precio:
			row.servicio_precio == null ? null : Number(row.servicio_precio),

		monto_aplicado:
			row.monto_aplicado == null ? null : Number(row.monto_aplicado),
	}));
};

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

const getDescuentosByClienteYProfesional = async (clienteId, profesionalId) => {
	const query = `
    SELECT
      dsc.id AS asignacion_id,
      dsc.estado_asignacion,
      dsc.estado_aplicado,
      dsc.fecha_aplicada,
      dsc.hora_aplicada,
      dsc.codigo_aplicado,
      dsc.monto_aplicado,

      ds.id AS descuento_servicio_id,
      ds.tipo_descuento,

      d.id AS descuento_id,
      d.codigo AS descuento_codigo,
      d.titulo AS descuento_titulo,
      d.descripcion AS descuento_descripcion,
      d.monto AS descuento_monto,
      d.porcentaje AS descuento_porcentaje,
      d.fecha_inicio,
      d.fecha_fin,
      d.estado AS descuento_estado,

      s.id AS servicio_id,
      s.nombre AS servicio_nombre,
      s.duracion AS servicio_duracion,
      s.precio AS servicio_precio

    FROM descuento_servicio_cliente dsc

    INNER JOIN descuento_servicio ds
      ON ds.id = dsc.descuento_servicio_id

    INNER JOIN descuento d
      ON d.id = ds.descuento_id

    INNER JOIN servicio s
      ON s.id = ds.servicio_id

    WHERE dsc.cliente_id = $1
      AND s.profesional_id = $2
      AND dsc.estado_asignacion = 'ACTIVO'
      AND ds.tipo_descuento = 'CLIENTE'
      AND d.estado = 'ACTIVO'
      AND (d.fecha_inicio IS NULL OR d.fecha_inicio <= CURRENT_DATE)
      AND (d.fecha_fin IS NULL OR d.fecha_fin >= CURRENT_DATE)
      AND NOT (
        dsc.fecha_aplicada IS NOT NULL
        OR dsc.codigo_aplicado IS NOT NULL
        OR dsc.monto_aplicado IS NOT NULL
        OR dsc.estado_aplicado IS NOT NULL
      )

    ORDER BY s.nombre, d.titulo
  `;

	const { rows } = await pool.query(query, [clienteId, profesionalId]);

	return rows.map((row) => ({
		...row,
		descuento_monto:
			row.descuento_monto == null ? null : Number(row.descuento_monto),
		descuento_porcentaje:
			row.descuento_porcentaje == null
				? null
				: Number(row.descuento_porcentaje),
		servicio_precio:
			row.servicio_precio == null ? null : Number(row.servicio_precio),
	}));
};

// =====================================================
// VERIFICAR SI UN SERVICIO TIENE DESCUENTOS DISPONIBLES
// PARA EL CLIENTE AUTENTICADO
// =====================================================

const getDescuentosDisponiblesPorServicio = async (clienteId, servicioId) => {
	const query = `
    SELECT
      ds.id AS descuento_servicio_id,
      ds.tipo_descuento
    FROM descuento_servicio ds

    INNER JOIN descuento d
      ON d.id = ds.descuento_id

    INNER JOIN servicio s
      ON s.id = ds.servicio_id

    WHERE s.id = $2
      AND s.estado = 'HABILITADO'
      AND ds.estado = 'ACTIVO'
      AND d.estado = 'ACTIVO'

      AND (
        d.fecha_inicio IS NULL
        OR d.fecha_inicio <= CURRENT_DATE
      )

      AND (
        d.fecha_fin IS NULL
        OR d.fecha_fin >= CURRENT_DATE
      )

      AND (
        (
          ds.tipo_descuento = 'CLIENTE'

          AND EXISTS (
            SELECT 1
            FROM descuento_servicio_cliente dsc
            WHERE dsc.descuento_servicio_id = ds.id
              AND dsc.cliente_id = $1
              AND dsc.estado_asignacion = 'ACTIVO'

              AND dsc.fecha_aplicada IS NULL
              AND dsc.hora_aplicada IS NULL
              AND dsc.codigo_aplicado IS NULL
              AND dsc.monto_aplicado IS NULL
              AND dsc.estado_aplicado IS NULL
          )
        )

        OR

        (
          ds.tipo_descuento = 'PUBLICO'

          AND NOT EXISTS (
            SELECT 1
            FROM descuento_servicio_cliente dsc
            WHERE dsc.descuento_servicio_id = ds.id
              AND dsc.cliente_id = $1
          )
        )
      )

    LIMIT 1
  `;

	const { rows } = await pool.query(query, [clienteId, servicioId]);

	return rows.length > 0;
};

const validarCodigoDescuento = async (codigo, servicioId, clienteId) => {
	const query = `
    SELECT
      dsc.id AS asignacion_id,
      dsc.estado_asignacion,
      dsc.fecha_aplicada,
      dsc.hora_aplicada,
      dsc.codigo_aplicado,
      dsc.monto_aplicado,

      ds.id AS descuento_servicio_id,
      ds.tipo_descuento,

      d.id AS descuento_id,
      d.codigo,
      d.titulo,
      d.monto,
      d.porcentaje,
      d.fecha_inicio,
      d.fecha_fin,

      s.id AS servicio_id,
      s.nombre AS servicio_nombre,
      s.precio AS servicio_precio

    FROM descuento d

    INNER JOIN descuento_servicio ds
      ON ds.descuento_id = d.id

    INNER JOIN servicio s
      ON s.id = ds.servicio_id

    LEFT JOIN descuento_servicio_cliente dsc
      ON dsc.descuento_servicio_id = ds.id
      AND dsc.cliente_id = $3

    WHERE UPPER(TRIM(d.codigo)) = UPPER(TRIM($1))
      AND s.id = $2
      AND s.estado = 'HABILITADO'
      AND d.estado = 'ACTIVO'
      AND ds.estado = 'ACTIVO'
      AND ds.tipo_descuento IN ('CLIENTE', 'PUBLICO')

      AND (
        d.fecha_inicio IS NULL
        OR d.fecha_inicio <= CURRENT_DATE
      )

      AND (
        d.fecha_fin IS NULL
        OR d.fecha_fin >= CURRENT_DATE
      )

      AND (
        ds.tipo_descuento = 'PUBLICO'

        OR (
          ds.tipo_descuento = 'CLIENTE'
          AND dsc.id IS NOT NULL
          AND dsc.estado_asignacion = 'ACTIVO'
          AND dsc.fecha_aplicada IS NULL
          AND dsc.hora_aplicada IS NULL
          AND dsc.codigo_aplicado IS NULL
          AND dsc.monto_aplicado IS NULL
          AND dsc.estado_aplicado IS NULL
        )
      )

    LIMIT 1
  `;

	const { rows } = await pool.query(query, [codigo, servicioId, clienteId]);

	return rows[0] || null;
};

const obtenerDescuentoParaReserva = async (
	client,
	codigo,
	servicioId,
	clienteId,
) => {
	const query = `
    SELECT
      dsc.id AS asignacion_id,
      dsc.descuento_servicio_id,
      ds.tipo_descuento,
      d.id AS descuento_id,
      d.codigo,
      d.monto,
      d.porcentaje,
      s.id AS servicio_id,
      s.precio AS servicio_precio

    FROM descuento_servicio_cliente dsc

    INNER JOIN descuento_servicio ds
      ON ds.id = dsc.descuento_servicio_id

    INNER JOIN descuento d
      ON d.id = ds.descuento_id

    INNER JOIN servicio s
      ON s.id = ds.servicio_id

    WHERE UPPER(TRIM(d.codigo)) = UPPER(TRIM($1))
      AND s.id = $2
      AND dsc.cliente_id = $3
      AND dsc.estado_asignacion = 'ACTIVO'
      AND ds.tipo_descuento = 'CLIENTE'
      AND ds.estado = 'ACTIVO'
      AND d.estado = 'ACTIVO'
      AND s.estado = 'HABILITADO'

      AND (d.fecha_inicio IS NULL OR d.fecha_inicio <= CURRENT_DATE)
      AND (d.fecha_fin IS NULL OR d.fecha_fin >= CURRENT_DATE)

      AND dsc.fecha_aplicada IS NULL
      AND dsc.hora_aplicada IS NULL
      AND dsc.codigo_aplicado IS NULL
      AND dsc.monto_aplicado IS NULL
      AND dsc.estado_aplicado IS NULL

    LIMIT 1
    FOR UPDATE OF dsc
  `;

	const { rows } = await client.query(query, [codigo, servicioId, clienteId]);

	return rows[0] || null;
};

const marcarDescuentoUtilizado = async (
	client,
	asignacionId,
	codigo,
	montoDescuento,
) => {
	const query = `
    UPDATE descuento_servicio_cliente
    SET
      fecha_aplicada = CURRENT_DATE,
      hora_aplicada = CURRENT_TIME,
      codigo_aplicado = $2,
      monto_aplicado = $3
    WHERE id = $1
      AND estado_asignacion = 'ACTIVO'
      AND fecha_aplicada IS NULL
      AND hora_aplicada IS NULL
      AND codigo_aplicado IS NULL
      AND monto_aplicado IS NULL
      AND estado_aplicado IS NULL
    RETURNING id
  `;

	const { rows } = await client.query(query, [
		asignacionId,
		codigo,
		montoDescuento,
	]);

	if (rows.length !== 1) {
		const error = new Error(
			"Este código de descuento ya fue utilizado o dejó de estar disponible.",
		);

		error.statusCode = 409;
		error.code = "DESCUENTO_YA_UTILIZADO";

		throw error;
	}

	return rows[0];
};

module.exports = {
	getClienteByToken,
	getDescuentosByClienteId,
	getDescuentosByClienteYProfesional,
	getDescuentosDisponiblesPorServicio,
	validarCodigoDescuento,

	obtenerDescuentoParaReserva,
	marcarDescuentoUtilizado,
};
