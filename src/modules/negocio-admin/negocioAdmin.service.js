const repository = require("./negocioAdmin.repository");

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

module.exports = {
	obtenerMiNegocio,
	actualizarMiNegocio,
	actualizarPaginaNegocio,
	listarTiposNegocio,
  actualizarImagenesNegocio
};
