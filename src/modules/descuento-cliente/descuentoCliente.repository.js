const pool = require("../../database/pool");

// =====================================================
// OBTENER DESCUENTOS DE UN CLIENTE
// =====================================================

const getDescuentosByClienteId = async (clienteId) => {
	const query = `
    SELECT *
    FROM (
      -- ==========================================
      -- DESCUENTOS PERSONALES DEL CLIENTE
      -- ==========================================
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

      UNION ALL

      -- ==========================================
      -- PROMOCIONES PÚBLICAS
      -- DISPONIBLES, UTILIZADAS Y VENCIDAS
      -- ==========================================
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

      FROM descuento_servicio ds

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

      LEFT JOIN descuento_servicio_cliente dsc
        ON dsc.descuento_servicio_id = ds.id
        AND dsc.cliente_id = $1

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

      WHERE ds.tipo_descuento = 'PUBLICO'
        AND ds.estado = 'ACTIVO'
        AND d.estado = 'ACTIVO'
        AND s.estado = 'HABILITADO'

        AND (
          d.fecha_inicio IS NULL
          OR d.fecha_inicio <= CURRENT_DATE
        )

        AND (
          d.fecha_fin IS NULL
          OR d.fecha_fin >= CURRENT_DATE
        )

    ) AS descuentos

    ORDER BY
      fecha_fin ASC NULLS LAST,
      servicio_nombre ASC,
      descuento_titulo ASC
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
        (
          ds.tipo_descuento = 'PUBLICO'
          AND NOT EXISTS (
            SELECT 1
            FROM descuento_servicio_cliente dsc_usado
            WHERE dsc_usado.descuento_servicio_id = ds.id
              AND dsc_usado.cliente_id = $3
          )
        )
        OR
        (
          ds.tipo_descuento = 'CLIENTE'
          AND dsc.id IS NOT NULL
          AND dsc.estado_asignacion = 'ACTIVO'
          AND dsc.fecha_aplicada IS NULL
          AND dsc.hora_aplicada IS NULL
          AND dsc.codigo_aplicado IS NULL
          AND dsc.monto_aplicado IS NULL
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
	// ============================================================
	// 1. BUSCAR EL DESCUENTO VINCULADO AL SERVICIO
	// ============================================================

	const queryDescuento = `
    SELECT
      ds.id AS descuento_servicio_id,
      ds.tipo_descuento,
      ds.estado AS estado_relacion,

      d.id AS descuento_id,
      d.codigo,
      d.titulo,
      d.monto,
      d.porcentaje,
      d.fecha_inicio,
      d.fecha_fin,
      d.estado AS estado_descuento,

      s.id AS servicio_id,
      s.precio AS servicio_precio,
      s.estado AS estado_servicio

    FROM descuento_servicio ds

    INNER JOIN descuento d
      ON d.id = ds.descuento_id

    INNER JOIN servicio s
      ON s.id = ds.servicio_id

    WHERE UPPER(TRIM(d.codigo)) = UPPER(TRIM($1))
      AND s.id = $2

    LIMIT 1
    FOR UPDATE OF ds, d
  `;

	const resultado = await client.query(queryDescuento, [codigo, servicioId]);

	const descuento = resultado.rows[0];

	if (!descuento) {
		return null;
	}

	// ============================================================
	// 2. VALIDAR ESTADOS Y VIGENCIA
	// ============================================================

	if (
		descuento.estado_descuento !== "ACTIVO" ||
		descuento.estado_relacion !== "ACTIVO" ||
		descuento.estado_servicio !== "HABILITADO"
	) {
		return null;
	}

	const vigente = await client.query(
		`
      SELECT
        ($1::date IS NULL OR $1::date <= CURRENT_DATE)
        AND
        ($2::date IS NULL OR $2::date >= CURRENT_DATE)
        AS vigente
    `,
		[descuento.fecha_inicio, descuento.fecha_fin],
	);

	if (!vigente.rows[0].vigente) {
		return null;
	}

	// ============================================================
	// 3. DESCUENTO PUBLICO
	// No requiere asignacion individual al cliente.
	// ============================================================

	if (descuento.tipo_descuento === "PUBLICO") {
		const usoAnterior = await client.query(
			`
      SELECT id
      FROM descuento_servicio_cliente
      WHERE descuento_servicio_id = $1
        AND cliente_id = $2
      LIMIT 1
      FOR UPDATE
    `,
			[descuento.descuento_servicio_id, clienteId],
		);

		if (usoAnterior.rows.length > 0) {
			return null;
		}

		return {
			...descuento,
			asignacion_id: null,
			es_publico: true,
		};
	}

	// ============================================================
	// 4. DESCUENTO PARA UN CLIENTE ESPECIFICO
	// ============================================================

	if (descuento.tipo_descuento === "CLIENTE") {
		const queryAsignacion = `
      SELECT
        dsc.id AS asignacion_id,
        dsc.descuento_servicio_id,
        dsc.estado_asignacion,
        dsc.fecha_aplicada,
        dsc.hora_aplicada,
        dsc.codigo_aplicado,
        dsc.monto_aplicado,
        dsc.estado_aplicado

      FROM descuento_servicio_cliente dsc

      WHERE dsc.descuento_servicio_id = $1
        AND dsc.cliente_id = $2
        AND dsc.estado_asignacion = 'ACTIVO'

        AND dsc.fecha_aplicada IS NULL
        AND dsc.hora_aplicada IS NULL
        AND dsc.codigo_aplicado IS NULL
        AND dsc.monto_aplicado IS NULL
        AND dsc.estado_aplicado IS NULL

      LIMIT 1
      FOR UPDATE
    `;

		const asignacion = await client.query(queryAsignacion, [
			descuento.descuento_servicio_id,
			clienteId,
		]);

		if (!asignacion.rows.length) {
			return null;
		}

		return {
			...descuento,
			...asignacion.rows[0],
			es_publico: false,
		};
	}

	// No aceptar tipos desconocidos.
	return null;
};

const marcarDescuentoUtilizado = async (
	client,
	descuento,
	clienteId,
	codigo,
	montoDescuento,
) => {
	// =====================================================
	// DESCUENTO PUBLICO: INSERTAR UTILIZACION
	// =====================================================

	if (descuento.es_publico) {
		const query = `
      INSERT INTO descuento_servicio_cliente (
        descuento_servicio_id,
        cliente_id,
        fecha_aplicada,
        hora_aplicada,
        codigo_aplicado,
        monto_aplicado,
        estado_asignacion
      )
      VALUES (
        $1,
        $2,
        CURRENT_DATE,
        CURRENT_TIME,
        $3,
        $4,
        'INACTIVO'
      )
      ON CONFLICT (descuento_servicio_id, cliente_id)
      WHERE cliente_id IS NOT NULL
      DO NOTHING
      RETURNING id
    `;

		const { rows } = await client.query(query, [
			descuento.descuento_servicio_id,
			clienteId,
			codigo,
			montoDescuento,
		]);

		if (rows.length !== 1) {
			const error = new Error(
				"Este código de descuento ya fue utilizado por este cliente.",
			);

			error.status = 409;
			error.code = "DESCUENTO_YA_UTILIZADO";

			throw error;
		}

		return rows[0];
	}

	// =====================================================
	// DESCUENTO CLIENTE: ACTUALIZAR ASIGNACION EXISTENTE
	// =====================================================

	const query = `
    UPDATE descuento_servicio_cliente
    SET
      fecha_aplicada = CURRENT_DATE,
      hora_aplicada = CURRENT_TIME,
      codigo_aplicado = $2,
      monto_aplicado = $3
    WHERE id = $1
      AND cliente_id = $4
      AND estado_asignacion = 'ACTIVO'
      AND fecha_aplicada IS NULL
      AND hora_aplicada IS NULL
      AND codigo_aplicado IS NULL
      AND monto_aplicado IS NULL
      AND estado_aplicado IS NULL
    RETURNING id
  `;

	const { rows } = await client.query(query, [
		descuento.asignacion_id,
		codigo,
		montoDescuento,
		clienteId,
	]);

	if (rows.length !== 1) {
		const error = new Error(
			"Este código de descuento ya fue utilizado o dejó de estar disponible.",
		);

		error.status = 409;
		error.code = "DESCUENTO_YA_UTILIZADO";

		throw error;
	}

	return rows[0];
};

const getDescuentosPublicosByProfesional = async (profesionalId) => {
	const query = `
    SELECT
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

    FROM descuento_servicio ds

    INNER JOIN descuento d
      ON d.id = ds.descuento_id

    INNER JOIN servicio s
      ON s.id = ds.servicio_id

    WHERE s.profesional_id = $1
      AND ds.tipo_descuento = 'PUBLICO'
      AND ds.estado = 'ACTIVO'
      AND d.estado = 'ACTIVO'
      AND s.estado = 'HABILITADO'

      AND (
        d.fecha_inicio IS NULL
        OR d.fecha_inicio <= CURRENT_DATE
      )

      AND (
        d.fecha_fin IS NULL
        OR d.fecha_fin >= CURRENT_DATE
      )

    ORDER BY s.nombre, d.titulo;
  `;

	const { rows } = await pool.query(query, [profesionalId]);

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

module.exports = {
	getClienteByToken,
	getDescuentosByClienteId,
	getDescuentosByClienteYProfesional,
	getDescuentosDisponiblesPorServicio,
	validarCodigoDescuento,

	obtenerDescuentoParaReserva,
	marcarDescuentoUtilizado,
	getDescuentosPublicosByProfesional,
};
