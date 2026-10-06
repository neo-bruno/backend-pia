function validateVoucherValidation(data) {
  if (!data) {
    throw new Error("Los datos de validación son obligatorios");
  }

  const { estado, observacion } = data;

  if (!estado) {
    throw new Error("El estado de validación es obligatorio");
  }

  if (!["ACEPTADO", "RECHAZADO"].includes(estado)) {
    throw new Error("El estado debe ser ACEPTADO o RECHAZADO");
  }

  if (estado === "RECHAZADO" && (!observacion || !observacion.trim())) {
    throw new Error(
      "Debe indicar una observación para rechazar el comprobante",
    );
  }

  return {
    estado,
    observacion: observacion?.trim() || null,
  };
}

module.exports = {
  validateVoucherValidation,
};
