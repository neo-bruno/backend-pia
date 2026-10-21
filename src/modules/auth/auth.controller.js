const service = require("./auth.service");

const login = async (req, res, next) => {
	try {
		const { telefono, password } = req.body;

		const resultado = await service.login(telefono, password);

		res.status(200).json({
			ok: true,
			data: resultado,
		});
	} catch (error) {
		next(error);
	}
};

const cambiarPassword = async (req, res, next) => {
	try {
		// El identificador proviene exclusivamente del JWT verificado.
		const usuarioId = Number(req.usuario?.usuario_id ?? req.usuario?.id);

		if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
			return res.status(401).json({
				ok: false,
				mensaje: "No se pudo identificar al usuario autenticado.",
			});
		}

		const resultado = await service.cambiarPassword(usuarioId, req.body);

		return res.status(200).json({
			ok: true,
			mensaje: "La contraseña se actualizó correctamente.",
			data: resultado,
		});
	} catch (error) {
		return res.status(error.status || 500).json({
			ok: false,
			mensaje: error.message || "No se pudo cambiar la contraseña.",
		});
	}
};

module.exports = {
	login,
	cambiarPassword,
};
