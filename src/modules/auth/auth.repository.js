const pool = require("../../database/pool");

const buscarUsuarioPorTelefono = async (telefono) => {
  const query = `
        SELECT
            u.id AS usuario_id,
            u.persona_id,
            u.rol_id,
            u.telefono,
            u.password,
            u.estado AS usuario_estado,

            p.nombre AS persona_nombre,
            p.telefono AS persona_telefono,

            r.nombre AS rol_nombre,
            r.descripcion AS rol_descripcion

        FROM usuario u

        INNER JOIN persona p
            ON p.id = u.persona_id

        INNER JOIN rol r
            ON r.id = u.rol_id

        WHERE u.telefono = $1
        LIMIT 1
    `;

  const { rows } = await pool.query(query, [telefono]);

  return rows[0] || null;
};

module.exports = {
  buscarUsuarioPorTelefono,
};
