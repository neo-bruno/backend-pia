const estadosComprobante = ["PENDIENTE", "ACEPTADO", "RECHAZADO"];

function validarCambioEstadoComprobante(req, res, next) {
  const { estado } = req.body;

  if (!estado) {
    return res.status(400).json({
      ok: false,
      message: "El estado del comprobante es obligatorio",
    });
  }

  if (!estadosComprobante.includes(estado)) {
    return res.status(400).json({
      ok: false,
      message: `Estado de comprobante inválido. Valores permitidos: ${estadosComprobante.join(", ")}`,
    });
  }

  next();
}

module.exports = {
  validarCambioEstadoComprobante,
};