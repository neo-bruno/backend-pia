const service = require("./membresia.service");

// ============================================================
// OBTENER MEMBRESÍAS DEL PROFESIONAL
// ============================================================
async function getMisMembresias(req, res) {
	try {
		const profesionalId = req.usuario?.profesional_id;

		if (!profesionalId) {
			return res.status(403).json({
				ok: false,
				message: "La sesión no corresponde a un profesional",
			});
		}

		const membresias =
			await service.getMembresiasByProfesionalId(profesionalId);

		return res.status(200).json({
			ok: true,
			data: membresias,
		});
	} catch (error) {
		console.error("Error al obtener membresías:", error);

		return res.status(500).json({
			ok: false,
			message: "No se pudieron obtener las membresías",
		});
	}
}

// ============================================================
// OBTENER QR OFICIAL DE GERENCIA
// ============================================================
async function getQrGerenciaMembresia(req, res) {
	try {
		const qr = await service.getQrGerenciaMembresia();

		return res.status(200).json({
			ok: true,
			data: qr,
		});
	} catch (error) {
		console.error("Error al obtener QR de membresía:", error);

		return res.status(error.status || 500).json({
			ok: false,
			message: error.status
				? error.message
				: "No se pudo obtener el QR oficial de Gerencia",
		});
	}
}

// ============================================================
// RENOVAR MEMBRESÍA
// No se utiliza al abrir el sheet de pago.
// El envío del comprobante inicia la renovación.
// ============================================================
async function renovarMembresia(req, res) {
	try {
		return res.status(409).json({
			ok: false,
			message: "La renovación se procesa al enviar el comprobante de pago.",
		});
	} catch (error) {
		console.error("Error al renovar membresía:", error);

		return res.status(500).json({
			ok: false,
			message: "No se pudo renovar la membresía",
		});
	}
}

// ============================================================
// ENVIAR COMPROBANTE Y PROCESAR RENOVACIÓN
// req.params.id debe ser el ID de la membresía de origen.
// El servicio crea el nuevo período, pago y comprobante pendiente
// en una única transacción.
// ============================================================
async function enviarComprobanteRenovacion(req, res) {
	try {
		const profesionalId = req.usuario?.profesional_id;

		if (!profesionalId) {
			return res.status(403).json({
				ok: false,
				message: "La sesión no corresponde a un profesional",
			});
		}

		const membresiaOrigenId = Number(req.params.id);

		if (!Number.isInteger(membresiaOrigenId) || membresiaOrigenId <= 0) {
			return res.status(400).json({
				ok: false,
				message: "El identificador de la membresía no es válido",
			});
		}

		if (!req.file) {
			return res.status(400).json({
				ok: false,
				message: "Debes adjuntar el comprobante de pago",
			});
		}

		const resultado = await service.enviarComprobanteRenovacion(
			membresiaOrigenId,
			profesionalId,
			req.file,
		);

		return res.status(201).json({
			ok: true,
			message:
				"Comprobante enviado. La renovación quedó pendiente de validación por el SUPERADMIN.",
			data: resultado,
		});
	} catch (error) {
		console.error(
			"Error al enviar comprobante de renovación:",
			error.response?.data || error,
		);

		return res.status(error.status || 500).json({
			ok: false,
			message: error.status
				? error.message
				: "No se pudo registrar el comprobante de renovación",
		});
	}
}

module.exports = {
	getMisMembresias,
	getQrGerenciaMembresia,
	renovarMembresia,
	enviarComprobanteRenovacion,
};
