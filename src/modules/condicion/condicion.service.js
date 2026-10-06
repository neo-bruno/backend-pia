const repository = require("./condicion.repository");

const {
  validarCondicion,
  validarCondicionId,
} = require("./condicion.validation");

// ============================================================
// OBTENER
// ============================================================

const getConditionById = async (condicionId) => {
  validarCondicionId(condicionId);

  const condicion = await repository.getConditionById(condicionId);

  if (!condicion) {
    const error = new Error("La condición no existe");
    error.status = 404;
    throw error;
  }

  return condicion;
};

// ============================================================
// CREAR
// ============================================================

const createCondition = async (datos) => {
  const condicionValidada = validarCondicion(datos);

  return await repository.createCondition(condicionValidada);
};

// ============================================================
// EDITAR
// ============================================================

const updateCondition = async (condicionId, datos) => {
  validarCondicionId(condicionId);

  const condicionValidada = validarCondicion(datos);

  const condicion = await repository.updateCondition(
    condicionId,
    condicionValidada,
  );

  if (!condicion) {
    const error = new Error("La condición no existe");
    error.status = 404;
    throw error;
  }

  return condicion;
};

module.exports = {
  getConditionById,
  createCondition,
  updateCondition,
};
