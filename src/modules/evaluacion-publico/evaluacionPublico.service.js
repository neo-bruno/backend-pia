const repository = require("./evaluacionPublico.repository");

function crearError(mensaje, status = 500, codigo = "ERROR") {
  const error = new Error(mensaje);
  error.status = status;
  error.codigo = codigo;
  return error;
}

async function getEvaluacionParaCliente({ token, id }) {
  if (!token || typeof token !== "string") {
    throw crearError(
      "Debes iniciar sesión como cliente.",
      401,
      "CLIENTE_NO_AUTENTICADO",
    );
  }

  const evaluacionId = Number(id);

  if (!Number.isInteger(evaluacionId) || evaluacionId <= 0) {
    throw crearError(
      "El identificador de la evaluación no es válido.",
      400,
      "ID_INVALIDO",
    );
  }

  const evaluacion = await repository.getEvaluacionParaCliente(
    token,
    evaluacionId,
  );

  if (!evaluacion) {
    throw crearError(
      "No se encontró una evaluación disponible para este cliente.",
      404,
      "EVALUACION_NO_ENCONTRADA",
    );
  }

  if (
    evaluacion.evaluacion_estado !== "HABILITADO" ||
    evaluacion.tipo_estado !== "ACTIVO"
  ) {
    throw crearError(
      "Esta evaluación ya no está disponible.",
      409,
      "EVALUACION_NO_DISPONIBLE",
    );
  }

  return evaluacion;
}

module.exports = {
  getEvaluacionParaCliente,
};
