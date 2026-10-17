const repository = require("./perfil.repository");

// =====================================================
// OBTENER PERFIL
// =====================================================

const obtenerPerfil = async (usuarioId) => {
	const id = Number(usuarioId);

	if (!Number.isInteger(id) || id <= 0) {
		const error = new Error("El usuario no es válido.");
		error.status = 400;
		throw error;
	}

	const perfil = await repository.getPerfilByUsuarioId(id);

	if (!perfil) {
		const error = new Error("No se encontró el perfil del usuario.");
		error.status = 404;
		throw error;
	}

	return perfil;
};

// =====================================================
// ACTUALIZAR PERFIL
// =====================================================

const actualizarPerfil = async (usuarioId, datos, archivos = {}) => {
	const id = Number(usuarioId);

	if (!Number.isInteger(id) || id <= 0) {
		const error = new Error("El usuario no es válido.");
		error.status = 400;
		throw error;
	}

	if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
		const error = new Error("Los datos del perfil no son válidos.");
		error.status = 400;
		throw error;
	}

	const nombre = String(datos.nombre ?? "").trim();
	const telefono = String(datos.telefono ?? "").trim();

	if (!nombre) {
		const error = new Error("El nombre es obligatorio.");
		error.status = 400;
		throw error;
	}

	if (!telefono) {
		const error = new Error("El teléfono es obligatorio.");
		error.status = 400;
		throw error;
	}

	if (nombre.length > 150) {
		const error = new Error("El nombre es demasiado largo.");
		error.status = 400;
		throw error;
	}

	if (telefono.length > 30) {
		const error = new Error("El teléfono es demasiado largo.");
		error.status = 400;
		throw error;
	}

	const validarFecha = (fecha, campo) => {
		if (fecha === null) return;

		if (typeof fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
			const error = new Error(
				`El campo ${campo} debe tener el formato YYYY-MM-DD.`,
			);
			error.status = 400;
			throw error;
		}

		const [anio, mes, dia] = fecha.split("-").map(Number);
		const comprobada = new Date(Date.UTC(anio, mes - 1, dia));

		if (
			comprobada.getUTCFullYear() !== anio ||
			comprobada.getUTCMonth() !== mes - 1 ||
			comprobada.getUTCDate() !== dia
		) {
			const error = new Error(`La fecha de ${campo} no es válida.`);
			error.status = 400;
			throw error;
		}
	};

	const fechaNacimiento = datos.fecha_nacimiento || null;
	const fechaTrabajo = datos.fecha_trabajo || null;

	validarFecha(fechaNacimiento, "fecha_nacimiento");
	validarFecha(fechaTrabajo, "fecha_trabajo");

	const datosActualizacion = {
		nombre,
		telefono,
		sexo: datos.sexo ? String(datos.sexo).trim() : null,
		fecha_nacimiento: fechaNacimiento,
		fecha_trabajo: fechaTrabajo,
		descripcion:
			datos.descripcion == null ? null : String(datos.descripcion).trim(),
		lema: datos.lema == null ? null : String(datos.lema).trim(),
		foto: archivos.foto || null,
	};

	const perfilActualizado = await repository.actualizarPerfil(
		id,
		datosActualizacion,
	);

	if (!perfilActualizado) {
		const error = new Error("No se pudo actualizar el perfil.");
		error.status = 404;
		throw error;
	}

	return perfilActualizado;
};

module.exports = {
	obtenerPerfil,
	actualizarPerfil,
};
