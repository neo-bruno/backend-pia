const pool = require("../../database/pool");

// Ajustaremos este require a la ubicación REAL de tu repository.
const repository = require("../../modules/servicio/servicio.repository");

async function buscarServicios(negocioId) {
  if (!negocioId) {
    throw new Error("El negocio_id es obligatorio.");
  }

  const client = await pool.connect();

  try {
    const servicios = await repository.buscarServiciosPorNegocio(
      client,
      negocioId,
    );

    return servicios.map((servicio) => ({
      id: Number(servicio.id),

      nombre: servicio.nombre,

      descripcion: servicio.descripcion,

      duracion: Number(servicio.duracion),

      precio: Number(servicio.precio),

      profesional: {
        id: Number(servicio.profesional_id),

        nombre: servicio.profesional_nombre,
      },
    }));
  } finally {
    client.release();
  }
}

module.exports = {
  buscarServicios,
};
