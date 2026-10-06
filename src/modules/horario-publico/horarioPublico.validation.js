function validarHorarioPublico(req, res, next) {
  const profesionalId = Number(req.params.profesionalId);

  const { fecha, servicioId } = req.query;

  // ============================================
  // PROFESIONAL
  // ============================================

  if (!Number.isInteger(profesionalId) || profesionalId <= 0) {
    return res.status(400).json({
      ok: false,
      message: "profesionalId debe ser un entero positivo",
    });
  }

  // ============================================
  // FECHA
  // ============================================

  if (!fecha) {
    return res.status(400).json({
      ok: false,
      message: "La fecha es obligatoria",
    });
  }

  // ============================================
  // FORMATO FECHA
  // ============================================

  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return res.status(400).json({
      ok: false,
      message: "La fecha debe tener el formato YYYY-MM-DD",
    });
  }

  // ============================================
  // SERVICIO OPCIONAL
  // ============================================

  if (servicioId !== undefined && servicioId !== null && servicioId !== "") {
    const id = Number(servicioId);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        ok: false,
        message: "servicioId debe ser un entero positivo",
      });
    }

    req.query.servicioId = id;
  } else {
    req.query.servicioId = null;
  }

  req.params.profesionalId = profesionalId;

  next();
}

module.exports = {
  validarHorarioPublico,
};
