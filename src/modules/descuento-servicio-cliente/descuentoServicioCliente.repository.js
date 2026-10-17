// ============================================================
// DESCUENTOS ASIGNABLES A UN CLIENTE
// ============================================================

exports.listarDescuentosDisponibles = async (
	client,
	negocioId,
	profesionalId,
	clienteId,
) => {
	const sql = `
    SELECT
      ds.id AS descuento_servicio_id,
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
      s.estado AS servicio_estado,

      (
        SELECT a.url
        FROM servicio_archivo sa
        INNER JOIN archivo a
          ON a.id = sa.archivo_id
        WHERE sa.servicio_id = s.id
          AND sa.tipo = 'FOTO'
          AND sa.principal = TRUE
        ORDER BY sa.id DESC
        LIMIT 1
      ) AS imagen_url,

      asignacion.id AS asignacion_id,
      asignacion.estado_aplicado,
      asignacion.estado_asignacion,
      asignacion.fecha_aplicada,
      asignacion.hora_aplicada,
      asignacion.codigo_aplicado,
      asignacion.monto_aplicado,
      asignacion.created_at AS fecha_asignacion,

      (
        asignacion.id IS NOT NULL
        AND asignacion.estado_asignacion = 'ACTIVO'
      ) AS ya_asignado,

      (
        asignacion.id IS NOT NULL
        AND asignacion.estado_asignacion = 'ACTIVO'
      ) AS asignacion_activa,

      (
        asignacion.fecha_aplicada IS NOT NULL
        OR asignacion.hora_aplicada IS NOT NULL
        OR asignacion.codigo_aplicado IS NOT NULL
        OR asignacion.monto_aplicado IS NOT NULL
        OR asignacion.estado_aplicado IS NOT NULL
      ) AS descuento_consumido

    FROM descuento_servicio ds

    INNER JOIN descuento d
      ON d.id = ds.descuento_id

    INNER JOIN servicio s
      ON s.id = ds.servicio_id

    LEFT JOIN LATERAL (
      SELECT
        dsc.id,
        dsc.estado_aplicado,
        dsc.estado_asignacion,
        dsc.fecha_aplicada,
        dsc.hora_aplicada,
        dsc.codigo_aplicado,
        dsc.monto_aplicado,
        dsc.created_at
      FROM descuento_servicio_cliente dsc
      WHERE dsc.descuento_servicio_id = ds.id
        AND dsc.cliente_id = $3
      ORDER BY
        CASE
          WHEN dsc.estado_asignacion = 'ACTIVO' THEN 0
          WHEN dsc.estado_aplicado IS NOT NULL
            OR dsc.fecha_aplicada IS NOT NULL
            OR dsc.hora_aplicada IS NOT NULL
            OR dsc.codigo_aplicado IS NOT NULL
            OR dsc.monto_aplicado IS NOT NULL THEN 1
          ELSE 2
        END,
        dsc.id DESC
      LIMIT 1
    ) asignacion ON TRUE

    WHERE d.negocio_id = $1
      AND d.profesional_id = $2
      AND ds.tipo_descuento = 'CLIENTE'
      AND ds.estado = 'ACTIVO'
      AND d.estado = 'ACTIVO'
      AND s.estado = 'HABILITADO'
      AND (
        d.fecha_fin IS NULL
        OR d.fecha_fin >= CURRENT_DATE
      )

    ORDER BY
      s.nombre ASC,
      d.titulo ASC,
      ds.id ASC
  `;

	const { rows } = await client.query(sql, [
		negocioId,
		profesionalId,
		clienteId,
	]);

	return rows;
};

// ============================================================
// VERIFICAR CLIENTE VINCULADO AL PROFESIONAL
// ============================================================

exports.existeClienteProfesional = async (client, profesionalId, clienteId) => {
	const sql = `
    SELECT 1
    WHERE EXISTS (
      SELECT 1
      FROM reserva r
      INNER JOIN servicio s
        ON s.id = r.servicio_id
      WHERE r.cliente_id = $2
        AND s.profesional_id = $1
    )
    OR EXISTS (
      SELECT 1
      FROM historial h
      WHERE h.cliente_id = $2
        AND h.profesional_id = $1
    )
    LIMIT 1
  `;

	const { rows } = await client.query(sql, [profesionalId, clienteId]);

	return rows.length > 0;
};

// ============================================================
// OBTENER ASOCIACIONES VALIDAS PARA ASIGNAR
// ============================================================

exports.obtenerAsociacionesAsignables = async (
	client,
	negocioId,
	profesionalId,
	descuentoServicioIds,
) => {
	const sql = `
    SELECT
      ds.id AS descuento_servicio_id,
      ds.descuento_id,
      ds.servicio_id,
      ds.tipo_descuento,
      ds.estado AS estado_descuento_servicio
    FROM descuento_servicio ds

    INNER JOIN descuento d
      ON d.id = ds.descuento_id

    INNER JOIN servicio s
      ON s.id = ds.servicio_id

    WHERE ds.id = ANY($3::integer[])
      AND d.negocio_id = $1
      AND d.profesional_id = $2
      AND ds.tipo_descuento = 'CLIENTE'
      AND ds.estado = 'ACTIVO'
      AND d.estado = 'ACTIVO'
      AND s.estado = 'HABILITADO'
      AND (
        d.fecha_fin IS NULL
        OR d.fecha_fin >= CURRENT_DATE
      )

    ORDER BY ds.id
    FOR UPDATE OF ds
  `;

	const { rows } = await client.query(sql, [
		negocioId,
		profesionalId,
		descuentoServicioIds,
	]);

	return rows;
};

// ============================================================
// BUSCAR ASIGNACIONES EXISTENTES
// Incluye activas, retiradas y consumidas.
// Evita volver a asignar el mismo descuento al cliente.
// ============================================================

exports.obtenerAsignacionesExistentes = async (
	client,
	clienteId,
	descuentoServicioIds,
) => {
	const sql = `
    SELECT
      dsc.id,
      dsc.descuento_servicio_id,
      dsc.cliente_id,
      dsc.estado_asignacion,
      dsc.estado_aplicado,
      dsc.fecha_aplicada,
      dsc.hora_aplicada,
      dsc.codigo_aplicado,
      dsc.monto_aplicado

    FROM descuento_servicio_cliente dsc

    WHERE dsc.cliente_id = $1
      AND dsc.descuento_servicio_id = ANY($2::int[])
      AND (
        dsc.estado_asignacion = 'ACTIVO'
        OR dsc.estado_aplicado IS NOT NULL
        OR dsc.fecha_aplicada IS NOT NULL
        OR dsc.hora_aplicada IS NOT NULL
        OR dsc.codigo_aplicado IS NOT NULL
        OR dsc.monto_aplicado IS NOT NULL
      )

    FOR UPDATE OF dsc
  `;

	const { rows } = await client.query(sql, [clienteId, descuentoServicioIds]);

	return rows;
};

// ============================================================
// INSERTAR ASIGNACION
// Todavía no se ha utilizado el código.
// ============================================================

exports.crearAsignacion = async (client, descuentoServicioId, clienteId) => {
	const sql = `
    INSERT INTO descuento_servicio_cliente (
      descuento_servicio_id,
      cliente_id,
      fecha_aplicada,
      hora_aplicada,
      codigo_aplicado,
      monto_aplicado,
      estado_aplicado,
      estado_asignacion
    )
    VALUES (
      $1,
      $2,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      'ACTIVO'
    )
    RETURNING
      id,
      descuento_servicio_id,
      cliente_id,
      fecha_aplicada,
      hora_aplicada,
      codigo_aplicado,
      monto_aplicado,
      estado_aplicado,
      estado_asignacion,
      created_at
  `;

	const { rows } = await client.query(sql, [descuentoServicioId, clienteId]);

	return rows[0];
};

// ============================================================
// BUSCAR ASIGNACION PARA RETIRAR
// Verifica cliente, profesional y negocio.
// Bloquea la fila durante la transacción.
// ============================================================

exports.obtenerAsignacionParaRetirar = async (
	client,
	negocioId,
	profesionalId,
	asignacionId,
) => {
	const sql = `
    SELECT
      dsc.id AS asignacion_id,
      dsc.cliente_id,
      dsc.descuento_servicio_id,
      dsc.estado_asignacion,
      dsc.estado_aplicado,
      dsc.fecha_aplicada,
      dsc.hora_aplicada,
      dsc.codigo_aplicado,
      dsc.monto_aplicado

    FROM descuento_servicio_cliente dsc

    INNER JOIN descuento_servicio ds
      ON ds.id = dsc.descuento_servicio_id

    INNER JOIN descuento d
      ON d.id = ds.descuento_id

    WHERE dsc.id = $1
      AND d.negocio_id = $2
      AND d.profesional_id = $3

    FOR UPDATE OF dsc
  `;

	const { rows } = await client.query(sql, [
		asignacionId,
		negocioId,
		profesionalId,
	]);

	return rows[0] || null;
};

// ============================================================
// RETIRAR ASIGNACION
// Conserva el registro histórico.
// No modifica los datos de consumo.
// ============================================================

exports.retirarAsignacion = async (client, asignacionId) => {
	const sql = `
    UPDATE descuento_servicio_cliente
    SET estado_asignacion = 'INACTIVO'
    WHERE id = $1
      AND estado_asignacion = 'ACTIVO'
      AND fecha_aplicada IS NULL
      AND hora_aplicada IS NULL
      AND codigo_aplicado IS NULL
      AND monto_aplicado IS NULL
      AND estado_aplicado IS NULL

    RETURNING
      id AS asignacion_id,
      cliente_id,
      descuento_servicio_id,
      estado_asignacion,
      estado_aplicado,
      fecha_aplicada,
      hora_aplicada,
      codigo_aplicado,
      monto_aplicado
  `;

	const { rows } = await client.query(sql, [asignacionId]);

	return rows[0] || null;
};
