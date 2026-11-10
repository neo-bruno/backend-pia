// ============================================================
// PIA - MÓDULO DASHBOARD
// Capa: controller
// ============================================================

const service = require("./dashboard.service");

const obtenerDashboard = async (req, res, next) => {
	try {
		const profesionalId = req.usuario?.profesional_id;
		const fecha = req.query.fecha;

		const data = await service.obtenerDashboard(profesionalId, fecha);

		return res.status(200).json({
			ok: true,
			data,
		});
	} catch (error) {
		next(error);
	}
};

module.exports = {
	obtenerDashboard,
};
