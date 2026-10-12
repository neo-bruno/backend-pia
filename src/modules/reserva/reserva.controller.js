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

// ============================================================
// OBTENER UNA RESERVA POR ID
// ============================================================
const getReservationById = async (req, res, next) => {
  try {
    const profesionalId = req.usuario?.profesional_id;

    const { id } = req.params;

    const reserva = await service.getReservationById(profesionalId, id);

    res.status(200).json({
      ok: true,
      data: reserva,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// CAMBIAR ESTADO DE UNA RESERVA
// ============================================================

const updateReservationStatus = async (req, res, next) => {
  try {
    const profesionalId = req.usuario?.profesional_id;

    const { id } = req.params;
    const { estado } = req.body;

    const reserva = await service.updateReservationStatus(
      profesionalId,
      id,
      estado,
    );

    res.status(200).json({
      ok: true,
      message: "Estado de la reserva actualizado correctamente",
      data: reserva,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getReservations,
  getReservationById,
  updateReservationStatus,
};
