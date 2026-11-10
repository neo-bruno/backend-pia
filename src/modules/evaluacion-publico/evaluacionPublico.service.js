const repository = require("./evaluacionPublico.repository");

function crearError(mensaje, status = 500, codigo = "ERROR") {
	const error = new Error(mensaje);
	error.status = status;
	error.codigo = codigo;
	return error;
}

async function getEvaluacionParaCliente({ token, id, reservaId }) {
	// ----------------------------------------------------------
	// 1. VALIDAR TOKEN
	// ----------------------------------------------------------

	if (!token || typeof token !== "string") {
		throw crearError(
			"Debes iniciar sesión como cliente.",
			401,
			"CLIENTE_NO_AUTENTICADO",
		);
	}

	// ----------------------------------------------------------
	// 2. VALIDAR EVALUACIÓN
	// ----------------------------------------------------------

	const evaluacionId = Number(id);

	if (!Number.isSafeInteger(evaluacionId) || evaluacionId <= 0) {
		throw crearError(
			"El identificador de la evaluación no es válido.",
			400,
			"ID_INVALIDO",
		);
	}

	// ----------------------------------------------------------
	// 3. VALIDAR RESERVA
	// ----------------------------------------------------------

	const reserva = Number(reservaId);

	if (!Number.isSafeInteger(reserva) || reserva <= 0) {
		throw crearError(
			"Debes indicar una reserva válida.",
			400,
			"RESERVA_INVALIDA",
		);
	}

	// ----------------------------------------------------------
	// 4. CONSULTAR EVALUACIÓN DE LA RESERVA
	// ----------------------------------------------------------

	const evaluacion = await repository.getEvaluacionParaCliente(
		token,
		evaluacionId,
		reserva,
	);

	if (!evaluacion) {
		throw crearError(
			"No se encontró una evaluación disponible para esta reserva.",
			404,
			"EVALUACION_NO_ENCONTRADA",
		);
	}

	// ----------------------------------------------------------
	// 5. VALIDAR DISPONIBILIDAD
	// ----------------------------------------------------------

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
