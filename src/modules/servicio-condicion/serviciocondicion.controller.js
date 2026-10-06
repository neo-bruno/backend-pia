const service = require("./serviciocondicion.service");

// ============================================================
// LISTAR
// ============================================================

const getConditionsByService = async (req, res, next) => {
  try {
    const profesionalId = req.usuario?.profesional_id;

    const servicioId = req.params.servicioId;

    if (!profesionalId) {
      const error = new Error(
        "El usuario autenticado no está asociado a un profesional",
      );

      error.status = 403;

      throw error;
    }

    const condiciones = await service.getConditionsByService(
      profesionalId,
      servicioId,
    );

    res.status(200).json({
      ok: true,
      data: condiciones,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// CREAR
// ============================================================

const createCondition = async (req, res, next) => {
  try {
    const profesionalId = req.usuario?.profesional_id;

    const servicioId = req.params.servicioId;

    if (!profesionalId) {
      const error = new Error(
        "El usuario autenticado no está asociado a un profesional",
      );

      error.status = 403;

      throw error;
    }

    const resultado = await service.createCondition(
      profesionalId,
      servicioId,
      req.body,
    );

    res.status(201).json({
      ok: true,
      message: "Condición creada correctamente",
      data: resultado,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// OBTENER
// ============================================================

const getConditionById = async (req, res, next) => {
  try {
    const profesionalId = req.usuario?.profesional_id;

    const relacionId = req.params.id;

    if (!profesionalId) {
      const error = new Error(
        "El usuario autenticado no está asociado a un profesional",
      );

      error.status = 403;

      throw error;
    }

    const resultado = await service.getConditionById(profesionalId, relacionId);

    res.status(200).json({
      ok: true,
      data: resultado,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ACTUALIZAR
// ============================================================

const updateCondition = async (req, res, next) => {
  try {
    const profesionalId = req.usuario?.profesional_id;

    const relacionId = req.params.id;

    if (!profesionalId) {
      const error = new Error(
        "El usuario autenticado no está asociado a un profesional",
      );

      error.status = 403;

      throw error;
    }

    const resultado = await service.updateCondition(
      profesionalId,
      relacionId,
      req.body,
    );

    res.status(200).json({
      ok: true,
      message: "Condición actualizada correctamente",
      data: resultado,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// ELIMINAR
// ============================================================

const deleteCondition = async (req, res, next) => {
  try {
    const profesionalId = req.usuario?.profesional_id;

    const relacionId = req.params.id;

    if (!profesionalId) {
      const error = new Error(
        "El usuario autenticado no está asociado a un profesional",
      );

      error.status = 403;

      throw error;
    }

    const resultado = await service.deleteCondition(profesionalId, relacionId);

    res.status(200).json({
      ok: true,
      message: "Condición eliminada correctamente",
      data: resultado,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConditionsByService,
  createCondition,
  getConditionById,
  updateCondition,
  deleteCondition,
};
