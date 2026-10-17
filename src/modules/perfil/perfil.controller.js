const service = require("./perfil.service");

// =====================================================
// OBTENER PERFIL
// =====================================================

const obtenerPerfil = async (req, res) => {
	try {
		const usuarioId = Number(req.usuario?.usuario_id);

		if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
			return res.status(401).json({
				ok: false,
				mensaje: "No se pudo identificar al usuario autenticado.",
			});
		}

		const data = await service.obtenerPerfil(usuarioId);

		return res.status(200).json({
			ok: true,
			data,
		});
	} catch (error) {
		console.error("Error al obtener perfil:", error);

		return res.status(error.status || 500).json({
			ok: false,
			mensaje: error.message || "Error al obtener el perfil.",
		});
	}
};

// =====================================================
// ACTUALIZAR PERFIL
// =====================================================

const actualizarPerfil = async (req, res) => {
	try {
		const usuarioId = Number(req.usuario?.usuario_id);

		if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
			return res.status(401).json({
				ok: false,
				mensaje: "No se pudo identificar al usuario autenticado.",
			});
		}

		const archivos = req.files || {};
		const foto = archivos.foto?.[0] || null;

		if (
			foto &&
			!["image/jpeg", "image/png", "image/webp"].includes(foto.mimetype)
		) {
			return res.status(400).json({
				ok: false,
				mensaje: "La fotografía debe ser JPG, PNG o WEBP.",
			});
		}

		const data = await service.actualizarPerfil(usuarioId, req.body, { foto });

		return res.status(200).json({
			ok: true,
			mensaje: "Perfil actualizado correctamente.",
			data,
		});
	} catch (error) {
		console.error("Error al actualizar perfil:", error);

		return res.status(error.status || 500).json({
			ok: false,
			mensaje: error.message || "Error al actualizar el perfil.",
		});
	}
};

module.exports = {
	obtenerPerfil,
	actualizarPerfil,
};
