const service = require("./horarioprofesional.service");

// =====================================================
// GUARDAR ASIGNACIONES
// =====================================================
const saveProfessionalHours = async (req, res) => {
  try {
    const profesionalId = req.usuario?.profesional_id;

    if (!profesionalId) {
      return res.status(401).json({
        ok: false,
        message: "El usuario no tiene un profesional asociado",
      });
    }

    const asignaciones = req.asignacionesHorarios;

    const data = await service.saveProfessionalHours(
      profesionalId,
      asignaciones,
    );

    return res.status(200).json({
      ok: true,

      message: "Horarios de profesionales guardados correctamente",

      data,
    });
  } catch (error) {
    console.error("Error saveProfessionalHours:", error);

    return res.status(error.status || 500).json({
      ok: false,

      message:
        error.message || "Error al guardar los horarios de los profesionales",

      ...(error.detalle && {
        detalle: error.detalle,
      }),
    });
  }
};

// =====================================================
// OBTENER ASIGNACIONES
// =====================================================
const getProfessionalHours = async (req, res) => {
  try {
    const profesionalId = req.usuario?.profesional_id;

    if (!profesionalId) {
      return res.status(401).json({
        ok: false,
        message: "El usuario no tiene un profesional asociado",
      });
    }

    const data = await service.getProfessionalHours(profesionalId);

    return res.status(200).json({
      ok: true,
      message: "Asignaciones obtenidas correctamente",
      data,
    });
  } catch (error) {
    console.error("Error getProfessionalHours:", error);

    return res.status(error.status || 500).json({
      ok: false,
      message: error.message || "Error al obtener las asignaciones",
    });
  }
};

// AQUÍ CONSERVAS TU saveProfessionalHours ACTUAL
module.exports = {
  getProfessionalHours,
  saveProfessionalHours,
};
