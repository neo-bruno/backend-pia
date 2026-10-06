// =====================================================
// VALIDAR RESERVA PUBLICA
// =====================================================

function parseJsonField(valor, nombre) {
  if (valor === undefined || valor === null || valor === "") {
    return null;
  }

  if (typeof valor === "object") {
    return valor;
  }

  try {
    return JSON.parse(valor);
  } catch (error) {
    const err = new Error(`El campo "${nombre}" no contiene un JSON válido.`);

    err.statusCode = 400;
    err.code = "JSON_INVALIDO";

    throw err;
  }
}

// =====================================================
// VALIDAR ESTRUCTURA
// =====================================================

function validateConfirmReservation({ reserva, pago, condicion, comprobante }) {
  if (!reserva) {
    const error = new Error("No se recibió la información de la reserva.");

    error.statusCode = 400;
    error.code = "RESERVA_REQUERIDA";

    throw error;
  }

  if (!Number.isInteger(Number(reserva.cliente_id))) {
    const error = new Error("El cliente de la reserva no es válido.");

    error.statusCode = 400;
    error.code = "CLIENTE_INVALIDO";

    throw error;
  }

  if (!Number.isInteger(Number(reserva.servicio_id))) {
    const error = new Error("El servicio de la reserva no es válido.");

    error.statusCode = 400;
    error.code = "SERVICIO_INVALIDO";

    throw error;
  }

  if (!reserva.fecha) {
    const error = new Error("La fecha de la reserva es obligatoria.");

    error.statusCode = 400;
    error.code = "FECHA_REQUERIDA";

    throw error;
  }

  if (!reserva.hora_inicio || !reserva.hora_fin) {
    const error = new Error("La hora de inicio y fin son obligatorias.");

    error.statusCode = 400;
    error.code = "HORARIO_REQUERIDO";

    throw error;
  }

  if (
    !Array.isArray(reserva.slots_reserva) ||
    reserva.slots_reserva.length === 0
  ) {
    const error = new Error("La reserva debe contener al menos un slot.");

    error.statusCode = 400;
    error.code = "SLOTS_REQUERIDOS";

    throw error;
  }

  // ===================================================
  // PAGO CON ADELANTO
  // ===================================================

  /*
   * OJO:
   *
   * pago y condicion llegan desde el frontend solamente
   * como referencia.
   *
   * El backend volverá a calcular estos valores.
   */

  if (condicion?.requiere_adelanto === true && !comprobante) {
    const error = new Error(
      "Debes adjuntar el comprobante del pago adelantado.",
    );

    error.statusCode = 400;
    error.code = "COMPROBANTE_REQUERIDO";

    throw error;
  }

  if (comprobante) {
    const tiposPermitidos = ["image/jpeg", "image/png", "application/pdf"];

    if (!tiposPermitidos.includes(comprobante.mimetype)) {
      const error = new Error("El comprobante debe ser JPG, PNG o PDF.");

      error.statusCode = 400;
      error.code = "TIPO_COMPROBANTE_INVALIDO";

      throw error;
    }

    if (comprobante.size > 5 * 1024 * 1024) {
      const error = new Error("El comprobante no puede superar los 5 MB.");

      error.statusCode = 400;
      error.code = "COMPROBANTE_MUY_GRANDE";

      throw error;
    }
  }

  return true;
}

// =====================================================
// PARSEAR REQUEST
// =====================================================

function parseConfirmReservationRequest(body) {
  return {
    reserva: parseJsonField(body.reserva, "reserva"),
    pago: parseJsonField(body.pago, "pago"),
    condicion: parseJsonField(body.condicion, "condicion"),
  };
}

module.exports = {
  parseConfirmReservationRequest,
  validateConfirmReservation,
};
