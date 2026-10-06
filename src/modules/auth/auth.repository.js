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
      r.descripcion AS rol_descripcion,

      -- Profesional
      pr.id AS profesional_id,
      pr.estado AS profesional_estado,
      pr.estado_funciones AS profesional_estado_funciones,

      -- Relación profesional - negocio
      pn.negocio_id,
      pn.estado AS profesional_negocio_estado,
      pn.acceso AS acceso

    FROM usuario u

    INNER JOIN persona p
      ON p.id = u.persona_id

    INNER JOIN rol r
      ON r.id = u.rol_id

    LEFT JOIN profesional pr
      ON pr.persona_id = u.persona_id

    LEFT JOIN profesional_negocio pn
      ON pn.profesional_id = pr.id
      AND pn.estado = 'HABILITADO'

    WHERE u.telefono = $1

    LIMIT 1
  `;

  const { rows } = await pool.query(query, [telefono]);

  return rows[0] || null;
};

module.exports = {
  buscarUsuarioPorTelefono,
};
