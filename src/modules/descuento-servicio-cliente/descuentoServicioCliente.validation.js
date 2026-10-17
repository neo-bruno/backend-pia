// ============================================================
// CREAR ERROR DE VALIDACION
// ============================================================

const crearError = (mensaje, statusCode = 400) => {
	const error = new Error(mensaje);
	error.statusCode = statusCode;
	return error;
};

// ============================================================
// VALIDAR ID POSITIVO
// ============================================================

const validarId = (valor, nombre = "ID") => {
	const id = Number(valor);

	if (!Number.isSafeInteger(id) || id <= 0) {
		throw crearError(`${nombre} no es válido.`);
	}

	return id;
};

// ============================================================
// VALIDAR CONTEXTO DEL PROFESIONAL
// ============================================================

const validarContexto = ({ negocioId, profesionalId }) => {
	return {
		negocioId: validarId(negocioId, "Negocio"),
		profesionalId: validarId(profesionalId, "Profesional"),
	};
};

// ============================================================
// VALIDAR DESCUENTOS A ASIGNAR
//
// Formato:
// {
//   "descuento_servicio_ids": [1, 2, 3]
// }
// ============================================================

const validarDescuentoServicioIds = (body) => {
	if (!body || typeof body !== "object" || Array.isArray(body)) {
		throw crearError("El cuerpo de la solicitud no es válido.");
	}

	const camposPermitidos = ["descuento_servicio_ids"];

	const camposDesconocidos = Object.keys(body).filter(
		(campo) => !camposPermitidos.includes(campo),
	);

	if (camposDesconocidos.length > 0) {
		throw crearError(`Campos no permitidos: ${camposDesconocidos.join(", ")}`);
	}

	if (!Array.isArray(body.descuento_servicio_ids)) {
		throw crearError("Debes enviar el arreglo descuento_servicio_ids.");
	}

	if (body.descuento_servicio_ids.length === 0) {
		throw crearError("Selecciona al menos un descuento.");
	}

	const ids = body.descuento_servicio_ids.map((id) =>
		validarId(id, "Descuento del servicio"),
	);

	if (new Set(ids).size !== ids.length) {
		throw crearError("No puedes repetir un descuento en la solicitud.");
	}

	return ids;
};

const validarAsignacionId = (valor) => {
  return validarId(valor, "ID de asignación");
};


module.exports = {
	validarId,
	validarContexto,
	validarDescuentoServicioIds,
	validarAsignacionId
};
