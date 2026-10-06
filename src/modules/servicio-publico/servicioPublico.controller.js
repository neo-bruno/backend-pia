const service = require("./servicioPublico.service");

async function getServicesById(req, res) {
  try {
    const { servicioId } = req.params;

    const servicio = await service.getServiceById(Number(servicioId));

    if (!servicio) {
      return res.status(404).json({
        ok: false,
        message: "Servicio no encontrado",
      });
    }

    return res.status(200).json({
      ok: true,
      data: servicio,
    });
  } catch (error) {
    console.error("Error al obtener servicio público:", error);

    return res.status(500).json({
      ok: false,
      message: "Error al obtener el servicio",
      error: error.message,
    });
  }
}

// ============================================================
// OBTENER SERVICIOS DE UN PROFESIONAL
// ============================================================

const getServicesByProfessionalId = async (req, res) => {
  try {
    const profesionalId = Number(req.params.profesionalId);

    console.log("🔎 SERVICIOS DEL PROFESIONAL:", profesionalId);

    const servicios = await service.getServicesByProfessionalId(profesionalId);

    return res.status(200).json({
      ok: true,

      data: servicios,
    });
  } catch (error) {
    console.error("❌ ERROR AL OBTENER SERVICIOS:", error);

    return res.status(500).json({
      ok: false,

      message: "Error al obtener los servicios del profesional",

      error: error.message,
    });
  }
};

module.exports = {
  getServicesById,
  getServicesByProfessionalId,
};
