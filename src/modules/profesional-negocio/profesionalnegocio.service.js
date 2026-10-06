const pool = require("../../database/pool");
const repository = require('./profesionalnegocio.repository')
const { validarProfesionalId, } = require("./profesionalnegocio.validation");

const getProfessionalBusiness = async (profesionalId) => {
  profesionalId = validarProfesionalId(profesionalId);

  const client = await pool.connect();

  try {
    /**
     * 1. Obtener el negocio del profesional que está operando.
     *
     * Aquí SÍ verificamos acceso porque estamos
     * autorizando quién puede administrar el negocio.
     */
    const negocio = await repository.getBusinessByOwnerProfessionalId(
      client,
      profesionalId,
    );

    if (!negocio) {
      const error = new Error(
        "El profesional no tiene un negocio con acceso autorizado",
      );

      error.status = 403;

      throw error;
    }

    /**
     * 2. Obtener todos los profesionales
     *    que trabajan actualmente en ese negocio.
     *
     * Aquí NO importa el campo acceso.
     */
    const profesionales = await repository.getProfessionalsByBusinessId(
      client,
      negocio.negocio_id,
    );

    return {
      negocio: {
        id: negocio.negocio_id,
        nombre: negocio.negocio_nombre,
        slug: negocio.negocio_slug,
      },

      profesionales,
    };
  } finally {
    client.release();
  }
};

module.exports = {
  getProfessionalBusiness
}