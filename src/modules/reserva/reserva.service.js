// ============================================================
// PIA - MÓDULO RESERVA
// Capa: service
// ============================================================

const repository = require("./reserva.repository");
const { emitirNotificacionCliente } = require("../../utils/socket");

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

// ============================================================
// OBTENER UNA RESERVA POR ID
// ============================================================

const getReservationById = async (profesionalId, reservaId) => {
  if (!profesionalId) {
    const error = new Error("No se pudo determinar el profesional autenticado");

    error.status = 401;

    throw error;
  }

  const id = Number(reservaId);

  if (!Number.isInteger(id) || id <= 0) {
    const error = new Error("El ID de la reserva no es válido");

    error.status = 400;

    throw error;
  }

  const reserva = await repository.getReservationById(profesionalId, id);

  if (!reserva) {
    const error = new Error("Reserva no encontrada");

    error.status = 404;

    throw error;
  }

  return reserva;
};

// ============================================================
// CAMBIAR ESTADO DE UNA RESERVA
// ============================================================

const updateReservationStatus = async (profesionalId, reservaId, estado) => {
  if (!profesionalId) {
    const error = new Error("No se pudo determinar el profesional autenticado");

    error.status = 401;

    throw error;
  }

  const id = Number(reservaId);

  if (!Number.isInteger(id) || id <= 0) {
    const error = new Error("El ID de la reserva no es válido");

    error.status = 400;

    throw error;
  }

  const estadosPermitidos = [
    "PENDIENTE",
    "CONFIRMADA",
    "COMPLETADA",
    "CANCELADA",
    "NO_ASISTIO",
  ];

  if (!estado || !estadosPermitidos.includes(estado)) {
    const error = new Error("El estado de la reserva no es válido");

    error.status = 400;

    throw error;
  }

  const resultado = await repository.updateReservationStatus(
    profesionalId,
    id,
    estado,
  );

  if (!resultado?.reserva) {
    const error = new Error("Reserva no encontrada");
    error.status = 404;
    throw error;
  }

  // Socket.IO se ejecuta en la capa service y solo después del COMMIT.
  for (const notificacion of resultado.notificaciones || []) {
    emitirNotificacionCliente(resultado.cliente_id, notificacion);
  }

  return resultado.reserva;
};

module.exports = {
  getReservations,
  getReservationById,
  updateReservationStatus,
};
