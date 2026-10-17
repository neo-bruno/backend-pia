const getSegmentacion = async (client, profesionalId) => {
  const query = `
    SELECT
      s.id,
      s.nombre,
      s.descripcion,
      s.orden,
      s.min_atenciones,
      s.periodo_dias,
      s.max_intervalo_dias,
      s.max_dias_ultima_atencion,
      s.estado
    FROM segmentacion s
    WHERE s.estado = 'ACTIVO'
    ORDER BY s.orden ASC
  `;

  const { rows } = await client.query(query);
  return rows;
};

const getAtencionesCliente = async (client, profesionalId, clienteId) => {
  const query = `
    SELECT
      h.id AS historial_id,
      h.cliente_id,
      h.profesional_id,
      h.fecha,
      h.reserva_id,
      r.estado AS reserva_estado
    FROM historial h
    INNER JOIN reserva r
      ON r.id = h.reserva_id
    WHERE h.profesional_id = $1
      AND h.cliente_id = $2
      AND r.estado = 'COMPLETADA'
    ORDER BY h.fecha ASC, h.id ASC
  `;

  const { rows } = await client.query(query, [profesionalId, clienteId]);

  return rows;
};

const getHistorialSegmentacion = async (client, profesionalId, clienteId) => {
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

const registrarSegmentacion = async (client, historialId, segmentacionId) => {
  const query = `
    INSERT INTO historial_segmentacion (
      historial_id,
      segmentacion_id
    )
    VALUES ($1, $2)
    ON CONFLICT (historial_id, segmentacion_id) DO NOTHING
    RETURNING id
  `;

  const { rows } = await client.query(query, [historialId, segmentacionId]);

  return rows[0] || null;
};

module.exports = {
  getSegmentacion,
  getAtencionesCliente,
  getHistorialSegmentacion,
  registrarSegmentacion,
};
