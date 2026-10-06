// ============================================================
// PIA - MÓDULO RESERVA
// Capa: service
// ============================================================

const repository = require("./reserva.repository");

// ============================================================
// VALIDAR FECHA
// ============================================================

const validarFecha = (fecha) => {
  if (!fecha) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    const error = new Error("La fecha debe tener el formato YYYY-MM-DD");

    error.status = 400;

    throw error;
  }

  return fecha;
};

// ============================================================
// OBTENER RESERVAS
// ============================================================

const getReservations = async (profesionalId, fecha) => {
  if (!profesionalId) {
    const error = new Error("No se pudo determinar el profesional autenticado");

    error.status = 401;

    throw error;
  }

  fecha = validarFecha(fecha);

  return await repository.getReservations(profesionalId, fecha);
};

module.exports = {
  getReservations,
};
