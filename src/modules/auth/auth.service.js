const repository = require("./auth.repository");

const { comparePassword } = require("../../utils/password");

const { generarToken } = require("../../utils/jwt");

const login = async (telefono, password) => {
	const usuario = await repository.buscarUsuarioPorTelefono(telefono);

	if (!usuario) {
		const error = new Error("Credenciales inválidas");
		error.status = 401;
		throw error;
	}

	if (usuario.usuario_estado !== "HABILITADO") {
		const error = new Error("El usuario se encuentra deshabilitado");
		error.status = 403;
		throw error;
	}

	const passwordCorrecta = await comparePassword(password, usuario.password);

	if (!passwordCorrecta) {
		const error = new Error("Credenciales inválidas");
		error.status = 401;
		throw error;
	}

	// =====================================================
	// CONTEXTO DEL PROFESIONAL
	// =====================================================

	const puedeConfigurarNegocio =
		usuario.acceso === "ACEPTADO" &&
		usuario.profesional_negocio_estado === "HABILITADO";

	// =====================================================
	// PAYLOAD DEL TOKEN
	// =====================================================

	const payload = {
		// Usuario
		usuario_id: usuario.usuario_id,
		persona_id: usuario.persona_id,

		// Profesional
		profesional_id: usuario.profesional_id,
		profesional_estado: usuario.profesional_estado,
		profesional_estado_funciones: usuario.profesional_estado_funciones,

		// Relación profesional - negocio
		negocio_id: usuario.negocio_id,
		profesional_negocio_estado: usuario.profesional_negocio_estado,
		acceso: usuario.acceso,

		// Permisos
		puede_configurar_negocio: puedeConfigurarNegocio,

		// Rol
		rol_id: usuario.rol_id,
		rol: usuario.rol_nombre,
	};

	const token = generarToken(payload);

	return {
		token,

		usuario: {
			// Usuario
			id: usuario.usuario_id,
			persona_id: usuario.persona_id,

			// Profesional
			profesional_id: usuario.profesional_id,
			profesional_estado: usuario.profesional_estado,
			profesional_estado_funciones: usuario.profesional_estado_funciones,

			// Relación con negocio
			negocio_id: usuario.negocio_id,
			profesional_negocio_estado: usuario.profesional_negocio_estado,
			acceso: usuario.acceso,

			// Permiso
			puede_configurar_negocio: puedeConfigurarNegocio,

			// Datos básicos
			nombre: usuario.persona_nombre,
			telefono: usuario.telefono,

			// Rol
			rol_id: usuario.rol_id,
			rol: usuario.rol_nombre,
		},
	};
};

const cambiarPassword = async (usuarioId, datos) => {
	const actual = datos?.passwordActual;
	const nueva = datos?.passwordNueva;
	const confirmacion = datos?.confirmarPassword;

	if (
		typeof actual !== "string" ||
		typeof nueva !== "string" ||
		typeof confirmacion !== "string" ||
		!actual ||
		!nueva ||
		!confirmacion
	) {
		const error = new Error("Completa los tres campos de contraseña.");
		error.status = 400;
		throw error;
	}

	if (nueva.length < 6) {
		const error = new Error(
			"La nueva contraseña debe tener al menos 6 caracteres.",
		);
		error.status = 400;
		throw error;
	}

	if (nueva.length > 72) {
		const error = new Error(
			"La nueva contraseña no puede superar los 72 caracteres.",
		);
		error.status = 400;
		throw error;
	}

	if (nueva !== confirmacion) {
		const error = new Error(
			"La nueva contraseña y su confirmación no coinciden.",
		);
		error.status = 400;
		throw error;
	}

	if (actual === nueva) {
		const error = new Error(
			"La nueva contraseña debe ser diferente de la actual.",
		);
		error.status = 400;
		throw error;
	}

	const usuario = await repository.buscarPasswordPorUsuarioId(usuarioId);

	if (!usuario || usuario.estado !== "HABILITADO") {
		const error = new Error("La cuenta no existe o está deshabilitada.");
		error.status = 403;
		throw error;
	}

	const passwordCorrecta = await comparePassword(actual, usuario.password);

	if (!passwordCorrecta) {
		const error = new Error("La contraseña actual es incorrecta.");
		error.status = 400;
		throw error;
	}

	const { hashPassword } = require("../../utils/password");
	const passwordHash = await hashPassword(nueva);

	const actualizado = await repository.actualizarPassword(
		usuarioId,
		passwordHash,
	);

	if (!actualizado) {
		const error = new Error(
			"No se pudo actualizar la contraseña de la cuenta.",
		);
		error.status = 400;
		throw error;
	}

	return { actualizado: true };
};

module.exports = {
	login,
	cambiarPassword,
};
