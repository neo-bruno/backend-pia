const service = require("./piaPublico.service");

// =====================================================
// GET /negocios
// =====================================================
const getNegocios = async (req, res) => {
	try {
		const resultado = await service.getNegocios(req.query);

		return res.status(200).json({
			ok: true,
			mensaje: "Negocios obtenidos correctamente",
			...resultado,
		});
	} catch (error) {
		console.error("Error al obtener negocios públicos:", error);

		return res.status(500).json({
			ok: false,
			mensaje: "Error al obtener los negocios públicos",
		});
	}
};

// =====================================================
// GET /servicios
// =====================================================
const getServicios = async (req, res) => {
	try {
		const resultado = await service.getServicios(req.query);

		return res.status(200).json({
			ok: true,
			mensaje: "Servicios obtenidos correctamente",
			...resultado,
		});
	} catch (error) {
		console.error("Error al obtener servicios públicos:", error);

		return res.status(500).json({
			ok: false,
			mensaje: "Error al obtener los servicios públicos",
		});
	}
};

// =====================================================
// GET /servicios/descuentos
// Servicios con descuentos públicos para el banner
// =====================================================
const getServiciosConDescuentoPublico = async (req, res) => {
	try {
		const datos = await service.getServiciosConDescuentoPublico();

		return res.status(200).json({
			ok: true,
			mensaje: "Servicios con descuentos obtenidos correctamente",
			datos,
		});
	} catch (error) {
		console.error("Error al obtener servicios con descuentos públicos:", error);

		return res.status(500).json({
			ok: false,
			mensaje: "Error al obtener los servicios con descuentos públicos",
		});
	}
};

module.exports = {
	getNegocios,
	getServicios,
	getServiciosConDescuentoPublico,
};
