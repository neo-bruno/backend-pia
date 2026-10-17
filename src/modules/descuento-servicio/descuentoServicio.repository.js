const listarServiciosPorDescuento = async (
  client,
  negocioId,
  profesionalId,
  descuentoId,
) => {
  const sql = `
    SELECT
      s.id AS servicio_id,
      s.nombre AS servicio_nombre,
      s.descripcion AS servicio_descripcion,
      s.duracion,
      s.precio,
      s.estado AS servicio_estado,

      imagen.imagen_url,

      ds.id AS servicio_descuento_id,
      ds.tipo_descuento,
      ds.estado AS estado_descuento_servicio

    FROM descuento d

    INNER JOIN servicio s
      ON s.profesional_id = d.profesional_id

    LEFT JOIN LATERAL (
      SELECT a.url AS imagen_url
      FROM servicio_archivo sa
      INNER JOIN archivo a
        ON a.id = sa.archivo_id
      WHERE sa.servicio_id = s.id
        AND sa.tipo = 'FOTO'
      ORDER BY
        sa.principal DESC,
        sa.orden ASC,
        sa.id ASC
      LIMIT 1
    ) imagen ON TRUE

    LEFT JOIN descuento_servicio ds
      ON ds.servicio_id = s.id
      AND ds.descuento_id = d.id

    WHERE d.id = $1
      AND d.negocio_id = $2
      AND d.profesional_id = $3

    ORDER BY s.nombre ASC
  `;

  const { rows } = await client.query(sql, [
    descuentoId,
    negocioId,
    profesionalId,
  ]);

  return rows;
};

const obtenerDescuentoPropio = async (
  client,
  negocioId,
  profesionalId,
  descuentoId,
) => {
  const sql = `
    SELECT id, negocio_id, profesional_id, estado
    FROM descuento
    WHERE id = $1
      AND negocio_id = $2
      AND profesional_id = $3
    LIMIT 1
  `;

  const { rows } = await client.query(sql, [
    descuentoId,
    negocioId,
    profesionalId,
  ]);

  return rows[0] || null;
};

const obtenerServiciosPropios = async (client, profesionalId, servicioIds) => {
  if (servicioIds.length === 0) return [];

  const sql = `
    SELECT id, nombre, estado
    FROM servicio
    WHERE profesional_id = $1
      AND id = ANY($2::integer[])
  `;

  const { rows } = await client.query(sql, [profesionalId, servicioIds]);

  return rows;
};

const guardarAsociacion = async (
  client,
  descuentoId,
  servicioId,
  tipoDescuento,
) => {
  const sql = `
    INSERT INTO descuento_servicio (
      servicio_id,
      descuento_id,
      tipo_descuento,
      estado
    )
    VALUES ($1, $2, $3, 'ACTIVO')
    ON CONFLICT (servicio_id, descuento_id)
    DO UPDATE SET
      tipo_descuento = EXCLUDED.tipo_descuento,
      estado = 'ACTIVO',
      updated_at = CURRENT_TIMESTAMP
    RETURNING *
  `;

  const { rows } = await client.query(sql, [
    servicioId,
    descuentoId,
    tipoDescuento,
  ]);

  return rows[0];
};

const desactivarAsociacionesNoSeleccionadas = async (
  client,
  descuentoId,
  servicioIds,
) => {
  if (servicioIds.length === 0) {
    const sql = `
      UPDATE descuento_servicio
      SET estado = 'INACTIVO',
          updated_at = CURRENT_TIMESTAMP
      WHERE descuento_id = $1
        AND estado = 'ACTIVO'
    `;

    await client.query(sql, [descuentoId]);
    return;
  }

  const sql = `
    UPDATE descuento_servicio
    SET estado = 'INACTIVO',
        updated_at = CURRENT_TIMESTAMP
    WHERE descuento_id = $1
      AND estado = 'ACTIVO'
      AND NOT (servicio_id = ANY($2::integer[]))
  `;

  await client.query(sql, [descuentoId, servicioIds]);
};

module.exports = {
  listarServiciosPorDescuento,
  obtenerDescuentoPropio,
  obtenerServiciosPropios,
  guardarAsociacion,
  desactivarAsociacionesNoSeleccionadas,
};
