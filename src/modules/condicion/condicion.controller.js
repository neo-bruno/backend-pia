const service = require("./condicion.service");

// ============================================================
// OBTENER CONDICIÓN
// ============================================================

const getConditionById = async (req, res, next) => {
  try {
    const condicionId = Number(req.params.id);

    const condicion = await service.getConditionById(condicionId);

    res.status(200).json({
      ok: true,
      data: condicion,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// CREAR CONDICIÓN
// ============================================================

const createCondition = async (req, res, next) => {
  try {
    const condicion = await service.createCondition(req.body);

    res.status(201).json({
      ok: true,
      message: "Condición creada correctamente",
      data: condicion,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// EDITAR CONDICIÓN
// ============================================================

const updateCondition = async (req, res, next) => {
  try {
    const condicionId = Number(req.params.id);

    const condicion = await service.updateCondition(condicionId, req.body);

    res.status(200).json({
      ok: true,
      message: "Condición actualizada correctamente",
      data: condicion,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getConditionById,
  createCondition,
  updateCondition,
};
