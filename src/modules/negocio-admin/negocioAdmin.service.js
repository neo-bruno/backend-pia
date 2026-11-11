const repository = require("./negocioAdmin.repository");
const crypto = require("crypto");
const {
	validarId,
	validarActualizacionNegocio,
	validarPaginaNegocio,
} = require("./negocioAdmin.validation");

function crearError(mensaje, status = 400) {
	const error = new Error(mensaje);
	error.status = status;
	return error;
}

function generarSlug(nombre) {
	return String(nombre || "")
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

async function generarSlugUnico(nombre, negocioId) {
	const slugBase = generarSlug(nombre);

	if (!slugBase) {
		throw new Error("No se pudo generar el slug del negocio.");
	}

	let slug = slugBase;
	let contador = 1;

	while (await repository.existsSlug(slug, negocioId)) {
		contador++;
		slug = `${slugBase}-${contador}`;
	}

	return slug;
}

// ============================================================
// OBTENER MI NEGOCIO
// ============================================================

async function obtenerMiNegocio(usuarioId) {
	const id = validarId(usuarioId, "usuario autenticado");

	const negocio = await repository.getNegocioByUsuarioId(id);

	if (!negocio) {
		throw crearError(
			"No se encontró un negocio asociado al usuario autenticado.",
			404,
		);
	}

	return negocio;
}

// ============================================================
// ACTUALIZAR DATOS GENERALES DEL NEGOCIO
// ============================================================

async function actualizarMiNegocio(usuarioId, body) {
	const id = validarId(usuarioId, "usuario autenticado");

	const negocioActual = await repository.getNegocioByUsuarioId(id);

	if (!negocioActual) {
		throw crearError(
			"No se encontró un negocio asociado al usuario autenticado.",
			404,
		);
	}

	const datos = validarActualizacionNegocio(body);

	const tipoNegocio = await repository.getTipoNegocioById(
		datos.tipo_negocio_id,
	);

	if (!tipoNegocio) {
		throw crearError(
			"El tipo de negocio seleccionado no existe o está inactivo.",
			400,
		);
	}

	const slug = await generarSlugUnico(datos.nombre, negocioActual.id);

	const actualizado = await repository.updateNegocio(negocioActual.id, {
		...datos,
		slug,
	});

	if (!actualizado) {
		throw crearError("No se pudo actualizar el negocio.", 500);
	}

	return actualizado;
}

// ============================================================
// ACTUALIZAR PRESENTACIÓN DE LA PÁGINA PÚBLICA
// ============================================================

async function actualizarPaginaNegocio(usuarioId, body) {
	const id = validarId(usuarioId, "usuario autenticado");

	const negocioActual = await repository.getNegocioByUsuarioId(id);

	if (!negocioActual) {
		throw crearError(
			"No se encontró un negocio asociado al usuario autenticado.",
			404,
		);
	}

	const datos = validarPaginaNegocio(body);

	const actualizado = await repository.updatePaginaNegocio(
		negocioActual.id,
		datos,
	);

	if (!actualizado) {
		throw crearError("No se pudo actualizar la presentación del negocio.", 500);
	}

	return actualizado;
}

// ============================================================
// LISTAR TIPOS DE NEGOCIO
// ============================================================

async function listarTiposNegocio() {
	return repository.getTiposNegocio();
}

// ============================================================
// ACTUALIZAR PORTADA Y LOGO
// ============================================================

async function actualizarImagenesNegocio(usuarioId, archivos = {}) {
	const id = validarId(usuarioId, "usuario autenticado");

	const negocioActual = await repository.getNegocioByUsuarioId(id);

	if (!negocioActual) {
		throw crearError(
			"No se encontró un negocio asociado al usuario autenticado.",
			404,
		);
	}

	const portada = archivos.portada?.[0];
	const logo = archivos.logo?.[0];

	if (!portada && !logo) {
		throw crearError("Selecciona una portada o un logo para subir.");
	}

	for (const archivo of [portada, logo].filter(Boolean)) {
		if (!["image/jpeg", "image/png", "image/webp"].includes(archivo.mimetype)) {
			throw crearError("Solo se permiten imágenes JPG, PNG o WEBP.");
		}
	}

	const datos = {
		portada: portada ? `/uploads/negocios/${portada.filename}` : null,

		logo: logo ? `/uploads/negocios/${logo.filename}` : null,
	};

	const actualizado = await repository.updateImagenesNegocio(
		negocioActual.id,
		datos,
	);

	if (!actualizado) {
		throw crearError("No se pudieron actualizar las imágenes.", 500);
	}

	return actualizado;
}

// ============================================================
// ESTADO AUTOMÁTICO DEL NEGOCIO PARA EL APP BAR
// ============================================================

async function obtenerEstadoHorario(negocioId) {
	const id = validarId(negocioId, "negocio");

	const filas = await repository.getHorariosEstadoByNegocioId(id);

	if (!filas.length) {
		throw crearError("El negocio no tiene horarios configurados.", 404);
	}

	const negocio = {
		id: filas[0].negocio_id,
		nombre: filas[0].negocio_nombre,
	};

	const partes = new Intl.DateTimeFormat("en-US", {
		timeZone: "America/La_Paz",
		weekday: "short",
		hour: "2-digit",
		minute: "2-digit",
		hourCycle: "h23",
	}).formatToParts(new Date());

	const obtenerParte = (tipo) =>
		partes.find((parte) => parte.type === tipo)?.value;

	const dias = {
		Mon: 1,
		Tue: 2,
		Wed: 3,
		Thu: 4,
		Fri: 5,
		Sat: 6,
		Sun: 7,
	};

	const diaActual = dias[obtenerParte("weekday")];
	const horaActual = `${obtenerParte("hour")}:${obtenerParte("minute")}`;

	const minutosActuales =
		Number(obtenerParte("hour")) * 60 + Number(obtenerParte("minute"));

	const horarios = filas
		.filter((fila) => fila.dia_semana !== null)
		.map((fila) => ({
			dia_semana: Number(fila.dia_semana),
			hora_inicio: fila.hora_inicio,
			hora_fin: fila.hora_fin,
		}));

	const convertirMinutos = (hora) => {
		const [horas, minutos] = hora.split(":").map(Number);
		return horas * 60 + minutos;
	};

	const estaAbierto = horarios.some((horario) => {
		const inicio = convertirMinutos(horario.hora_inicio);
		const fin = convertirMinutos(horario.hora_fin);

		if (horario.dia_semana === diaActual) {
			if (inicio < fin) {
				return minutosActuales >= inicio && minutosActuales < fin;
			}

			if (inicio > fin) {
				return minutosActuales >= inicio;
			}
		}

		if (inicio > fin) {
			const diaAnterior = diaActual === 1 ? 7 : diaActual - 1;

			return horario.dia_semana === diaAnterior && minutosActuales < fin;
		}

		return false;
	});

	return {
		negocio_id: negocio.id,
		negocio_nombre: negocio.nombre,
		estado: estaAbierto ? "ABIERTO" : "CERRADO",
		hora_actual: horaActual,
		dia_semana: diaActual,
		zona_horaria: "America/La_Paz",
	};
}

// ============================================================
// GENERAR NUEVO CÓDIGO ÚNICO DE INVITACIÓN
// ============================================================

async function generarNuevoCodigo(usuarioId) {
	const id = validarId(usuarioId, "usuario autenticado");

	// Obtener el negocio del administrador autenticado
	const negocio = await repository.getNegocioByUsuarioId(id);

	if (!negocio) {
		throw crearError(
			"No se encontró un negocio asociado al usuario autenticado.",
			404,
		);
	}

	// Evitamos caracteres que se pueden confundir visualmente:
	// O / 0 e I / 1
	const caracteres = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

	let codigo;
	let intentos = 0;
	const maxIntentos = 20;

	do {
		codigo = "PIA-";

		for (let i = 0; i < 6; i++) {
			codigo += caracteres[crypto.randomInt(0, caracteres.length)];
		}

		intentos++;

		if (intentos >= maxIntentos) {
			throw crearError(
				"No se pudo generar un código único. Intenta nuevamente.",
				500,
			);
		}
	} while (await repository.existsCodigoNegocio(codigo));

	// Actualizar únicamente el código del negocio
	const actualizado = await repository.updateCodigoNegocio(negocio.id, codigo);

	if (!actualizado) {
		throw crearError("No se pudo actualizar el código de invitación.", 500);
	}

	return actualizado;
}

module.exports = {
	obtenerMiNegocio,
	actualizarMiNegocio,
	actualizarPaginaNegocio,
	listarTiposNegocio,
	actualizarImagenesNegocio,
	obtenerEstadoHorario,
	generarNuevoCodigo,
};
