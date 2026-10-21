const service = require("./negocioAdmin.service");

function obtenerUsuarioId(req) {
	return req.usuario?.usuario_id;
}

// ============================================================
// OBTENER MI NEGOCIO
// ============================================================

async function obtenerMiNegocio(req, res, next) {
	try {
		const data = await service.obtenerMiNegocio(obtenerUsuarioId(req));

		return res.status(200).json({
			ok: true,
			data,
		});
	} catch (error) {
		next(error);
	}
}

// ============================================================
// ACTUALIZAR DATOS GENERALES
// ============================================================

async function actualizarMiNegocio(req, res, next) {
	try {
		const data = await service.actualizarMiNegocio(
			obtenerUsuarioId(req),
			req.body,
		);

		return res.status(200).json({
			ok: true,
			message: "Los datos del negocio se actualizaron correctamente.",
			data,
		});
	} catch (error) {
		next(error);
	}
}

// ============================================================
// ACTUALIZAR PRESENTACIÓN DE LA PÁGINA
// ============================================================

async function actualizarPaginaNegocio(req, res, next) {
	try {
		const data = await service.actualizarPaginaNegocio(
			obtenerUsuarioId(req),
			req.body,
		);

		return res.status(200).json({
			ok: true,
			message: "La presentación de la página se actualizó correctamente.",
			data,
		});
	} catch (error) {
		next(error);
	}
}

// ============================================================
// LISTAR TIPOS DE NEGOCIO
// ============================================================

async function listarTiposNegocio(req, res, next) {
	try {
		const data = await service.listarTiposNegocio();

		return res.status(200).json({
			ok: true,
			data,
		});
	} catch (error) {
		next(error);
	}
}

// ============================================================
// ACTUALIZAR PORTADA Y LOGO
// ============================================================

async function actualizarImagenesNegocio(req, res, next) {
	try {
		const data = await service.actualizarImagenesNegocio(
			obtenerUsuarioId(req),
			req.files || {},
		);

		return res.status(200).json({
			ok: true,
			message: "Las imágenes del negocio se actualizaron correctamente.",
			data,
		});
	} catch (error) {
		next(error);
	}
}

module.exports = {
	obtenerMiNegocio,
	actualizarMiNegocio,
	actualizarPaginaNegocio,
	listarTiposNegocio,
  actualizarImagenesNegocio
};
