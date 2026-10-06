/**
 * Obtiene el negocio al que pertenece el profesional que está operando.
 *
 * Este profesional debe tener acceso al negocio.
 */
const getBusinessByOwnerProfessionalId = async (client, profesionalId) => {
  const query = `
    SELECT
      pn.negocio_id,
      n.nombre AS negocio_nombre,
      n.slug AS negocio_slug
    FROM profesional_negocio pn

    INNER JOIN negocio n
      ON n.id = pn.negocio_id

    WHERE pn.profesional_id = $1
      AND pn.acceso = 'ACEPTADO'
      AND pn.estado = 'HABILITADO'

    ORDER BY pn.id DESC

    LIMIT 1
  `;

  const { rows } = await client.query(query, [profesionalId]);

  return rows[0] || null;
};

/**
 * Obtiene todos los profesionales que actualmente
 * trabajan en el negocio.
 *
 * IMPORTANTE:
 * NO filtramos por acceso.
 *
 * acceso = ACEPTADO / DENEGADO
 * determina acceso al sistema.
 *
 * estado = HABILITADO
 * determina que actualmente pertenece/trabaja en el negocio.
 */
const getProfessionalsByBusinessId = async (client, negocioId) => {
  const query = `
    SELECT
      p.id AS profesional_id,

      p.persona_id,

      per.nombre,
      per.telefono,
      per.sexo,

      p.slug,
      p.estado AS estado_profesional,
      p.estado_funciones,

      pn.acceso,
      pn.estado AS estado_negocio,
      pn.fecha_creacion

    FROM profesional_negocio pn

    INNER JOIN profesional p
      ON p.id = pn.profesional_id

    INNER JOIN persona per
      ON per.id = p.persona_id

    WHERE pn.negocio_id = $1
      AND pn.estado = 'HABILITADO'

    ORDER BY per.nombre ASC
  `;

  const { rows } = await client.query(query, [negocioId]);

  return rows;
};

module.exports = {
  getBusinessByOwnerProfessionalId,
  getProfessionalsByBusinessId,
};
