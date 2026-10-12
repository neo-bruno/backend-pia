function validarRegistrarCalificacion(req, res, next) {
  const { reserva_id, evaluacion_id, puntaje, titulo, observacion } =
    req.body || {};

  const esIdValido = (valor) =>
    valor !== undefined &&
    valor !== null &&
    String(valor).trim() !== "" &&
    Number.isInteger(Number(valor)) &&
    Number(valor) > 0;

  if (!esIdValido(reserva_id)) {
    return res.status(400).json({
      ok: false,
      message: "Debes indicar una reserva válida.",
    });
  }

  if (!esIdValido(evaluacion_id)) {
    return res.status(400).json({
      ok: false,
      message: "Debes indicar una evaluación válida.",
    });
  }

  if (
    puntaje === undefined ||
    puntaje === null ||
    String(puntaje).trim() === "" ||
    !Number.isFinite(Number(puntaje)) ||
    Number(puntaje) < 0 ||
    Number(puntaje) > 5
  ) {
    return res.status(400).json({
      ok: false,
      message: "El puntaje debe estar entre 0 y 5.",
    });
  }

  if (
    titulo !== undefined &&
    titulo !== null &&
    (typeof titulo !== "string" || titulo.length > 200)
  ) {
    return res.status(400).json({
      ok: false,
      message: "El título debe ser texto y no superar 200 caracteres.",
    });
  }

  if (
    observacion !== undefined &&
    observacion !== null &&
    typeof observacion !== "string"
  ) {
    return res.status(400).json({
      ok: false,
      message: "La observación debe ser texto.",
    });
  }

  next();
}

module.exports = {
  validarRegistrarCalificacion,
};
