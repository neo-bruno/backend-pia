const validarAsignaciones = (req, res, next) => {
  const asignaciones = req.body;

  // Debe ser un arreglo
  if (!Array.isArray(asignaciones)) {
    return res.status(400).json({
      ok: false,
      message: "El cuerpo de la solicitud debe ser un arreglo",
    });
  }

  /*
   * IMPORTANTE:
   * Permitimos [] porque significa:
   * "quitar todas las asignaciones".
   *
   * El service será quien determine si alguna
   * de esas asignaciones puede eliminarse.
   */

  const asignacionesValidas = [];

  for (const asignacion of asignaciones) {
    const horarioId = Number(asignacion?.horario_id);
    const profesionalId = Number(asignacion?.profesional_id);

    if (!Number.isInteger(horarioId) || horarioId <= 0) {
      return res.status(400).json({
        ok: false,
        message: "horario_id inválido",
      });
    }

    if (!Number.isInteger(profesionalId) || profesionalId <= 0) {
      return res.status(400).json({
        ok: false,
        message: "profesional_id inválido",
      });
    }

    asignacionesValidas.push({
      horario_id: horarioId,
      profesional_id: profesionalId,
    });
  }

  // Eliminar duplicados
  const unicas = [];
  const existentes = new Set();

  for (const asignacion of asignacionesValidas) {
    const clave = `${asignacion.horario_id}-${asignacion.profesional_id}`;

    if (!existentes.has(clave)) {
      existentes.add(clave);

      unicas.push(asignacion);
    }
  }

  req.asignacionesHorarios = unicas;

  next();
};

module.exports = {
  validarAsignaciones,
};
