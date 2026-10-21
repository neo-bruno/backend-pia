const repository = require("./historial.repository");
const { validarFiltros } = require("./historial.validation");

// =====================================================
// OBTENER HISTORIAL DEL CLIENTE
// =====================================================

const obtenerHistorialCliente = async (token, query) => {
	if (!token || typeof token !== "string") {
		throw crearError("Debes iniciar sesión para consultar tu historial.", 401);
	}

	const cliente = await repository.getClienteByToken(token);

	if (!cliente) {
		throw crearError("La sesión del cliente no es válida.", 401);
	}

	const filtros = validarFiltros(query);

	return repository.getHistorial({
		...filtros,
		clienteId: cliente.id,
	});
};

// =====================================================
// OBTENER HISTORIAL DEL PROFESIONAL
// =====================================================

const obtenerHistorialProfesional = async (usuarioId, query) => {
	const id = Number(usuarioId);

	if (!Number.isSafeInteger(id) || id <= 0) {
		throw crearError("El usuario autenticado no es válido.", 401);
	}

	const profesional = await repository.getProfesionalByUsuarioId(id);

	if (!profesional) {
		throw crearError("El usuario no tiene un perfil profesional.", 403);
	}

	const filtros = validarFiltros(query);

	return repository.getHistorial({
		...filtros,

		// El profesional se obtiene del usuario autenticado.
		// No se confía en el profesional enviado por el navegador.
		profesionalId: profesional.profesional_id,
	});
};

// =====================================================
// CREAR ERROR CONTROLADO
// =====================================================

const crearError = (mensaje, status = 400) => {
	const error = new Error(mensaje);
	error.status = status;
	return error;
};

module.exports = {
	obtenerHistorialCliente,
	obtenerHistorialProfesional,
};
