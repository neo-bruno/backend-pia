const service = require("./evaluacion.service");

// ============================================================
// PIA - MÓDULO EVALUACIÓN
// Capa: controller
// ============================================================

// ============================================================
// OBTENER EVALUACIONES
// GET /api/evaluacion
// ============================================================

exports.getEvaluaciones = async (req, res, next) => {
  try {
    const filtros = {
      objetivo: req.query.objetivo,
      estado: req.query.estado,
      buscar: req.query.buscar,
    };

    const evaluaciones = await service.getEvaluaciones(filtros);

    res.status(200).json({
      ok: true,
      data: evaluaciones,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// OBTENER UNA EVALUACIÓN POR ID
// GET /api/evaluacion/:id
// ============================================================

exports.getEvaluacionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const evaluacion = await service.getEvaluacionById(id);

    res.status(200).json({
      ok: true,
      data: evaluacion,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// CREAR UNA EVALUACIÓN
// POST /api/evaluacion
// ============================================================

exports.createEvaluacion = async (req, res, next) => {
  try {
    const { tipo_calificacion_id } = req.body;

    const evaluacion = await service.createEvaluacion(tipo_calificacion_id);

    res.status(201).json({
      ok: true,
      message: "Evaluación creada correctamente",
      data: evaluacion,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// CAMBIAR ESTADO DE UNA EVALUACIÓN
// PATCH /api/evaluacion/:id/estado
// ============================================================

exports.updateEstadoEvaluacion = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const evaluacion = await service.updateEstadoEvaluacion(id, estado);

    res.status(200).json({
      ok: true,
      message: "Estado de la evaluación actualizado correctamente",
      data: evaluacion,
    });
  } catch (error) {
    next(error);
  }
};
