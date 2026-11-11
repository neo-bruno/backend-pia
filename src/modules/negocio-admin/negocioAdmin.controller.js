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

// ============================================================
// ESTADO DEL HORARIO PARA EL APP BAR
// ============================================================

const obtenerEstadoHorario = async (req, res, next) => {
	try {
		const negocioId = req.usuario?.negocio_id;

		if (!negocioId) {
			return res.status(400).json({
				ok: false,
				message: "No se encontró un negocio asociado a la sesión.",
			});
		}

		const resultado = await service.obtenerEstadoHorario(negocioId);

		return res.status(200).json({
			ok: true,
			data: resultado,
		});
	} catch (error) {
		next(error);
	}
};

// ============================================================
// GENERAR NUEVO CÓDIGO DE INVITACIÓN DEL NEGOCIO
// ============================================================

async function generarNuevoCodigo(req, res, next) {
	try {
		const data = await service.generarNuevoCodigo(obtenerUsuarioId(req));

		return res.status(200).json({
			ok: true,
			message: "El código de invitación se generó correctamente.",
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
	actualizarImagenesNegocio,
	obtenerEstadoHorario,
	generarNuevoCodigo
};
