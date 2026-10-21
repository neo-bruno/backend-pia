function crearError(mensaje, status = 400) {
	const error = new Error(mensaje);
	error.status = status;
	return error;
}

function validarId(valor, campo = "id") {
	const id = Number(valor);

	if (!Number.isSafeInteger(id) || id <= 0) {
		throw crearError(`El campo ${campo} no es válido.`);
	}

	return id;
}

function validarDatosEspecialidad(body = {}) {
	if (!body || typeof body !== "object" || Array.isArray(body)) {
		throw crearError("Los datos enviados no son válidos.");
	}

	if (typeof body.nombre !== "string" || !body.nombre.trim()) {
		throw crearError("El nombre de la especialidad es obligatorio.");
	}

	const nombre = body.nombre.trim();

	if (nombre.length > 100) {
		throw crearError("El nombre no puede superar 100 caracteres.");
	}

	let icono = null;

	if (body.icono !== undefined && body.icono !== null) {
		if (typeof body.icono !== "string") {
			throw crearError("El icono debe ser texto.");
		}

		icono = body.icono.trim() || null;

		if (icono && icono.length > 100) {
			throw crearError("El icono no puede superar 100 caracteres.");
		}
	}

	return { nombre, icono };
}

function validarEstado(estado) {
	if (!["ACTIVO", "INACTIVO"].includes(estado)) {
		throw crearError("El estado debe ser ACTIVO o INACTIVO.");
	}

	return estado;
}

module.exports = {
	crearError,
	validarId,
	validarDatosEspecialidad,
	validarEstado,
};
