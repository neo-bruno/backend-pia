const service = require("./tipocalificacion.service");

// ============================================
// LISTAR TIPOS DE CALIFICACIÓN
// GET /api/tipo-calificacion
// ============================================
exports.getTiposCalificacion = async (req, res, next) => {
  try {
    const filtros = {
      objetivo: req.query.objetivo,
      estado: req.query.estado,
      buscar: req.query.buscar,
    };

    const tipos = await service.getTiposCalificacion(filtros);

    res.status(200).json({
      ok: true,
      data: tipos,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// OBTENER TIPO POR ID
// GET /api/tipo-calificacion/:id
// ============================================
exports.getTipoCalificacionById = async (req, res, next) => {
  try {
    const tipo = await service.getTipoCalificacionById(req.params.id);

    res.status(200).json({
      ok: true,
      data: tipo,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// CREAR TIPO DE CALIFICACIÓN
// POST /api/tipo-calificacion
// ============================================
exports.createTipoCalificacion = async (req, res, next) => {
  try {
    const tipo = await service.createTipoCalificacion(req.body);

    res.status(201).json({
      ok: true,
      message: "Tipo de calificación creado correctamente",
      data: tipo,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// EDITAR TIPO DE CALIFICACIÓN
// PUT /api/tipo-calificacion/:id
// ============================================
exports.updateTipoCalificacion = async (req, res, next) => {
  try {
    const tipo = await service.updateTipoCalificacion(req.params.id, req.body);

    res.status(200).json({
      ok: true,
      message: "Tipo de calificación actualizado correctamente",
      data: tipo,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================
// CAMBIAR ESTADO
// PATCH /api/tipo-calificacion/:id/estado
// ============================================
exports.updateEstadoTipoCalificacion = async (req, res, next) => {
  try {
    const { estado } = req.body;

    const tipo = await service.updateEstadoTipoCalificacion(
      req.params.id,
      estado,
    );

    res.status(200).json({
      ok: true,
      message: "Estado del tipo de calificación actualizado correctamente",
      data: tipo,
    });
  } catch (error) {
    next(error);
  }
};
