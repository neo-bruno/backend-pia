const repository = require("./condicion.repository");

const {
  validarCondicion,
  validarCondicionId,
  validarServicioId,
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
const createCondition = async (servicioId, datos) => {
  const servicioIdValidado = validarServicioId(servicioId);
  const condicionValidada = validarCondicion(datos);

  return await repository.createCondition(
    servicioIdValidado,
    condicionValidada
  );
};

// ============================================================
// EDITAR
// ============================================================
const updateCondition = async (servicioId, condicionId, datos) => {
  const servicioIdValidado = validarServicioId(servicioId);
  validarCondicionId(condicionId);

  const condicionValidada = validarCondicion(datos);

  const condicion = await repository.updateCondition(
    servicioIdValidado,
    condicionId,
    condicionValidada
  );
}

module.exports = {
	getConditionById,
	createCondition,
	updateCondition,
};
