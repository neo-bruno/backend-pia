function crearError(mensaje, status = 400) {
	const error = new Error(mensaje);
	error.status = status;
	return error;
}

function validarId(valor, campo) {
	const id = Number(valor);

	if (!Number.isSafeInteger(id) || id <= 0) {
		throw crearError(`El campo ${campo} no es válido.`);
	}

	return id;
}

function validarTexto(valor, campo, maximo, obligatorio = false) {
	if (valor === undefined || valor === null) {
		if (obligatorio) {
			throw crearError(`El campo ${campo} es obligatorio.`);
		}

		return null;
	}

	if (typeof valor !== "string") {
		throw crearError(`El campo ${campo} debe ser texto.`);
	}

	const texto = valor.trim();

	if (obligatorio && !texto) {
		throw crearError(`El campo ${campo} es obligatorio.`);
	}

	if (texto.length > maximo) {
		throw crearError(
			`El campo ${campo} no puede superar ${maximo} caracteres.`,
		);
	}

	return texto || null;
}

function validarCoordenada(valor, campo, minimo, maximo) {
	if (valor === undefined || valor === null || valor === "") {
		return null;
	}

	const numero = Number(valor);

	if (!Number.isFinite(numero) || numero < minimo || numero > maximo) {
		throw crearError(`El campo ${campo} no contiene una coordenada válida.`);
	}

	return numero;
}

function validarActualizacionNegocio(body = {}) {
	if (!body || typeof body !== "object" || Array.isArray(body)) {
		throw crearError("Los datos enviados no son válidos.");
	}

	const datos = {
		tipo_negocio_id: validarId(body.tipo_negocio_id, "tipo_negocio_id"),

		nombre: validarTexto(body.nombre, "nombre", 150, true),
		descripcion: validarTexto(body.descripcion, "descripcion", 500),
		telefono: validarTexto(body.telefono, "telefono", 30),
		departamento: validarTexto(body.departamento, "departamento", 150, true),
		municipio: validarTexto(body.municipio, "municipio", 150),
		zona: validarTexto(body.zona, "zona", 150),
		direccion: validarTexto(body.direccion, "direccion", 500),
		latitud: validarCoordenada(body.latitud, "latitud", -90, 90),
		longitud: validarCoordenada(body.longitud, "longitud", -180, 180),
	};

	if (datos.telefono && !/^[0-9+\s()-]{7,30}$/.test(datos.telefono)) {
		throw crearError("El teléfono no tiene un formato válido.");
	}

	return datos;
}

// Datos de presentación de la página pública
function validarPaginaNegocio(body = {}) {
	if (!body || typeof body !== "object" || Array.isArray(body)) {
		throw crearError("Los datos de la página no son válidos.");
	}

	return {
		eslogan: validarTexto(body.eslogan, "eslogan", 250),
		informacion: validarTexto(body.informacion, "informacion", 5000),
		recomendacion: validarTexto(body.recomendacion, "recomendacion", 250),
	};
}

module.exports = {
	validarId,
	validarActualizacionNegocio,
	validarPaginaNegocio,
};
