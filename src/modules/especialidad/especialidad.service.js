const repository = require("./especialidad.repository");

const {
	crearError,
	validarId,
	validarDatosEspecialidad,
	validarEstado,
} = require("./especialidad.validation");

async function obtenerNegocio(usuarioId) {
	const idUsuario = validarId(usuarioId, "usuario autenticado");

	const negocio = await repository.getNegocioByUsuarioId(idUsuario);

	if (!negocio) {
		throw crearError(
			"No se encontró un negocio asociado al administrador.",
			404,
		);
	}

	return negocio;
}

async function listar(usuarioId) {
	const negocio = await obtenerNegocio(usuarioId);
	return repository.listar(negocio.id, true);
}

async function crear(usuarioId, body) {
	const negocio = await obtenerNegocio(usuarioId);
	const datos = validarDatosEspecialidad(body);

	try {
		return await repository.crear(negocio.id, datos);
	} catch (error) {
		if (error.code === "23505") {
			throw crearError(
				"Ya existe una especialidad con ese nombre en tu negocio.",
				409,
			);
		}

		throw error;
	}
}

async function actualizar(usuarioId, especialidadId, body) {
	const negocio = await obtenerNegocio(usuarioId);
	const id = validarId(especialidadId, "especialidad");
	const datos = validarDatosEspecialidad(body);

	try {
		const resultado = await repository.actualizar(negocio.id, id, datos);

		if (!resultado) {
			throw crearError("La especialidad no existe en tu negocio.", 404);
		}

		return resultado;
	} catch (error) {
		if (error.code === "23505") {
			throw crearError(
				"Ya existe una especialidad con ese nombre en tu negocio.",
				409,
			);
		}

		throw error;
	}
}

async function cambiarEstado(usuarioId, especialidadId, estado) {
	const negocio = await obtenerNegocio(usuarioId);
	const id = validarId(especialidadId, "especialidad");
	const estadoValidado = validarEstado(estado);

	const resultado = await repository.cambiarEstado(
		negocio.id,
		id,
		estadoValidado,
	);

	if (!resultado) {
		throw crearError("La especialidad no existe en tu negocio.", 404);
	}

	return resultado;
}

async function eliminar(usuarioId, especialidadId) {
	const negocio = await obtenerNegocio(usuarioId);
	const id = validarId(especialidadId, "especialidad");

	const resultado = await repository.eliminar(negocio.id, id);

	if (!resultado) {
		throw crearError("La especialidad no existe en tu negocio.", 404);
	}

	return { id: resultado.id };
}

module.exports = {
	listar,
	crear,
	actualizar,
	cambiarEstado,
	eliminar,
};
