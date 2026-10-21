const fs = require("fs/promises");
const path = require("path");

const repository = require("./negocioarchivo.repository");
const {
	validarId,
	validarFotos,
	validarVideos,
	validarOrden,
	MAX_FOTOS_POR_NEGOCIO,
	MAX_VIDEOS_POR_NEGOCIO,
} = require("./negocioarchivo.validation");

function crearError(mensaje, status = 400) {
	const error = new Error(mensaje);
	error.status = status;
	return error;
}

// ============================================================
// ELIMINAR ARCHIVOS FÍSICOS SI FALLA UNA SUBIDA
// ============================================================

async function eliminarArchivosFisicos(archivos = []) {
	for (const archivo of archivos) {
		if (!archivo?.path) continue;

		try {
			await fs.unlink(archivo.path);
		} catch (error) {
			if (error.code !== "ENOENT") {
				console.error(
					"No se pudo eliminar el archivo físico:",
					archivo.path,
					error,
				);
			}
		}
	}
}

// ============================================================
// OBTENER NEGOCIO DEL ADMINISTRADOR
// ============================================================

async function obtenerNegocio(usuarioId) {
	const id = validarId(usuarioId, "El usuario autenticado");
	const negocio = await repository.getNegocioByUsuarioId(id);

	if (!negocio) {
		throw crearError(
			"No se encontró un negocio asociado al administrador.",
			404,
		);
	}

	return negocio;
}

// ============================================================
// AGREGAR FOTOS
// ============================================================

async function agregarFotos({ usuarioId, fotos }) {
	const negocio = await obtenerNegocio(usuarioId);

	validarFotos(fotos);

	const cantidadActual = await repository.countFilesByType(negocio.id, "FOTO");

	if (cantidadActual + fotos.length > MAX_FOTOS_POR_NEGOCIO) {
		throw crearError(
			`Puedes tener un máximo de ${MAX_FOTOS_POR_NEGOCIO} fotos. Actualmente tienes ${cantidadActual}.`,
		);
	}

	let orden = await repository.getLastOrder(negocio.id, "FOTO");

	const archivosSubidos = [];

	try {
		await repository.transaction(async (client) => {
			const yaTienePrincipal = cantidadActual > 0;

			for (let i = 0; i < fotos.length; i++) {
				const foto = fotos[i];
				orden++;

				const archivo = await repository.createFile(client, foto);

				await repository.createBusinessFile(
					client,
					negocio.id,
					archivo.id,
					"FOTO",
					orden,
					!yaTienePrincipal && i === 0,
				);

				archivosSubidos.push(foto);
			}
		});

		return repository.getFilesByBusiness(negocio.id);
	} catch (error) {
		await eliminarArchivosFisicos(
			archivosSubidos.length ? archivosSubidos : fotos,
		);
		throw error;
	}
}

// ============================================================
// AGREGAR VIDEOS
// ============================================================

async function agregarVideos({ usuarioId, videos }) {
	const negocio = await obtenerNegocio(usuarioId);

	validarVideos(videos);

	const cantidadActual = await repository.countFilesByType(negocio.id, "VIDEO");

	if (cantidadActual + videos.length > MAX_VIDEOS_POR_NEGOCIO) {
		throw crearError(
			`Puedes tener un máximo de ${MAX_VIDEOS_POR_NEGOCIO} videos. Actualmente tienes ${cantidadActual}.`,
		);
	}

	let orden = await repository.getLastOrder(negocio.id, "VIDEO");

	const archivosSubidos = [];

	try {
		await repository.transaction(async (client) => {
			for (const video of videos) {
				orden++;

				const archivo = await repository.createFile(client, video);

				await repository.createBusinessFile(
					client,
					negocio.id,
					archivo.id,
					"VIDEO",
					orden,
					false,
				);

				archivosSubidos.push(video);
			}
		});

		return repository.getFilesByBusiness(negocio.id);
	} catch (error) {
		await eliminarArchivosFisicos(
			archivosSubidos.length ? archivosSubidos : videos,
		);
		throw error;
	}
}

// ============================================================
// LISTAR GALERÍA
// ============================================================

async function listarArchivos(usuarioId) {
	const negocio = await obtenerNegocio(usuarioId);
	return repository.getFilesByBusiness(negocio.id);
}

// ============================================================
// ESTABLECER FOTO PRINCIPAL
// ============================================================

async function establecerPrincipal({ usuarioId, relacionId }) {
	const negocio = await obtenerNegocio(usuarioId);
	const id = validarId(relacionId, "El archivo");

	const archivo = await repository.getBusinessFile(negocio.id, id);

	if (!archivo) {
		throw crearError("La foto no pertenece a tu negocio.", 404);
	}

	if (archivo.tipo !== "FOTO") {
		throw crearError("Solamente una foto puede ser principal.");
	}

	const resultado = await repository.setPrincipal(negocio.id, id);

	if (!resultado) {
		throw crearError("No se pudo establecer la foto principal.", 400);
	}

	return repository.getFilesByBusiness(negocio.id);
}

// ============================================================
// CAMBIAR ORDEN
// ============================================================

async function cambiarOrden({ usuarioId, relacionId, orden }) {
	const negocio = await obtenerNegocio(usuarioId);
	const id = validarId(relacionId, "El archivo");
	const nuevoOrden = validarOrden(orden);

	const archivo = await repository.getBusinessFile(negocio.id, id);

	if (!archivo) {
		throw crearError("El archivo no pertenece a tu negocio.", 404);
	}

	const actualizado = await repository.updateOrder(negocio.id, id, nuevoOrden);

	if (!actualizado) {
		throw crearError("No se pudo actualizar el orden.", 400);
	}

	return repository.getFilesByBusiness(negocio.id);
}

// ============================================================
// ELIMINAR ARCHIVO DE LA GALERÍA
// ============================================================

async function eliminarArchivo({ usuarioId, relacionId }) {
	const negocio = await obtenerNegocio(usuarioId);
	const id = validarId(relacionId, "El archivo");

	const archivo = await repository.getBusinessFile(negocio.id, id);

	if (!archivo) {
		throw crearError("El archivo no pertenece a tu negocio.", 404);
	}

	// Por ahora eliminamos la relación de la galería.
	// No borramos el archivo físico ni el registro compartido
	// de archivo hasta verificar todas sus referencias.
	await repository.deleteBusinessFile(negocio.id, id);

	return {
		mensaje: "El archivo se quitó de la galería del negocio.",
	};
}

module.exports = {
	agregarFotos,
	agregarVideos,
	listarArchivos,
	establecerPrincipal,
	cambiarOrden,
	eliminarArchivo,
};
