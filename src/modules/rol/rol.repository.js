const pool = require("../../database/pool");

const listar = async () => {
  const query = `
        SELECT
            id,
            nombre,
            descripcion
        FROM rol
        ORDER BY nombre ASC
    `;
  const { rows } = await pool.query(query);
  return rows;
};

const buscarPorId = async (id) => {
  const query = `
        SELECT
            id,
            nombre,
            descripcion
        FROM rol
        WHERE id = $1
    `;
  const { rows } = await pool.query(query, [id]);
  return rows[0] || null;
};

module.exports = {
  listar,
  buscarPorId,
};
