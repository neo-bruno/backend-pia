const pool = require("../../database/pool");

async function getEvaluacionParaCliente(clienteToken, evaluacionId) {
  const query = `
    SELECT
      e.id,
      e.tipo_calificacion_id,
      tc.codigo AS tipo_codigo,
      tc.tipo AS tipo_nombre,
      tc.descripcion AS tipo_descripcion,
      tc.objetivo,
      e.puntaje_promedio,
      e.cantidad_calificaciones,
      e.estado AS evaluacion_estado,
      tc.estado AS tipo_estado
    FROM cliente c
    INNER JOIN notificacion n
      ON n.cliente_id = c.id
    INNER JOIN evaluacion e
      ON e.id = n.evaluacion_id
    INNER JOIN tipo_calificacion tc
      ON tc.id = e.tipo_calificacion_id
    WHERE c.token = $1
      AND e.id = $2
      AND n.tipo = 'EVALUACION_PENDIENTE'
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [clienteToken, evaluacionId]);

  return rows[0] || null;
}

module.exports = {
  getEvaluacionParaCliente,
};
