// =====================================================
// agenda.controller.js
// =====================================================

const service = require("./agenda.service");

// =====================================================
// OBTENER AGENDA
// GET /api/agenda?fecha=YYYY-MM-DD
// =====================================================

const getAgenda = async (req, res) => {
  try {
    const profesionalId = req.usuario?.profesional_id;
    const fecha = req.query?.fecha;

    const data = await service.getAgenda(profesionalId, fecha);

    return res.status(200).json({
      ok: true,
      message: "Agenda obtenida correctamente",
      data,
    });
  } catch (error) {
    console.error("Error getAgenda:", error);

    return res.status(error.status || 500).json({
      ok: false,
      message: error.message || "Tu acceso a la agenda está inhabilitado. Comunícate con el administrador del negocio."
    });
  }
};

module.exports = {
  getAgenda,
};
