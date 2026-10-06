const pool = require("../../database/pool");

const getManagement = async () => {
  const query = `
      SELECT
          g.gerente_id,
          ge.nombre AS nombre_gerente,
          g.archivo_id,
          a.url,
          a.tipo,
          g.nombre AS nombre_gerencia,
          g.direccion,
          g.monto_qr
      FROM gerencia AS g
      INNER JOIN archivo AS a
          ON a.id = g.archivo_id
      INNER JOIN gerente AS ge
          ON ge.id = g.gerente_id;
    `;
  const { rows } = await pool.query(query);
  return rows[0];
};

module.exports = {
  getManagement,
};
