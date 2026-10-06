const pool = require("../../database/pool");
const repository = require("./servicioPublico.repository");

async function getServiceById(servicioId) {
  const servicio = await repository.getServiceById(servicioId);

  if (!servicio) {
    return null;
  }

  return servicio;
}

// ============================================================
// OBTENER SERVICIOS DE UN PROFESIONAL
// ============================================================
const getServicesByProfessionalId = async (profesionalId) => {
  const client = await pool.connect();

  try {
    const servicios = await repository.getServicesByProfessionalId(
      client,
      profesionalId,
    );

    return servicios.map((servicio) => ({
      /* =========================================
         SERVICIO
      ========================================== */

      id: Number(servicio.id),

      profesional_id: Number(servicio.profesional_id),

      nombre: servicio.nombre,

      descripcion: servicio.descripcion,

      duracion: Number(servicio.duracion),

      precio: Number(servicio.precio),

      estado: servicio.estado,

      foto: servicio.foto,

      /* =========================================
         CONDICIÓN
      ========================================== */

      condicion: servicio.condicion_id
        ? {
            id: Number(servicio.condicion_id),

            nombre: servicio.condicion_nombre,

            descripcion: servicio.condicion_descripcion,

            requiere_adelanto: servicio.requiere_adelanto,

            monto_adelanto: servicio.monto_adelanto
              ? Number(servicio.monto_adelanto)
              : null,

            porcentaje_adelanto: servicio.porcentaje_adelanto
              ? Number(servicio.porcentaje_adelanto)
              : null,

            permite_reprogramar: servicio.permite_reprogramar,

            limite_horas_reprogramacion: servicio.limite_horas_reprogramacion,

            permite_cancelar: servicio.permite_cancelar,

            limite_horas_cancelacion: servicio.limite_horas_cancelacion,
          }
        : null,
    }));
  } finally {
    client.release();
  }
};

module.exports = {
  getServiceById,

  getServicesByProfessionalId,
};
