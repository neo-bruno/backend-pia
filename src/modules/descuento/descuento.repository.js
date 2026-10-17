const listarDescuentos = async (
  client,
  negocioId,
  profesionalId,
  filtros = {},
) => {
  const condiciones = ["d.negocio_id = $1", "d.profesional_id = $2"];

  const valores = [negocioId, profesionalId];
  let posicion = 3;

  if (filtros.estado) {
    condiciones.push(`d.estado = $${posicion}`);
    valores.push(filtros.estado);
    posicion++;
  }

  if (filtros.buscar) {
    condiciones.push(
      `(d.titulo ILIKE $${posicion}
        OR d.codigo ILIKE $${posicion}
        OR d.descripcion ILIKE $${posicion})`,
    );
    valores.push(`%${filtros.buscar}%`);
    posicion++;
  }

  const query = `
    SELECT
      d.id,
      d.negocio_id,
      d.profesional_id,
      d.codigo,
      d.titulo,
      d.descripcion,
      d.monto,
      d.porcentaje,
      d.fecha_inicio,
      d.fecha_fin,
      d.estado,
      d.created_at,
      d.updated_at
    FROM descuento d
    WHERE ${condiciones.join(" AND ")}
    ORDER BY d.created_at DESC, d.id DESC
  `;

  const { rows } = await client.query(query, valores);
  return rows;
};

const obtenerDescuento = async (
  client,
  negocioId,
  profesionalId,
  descuentoId,
) => {
  const query = `
    SELECT
      d.id,
      d.negocio_id,
      d.profesional_id,
      d.codigo,
      d.titulo,
      d.descripcion,
      d.monto,
      d.porcentaje,
      d.fecha_inicio,
      d.fecha_fin,
      d.estado,
      d.created_at,
      d.updated_at
    FROM descuento d
    WHERE d.id = $1
      AND d.negocio_id = $2
      AND d.profesional_id = $3
  `;

  const { rows } = await client.query(query, [
    descuentoId,
    negocioId,
    profesionalId,
  ]);

  return rows[0] || null;
};

const crearDescuento = async (client, datos) => {
  const query = `
    INSERT INTO descuento (
      negocio_id,
      profesional_id,
      codigo,
      titulo,
      descripcion,
      monto,
      porcentaje,
      fecha_inicio,
      fecha_fin,
      estado
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *
  `;

  const valores = [
    datos.negocioId,
    datos.profesionalId,
    datos.codigo,
    datos.titulo,
    datos.descripcion,
    datos.monto,
    datos.porcentaje,
    datos.fecha_inicio,
    datos.fecha_fin,
    datos.estado,
  ];

  const { rows } = await client.query(query, valores);
  return rows[0];
};

const actualizarDescuento = async (
  client,
  negocioId,
  profesionalId,
  descuentoId,
  datos,
) => {
  const query = `
    UPDATE descuento
    SET
      titulo = $4,
      descripcion = $5,
      monto = $6,
      porcentaje = $7,
      fecha_inicio = $8,
      fecha_fin = $9,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
      AND negocio_id = $2
      AND profesional_id = $3
    RETURNING *
  `;

  const valores = [
    descuentoId,
    negocioId,
    profesionalId,
    datos.titulo,
    datos.descripcion,
    datos.monto,
    datos.porcentaje,
    datos.fecha_inicio,
    datos.fecha_fin,
  ];

  const { rows } = await client.query(query, valores);
  return rows[0] || null;
};

const cambiarEstadoDescuento = async (
  client,
  negocioId,
  profesionalId,
  descuentoId,
  estado,
) => {
  const query = `
    UPDATE descuento
    SET
      estado = $4,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
      AND negocio_id = $2
      AND profesional_id = $3
    RETURNING *
  `;

  const { rows } = await client.query(query, [
    descuentoId,
    negocioId,
    profesionalId,
    estado,
  ]);

  return rows[0] || null;
};

module.exports = {
  listarDescuentos,
  obtenerDescuento,
  crearDescuento,
  actualizarDescuento,
  cambiarEstadoDescuento,
};
