// =====================================================
// reservaPublico.controller.js
// =====================================================

const service = require("./reservaPublico.service");

const validation = require("./reservaPublico.validation");

// =====================================================
// CONFIRMAR RESERVA
// =====================================================

const confirmReservation = async (req, res) => {
	try {
		// =================================================
		// TOKEN CLIENTE
		// =================================================
		const authorization = req.headers.authorization || "";

		let token = null;

		if (authorization.startsWith("Bearer ")) {
			token = authorization.substring(7);
		}

		/*
		 * También soportamos eventualmente:
		 *
		 * x-cliente-token
		 */

		if (!token) {
			token = req.headers["x-cliente-token"] || null;
		}

		console.log("🔑 TOKEN EXTRAÍDO:", token ? "EXISTE" : "NO EXISTE");

		// =================================================
		// PARSEAR DATOS
		// =================================================
		const datos = validation.parseConfirmReservationRequest(req.body);

		// =================================================
		// VALIDAR
		// =================================================
		validation.validateConfirmReservation({
			...datos,
			comprobante: req.file || null,
		});

		// =================================================
		// SERVICE
		// =================================================
		const resultado = await service.confirmReservation({
			...datos,
			comprobante: req.file || null,
			token,
		});

		// =================================================
		// RESPUESTA
		// =================================================
		return res.status(201).json({
			ok: true,
			message:
				resultado.estado === "CONFIRMADA"
					? "Reserva confirmada correctamente."
					: "Reserva registrada y pendiente de validación del comprobante.",
			data: resultado,
		});
	} catch (error) {
		console.error("❌ ERROR CONFIRMANDO RESERVA:", error);

		return res.status(error.statusCode || 500).json({
			ok: false,
			code: error.code || "ERROR_RESERVA",
			message: error.message || "No se pudo confirmar la reserva.",
		});
	}
};

// =====================================================
// OBTENER RESERVAS DEL CLIENTE
// =====================================================

const getReservations = async (req, res) => {
	try {
		const authorization = req.headers.authorization || "";

		let token = null;

		if (authorization.startsWith("Bearer ")) {
			token = authorization.substring(7);
		}

		if (!token) {
			token = req.headers["x-cliente-token"] || null;
		}

		if (!token) {
			return res.status(401).json({
				ok: false,
				code: "CLIENTE_NO_AUTENTICADO",
				message: "El cliente no está autenticado.",
			});
		}

		const resultado = await service.getReservations({
			token,
		});

		return res.status(200).json({
			ok: true,
			data: resultado,
		});
	} catch (error) {
		console.error("❌ ERROR OBTENIENDO RESERVAS:", error);

		return res.status(error.statusCode || 500).json({
			ok: false,
			code: error.code || "ERROR_RESERVAS",
			message: error.message || "No se pudieron obtener las reservas.",
		});
	}
};

// =====================================================
// OBTENER DETALLE DE UNA RESERVA
// =====================================================

const getReservationById = async (req, res) => {
	try {
		const authorization = req.headers.authorization || "";

		let token = null;

		if (authorization.startsWith("Bearer ")) {
			token = authorization.substring(7);
		}

		if (!token) {
			token = req.headers["x-cliente-token"] || null;
		}

		if (!token) {
			return res.status(401).json({
				ok: false,
				code: "CLIENTE_NO_AUTENTICADO",
				message: "El cliente no está autenticado.",
			});
		}

		const reservaId = Number(req.params.id);

		if (!Number.isInteger(reservaId)) {
			return res.status(400).json({
				ok: false,
				code: "RESERVA_INVALIDA",
				message: "El identificador de la reserva no es válido.",
			});
		}

		const resultado = await service.getReservationById({
			token,
			reservaId,
		});

		return res.status(200).json({
			ok: true,
			data: resultado,
		});
	} catch (error) {
		console.error("❌ ERROR OBTENIENDO DETALLE RESERVA:", error);

		return res.status(error.statusCode || 500).json({
			ok: false,
			code: error.code || "ERROR_RESERVA",
			message: error.message || "No se pudo obtener el detalle de la reserva.",
		});
	}
};

const getReservationHistory = async (req, res) => {
	try {
		const authorization = req.headers.authorization || "";

		let token = null;

		if (authorization.startsWith("Bearer ")) {
			token = authorization.substring(7);
		}

		if (!token) {
			token = req.headers["x-cliente-token"] || null;
		}

		if (!token) {
			return res.status(401).json({
				ok: false,
				code: "CLIENTE_NO_AUTENTICADO",
				message: "El cliente no está autenticado.",
			});
		}

		const resultado = await service.getReservationHistory({
			token,
		});

		return res.status(200).json({
			ok: true,
			data: resultado,
		});
	} catch (error) {
		console.error("ERROR OBTENIENDO HISTORIAL:", error);

		return res.status(error.statusCode || 500).json({
			ok: false,
			code: error.code || "ERROR_HISTORIAL",
			message: error.message || "No se pudo obtener el historial.",
		});
	}
};

const cancelReservation = async (req, res) => {
	try {
		const authorization = req.headers.authorization || "";

		let token = authorization.startsWith("Bearer ")
			? authorization.substring(7)
			: null;

		if (!token) {
			token = req.headers["x-cliente-token"] || null;
		}

		if (!token) {
			return res.status(401).json({
				ok: false,
				code: "CLIENTE_NO_AUTENTICADO",
				message: "El cliente no está autenticado.",
			});
		}

		const reservaId = Number(req.params.id);

		if (!Number.isSafeInteger(reservaId) || reservaId <= 0) {
			return res.status(400).json({
				ok: false,
				code: "RESERVA_INVALIDA",
				message: "El identificador de la reserva no es válido.",
			});
		}

		const motivo =
			typeof req.body?.motivo === "string" ? req.body.motivo.trim() : null;

		const resultado = await service.cancelReservation({
			token,
			reservaId,
			motivo,
		});

		return res.status(200).json({
			ok: true,
			message: "La reserva se canceló correctamente.",
			data: resultado,
		});
	} catch (error) {
		console.error("ERROR CANCELANDO RESERVA:", error);

		return res.status(error.statusCode || 500).json({
			ok: false,
			code: error.code || "ERROR_CANCELACION",
			message: error.message || "No se pudo cancelar la reserva.",
		});
	}
};

module.exports = {
	confirmReservation,
	getReservations,
	getReservationById,

	getReservationHistory,
  cancelReservation,
};
