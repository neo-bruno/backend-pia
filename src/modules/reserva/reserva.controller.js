// ============================================================
// PIA - MÓDULO RESERVA
// Capa: controller
// ============================================================

const service = require("./reserva.service");

// ============================================================
// OBTENER RESERVAS
// ============================================================

const getReservations = async (req, res, next) => {
  try {
    const profesionalId = req.usuario?.profesional_id;

    const { fecha } = req.query;

    const reservas = await service.getReservations(profesionalId, fecha);

    res.status(200).json({
      ok: true,
      data: reservas,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReservations,
};
