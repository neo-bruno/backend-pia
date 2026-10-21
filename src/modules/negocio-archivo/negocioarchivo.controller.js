const service = require("./negocioarchivo.service");

function obtenerUsuarioId(req) {
	return req.usuario?.usuario_id;
}

// ============================================================
// AGREGAR FOTOS
// ============================================================

async function agregarFotos(req, res, next) {
	try {
		const data = await service.agregarFotos({
			usuarioId: obtenerUsuarioId(req),
			fotos: req.files || [],
		});

		return res.status(201).json({
			ok: true,
			message: "Fotos agregadas correctamente.",
			data,
		});
	} catch (error) {
		next(error);
	}
}

// ============================================================
// AGREGAR VIDEOS
// ============================================================

async function agregarVideos(req, res, next) {
	try {
		const data = await service.agregarVideos({
			usuarioId: obtenerUsuarioId(req),
			videos: req.files || [],
		});

		return res.status(201).json({
			ok: true,
			message: "Videos agregados correctamente.",
			data,
		});
	} catch (error) {
		next(error);
	}
}

// ============================================================
// LISTAR ARCHIVOS
// ============================================================

async function listarArchivos(req, res, next) {
	try {
		const data = await service.listarArchivos(obtenerUsuarioId(req));

		return res.status(200).json({
			ok: true,
			data,
		});
	} catch (error) {
		next(error);
	}
}

// ============================================================
// ESTABLECER FOTO PRINCIPAL
// ============================================================

async function establecerPrincipal(req, res, next) {
	try {
		const data = await service.establecerPrincipal({
			usuarioId: obtenerUsuarioId(req),
			relacionId: req.params.id,
		});

		return res.status(200).json({
			ok: true,
			message: "Foto principal actualizada correctamente.",
			data,
		});
	} catch (error) {
		next(error);
	}
}

// ============================================================
// CAMBIAR ORDEN
// ============================================================

async function cambiarOrden(req, res, next) {
	try {
		const data = await service.cambiarOrden({
			usuarioId: obtenerUsuarioId(req),
			relacionId: req.params.id,
			orden: req.body.orden,
		});

		return res.status(200).json({
			ok: true,
			message: "Orden actualizado correctamente.",
			data,
		});
	} catch (error) {
		next(error);
	}
}

// ============================================================
// ELIMINAR DE LA GALERÍA
// ============================================================

async function eliminarArchivo(req, res, next) {
	try {
		const data = await service.eliminarArchivo({
			usuarioId: obtenerUsuarioId(req),
			relacionId: req.params.id,
		});

		return res.status(200).json({
			ok: true,
			...data,
		});
	} catch (error) {
		next(error);
	}
}

module.exports = {
	agregarFotos,
	agregarVideos,
	listarArchivos,
	establecerPrincipal,
	cambiarOrden,
	eliminarArchivo,
};
