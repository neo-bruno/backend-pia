const service = require("./historial.service");

const obtenerHistorialCliente = async (req, res, next) => {
	try {
		const token = req.headers["x-cliente-token"];

		const resultado = await service.obtenerHistorialCliente(token, req.query);

		return res.status(200).json({
			ok: true,
			data: resultado,
		});
	} catch (error) {
		next(error);
	}
};

const obtenerHistorialProfesional = async (req, res, next) => {
	try {
		const usuarioId =
			req.user?.usuario_id ??
			req.user?.id ??
			req.usuario?.usuario_id ??
			req.usuario?.id;

		const resultado = await service.obtenerHistorialProfesional(
			usuarioId,
			req.query,
		);

		return res.status(200).json({
			ok: true,
			data: resultado,
		});
	} catch (error) {
		next(error);
	}
};

module.exports = {
	obtenerHistorialCliente,
	obtenerHistorialProfesional,
};
