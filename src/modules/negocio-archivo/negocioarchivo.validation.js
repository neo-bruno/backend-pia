const MIME_FOTOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"];

const MIME_VIDEOS_PERMITIDOS = ["video/mp4", "video/webm", "video/quicktime"];

const MAX_FOTOS_POR_NEGOCIO = 5;
const MAX_VIDEOS_POR_NEGOCIO = 2;

function crearError(mensaje, status = 400) {
	const error = new Error(mensaje);
	error.status = status;
	return error;
}

function validarId(id, nombre = "ID") {
	const valor = Number(id);

	if (!Number.isSafeInteger(valor) || valor <= 0) {
		throw crearError(`${nombre} no es válido.`);
	}

	return valor;
}

function validarOrden(orden) {
	const valor = Number(orden);

	if (!Number.isSafeInteger(valor) || valor <= 0) {
		throw crearError("El orden debe ser un número entero mayor que cero.");
	}

	return valor;
}

function validarArchivos(archivos, tipo) {
	if (!Array.isArray(archivos) || archivos.length === 0) {
		throw crearError(`Debe seleccionar al menos un archivo de tipo ${tipo}.`);
	}

	const permitidos =
		tipo === "FOTO" ? MIME_FOTOS_PERMITIDOS : MIME_VIDEOS_PERMITIDOS;

	for (const archivo of archivos) {
		if (!permitidos.includes(archivo.mimetype)) {
			throw crearError(
				`El archivo "${archivo.originalname}" no es válido para ${tipo}.`,
			);
		}

		if (archivo.size > 20 * 1024 * 1024) {
			throw crearError(
				`El archivo "${archivo.originalname}" supera el límite de 20 MB.`,
			);
		}
	}

	return true;
}

function validarFotos(fotos) {
	return validarArchivos(fotos, "FOTO");
}

function validarVideos(videos) {
	return validarArchivos(videos, "VIDEO");
}

module.exports = {
	MIME_FOTOS_PERMITIDOS,
	MIME_VIDEOS_PERMITIDOS,
	MAX_FOTOS_POR_NEGOCIO,
	MAX_VIDEOS_POR_NEGOCIO,
	validarId,
	validarOrden,
	validarFotos,
	validarVideos,
};
