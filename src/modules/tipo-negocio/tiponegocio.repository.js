const pool = require("../../database/pool");

const listar = async () => {
  const query = `
        SELECT
            id,
            nombre,
            descripcion
        FROM tipo_negocio
        ORDER BY nombre ASC
    `;
  const { rows } = await pool.query(query);
  return rows;
};

module.exports = {
  listar,
};
