const service = require("./descuentoCliente.service");

const getMisDescuentos = async (req, res) => {
	try {
		const token = req.headers["x-cliente-token"];

		const resultado = await service.getMisDescuentos(token);

		return res.status(200).json({
			ok: true,
			data: resultado,
		});
	} catch (error) {
		console.error("Error al obtener descuentos del cliente:", error);

		return res.status(error.status || 500).json({
			ok: false,
			mensaje: error.message || "Error al obtener los descuentos",
		});
	}
};

const getDescuentosDelProfesional = async (req, res) => {
	try {
		const token = req.headers["x-cliente-token"];
		const { profesionalId } = req.params;

		const resultado = await service.getDescuentosDelProfesional(
			token,
			profesionalId,
		);

		return res.status(200).json({
			ok: true,
			data: resultado,
		});
	} catch (error) {
		console.error("Error al obtener descuentos del profesional:", error);

		return res.status(error.status || 500).json({
			ok: false,
			mensaje:
				error.message || "Error al obtener los descuentos del profesional",
		});
	}
};

// =====================================================
// VERIFICAR DESCUENTOS DISPONIBLES PARA UN SERVICIO
// =====================================================

const verificarDescuentosPorServicio = async (req, res) => {
	try {
		const token = req.headers["x-cliente-token"];
		const { servicioId } = req.params;

		const resultado = await service.verificarDescuentosPorServicio(
			token,
			servicioId,
		);

		return res.status(200).json({
			ok: true,
			data: resultado,
		});
	} catch (error) {
		console.error("Error al verificar descuentos del servicio:", error);

		return res.status(error.status || 500).json({
			ok: false,
			mensaje: error.message || "Error al verificar descuentos del servicio",
		});
	}
};

const validarCodigoDescuento = async (req, res) => {
	try {
		const token = req.headers["x-cliente-token"];
		const { codigo, servicio_id } = req.body;

		const resultado = await service.validarCodigoDescuento(
			token,
			codigo,
			servicio_id,
		);

		return res.status(200).json({
			ok: true,
			data: resultado,
		});
	} catch (error) {
		console.error("Error al validar código de descuento:", error);

		return res.status(error.status || 500).json({
			ok: false,
			mensaje: error.message || "No se pudo validar el código de descuento.",
		});
	}
};

module.exports = {
	getMisDescuentos,
	getDescuentosDelProfesional,
	verificarDescuentosPorServicio,
  validarCodigoDescuento,
};
