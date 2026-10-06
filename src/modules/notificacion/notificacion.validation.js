// ============================================================
// VALIDACIONES NOTIFICACION
// ============================================================

function validarId(req, res, next) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      ok: false,
      mensaje: "El ID de la notificación no es válido.",
      codigo: "ID_INVALIDO",
    });
  }

  req.notificacionId = id;

  next();
}

module.exports = {
  validarId,
};
