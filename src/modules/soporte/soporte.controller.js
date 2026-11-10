const service = require("./soporte.service");

// ============================================================
// EXTRAER TOKEN CLIENTE
// ============================================================

const obtenerTokenCliente = (req) => {
	const authorization = req.headers.authorization || "";

	let token = null;

	if (authorization.startsWith("Bearer ")) {
		token = authorization.substring(7);
	}

	if (!token) {
		token = req.headers["x-cliente-token"] || null;
	}

	return token;
};

// ============================================================
// MANEJO DE ERRORES
// ============================================================

const responderError = (res, error, codigo = "ERROR_SOPORTE") => {
	console.error("ERROR SOPORTE:", error);

	return res.status(error.statusCode || error.status || 500).json({
		ok: false,
		code: error.code || codigo,
		message: error.message || "Ocurrió un error en soporte.",
	});
};

// ============================================================
// CATEGORIAS
// ============================================================

const getCategories = async (req, res) => {
	try {
		const resultado = await service.getCategories();

		return res.status(200).json({
			ok: true,
			data: resultado,
		});
	} catch (error) {
		return responderError(res, error, "ERROR_CATEGORIAS");
	}
};

// ============================================================
// PREGUNTAS
// ============================================================

const getQuestions = async (req, res) => {
	try {
		const resultado = await service.getQuestions(req.query.categoria_id);

		return res.status(200).json({
			ok: true,
			data: resultado,
		});
	} catch (error) {
		return responderError(res, error, "ERROR_PREGUNTAS");
	}
};

// ============================================================
// DETALLE PREGUNTA
// ============================================================

const getQuestionById = async (req, res) => {
	try {
		const resultado = await service.getQuestionById(req.params.id);

		return res.status(200).json({
			ok: true,
			data: resultado,
		});
	} catch (error) {
		return responderError(res, error, "ERROR_PREGUNTA");
	}
};

// ============================================================
// CREAR TICKET
// ============================================================

const createTicket = async (req, res) => {
	try {
		const token = obtenerTokenCliente(req);

		const resultado = await service.createTicket({
      token,
      datos: req.body,
      archivos: req.files || [],
    });

		return res.status(201).json({
			ok: true,
			message: "Tu consulta fue enviada correctamente.",
			data: resultado,
		});
	} catch (error) {
		return responderError(res, error, "ERROR_CREAR_TICKET");
	}
};

// ============================================================
// LISTAR TICKETS CLIENTE
// ============================================================

const getClientTickets = async (req, res) => {
	try {
		const token = obtenerTokenCliente(req);

		const resultado = await service.getClientTickets({ token });

		return res.status(200).json({
			ok: true,
			data: resultado,
		});
	} catch (error) {
		return responderError(res, error, "ERROR_TICKETS_CLIENTE");
	}
};

// ============================================================
// DETALLE TICKET CLIENTE
// ============================================================

const getClientTicketById = async (req, res) => {
	try {
		const token = obtenerTokenCliente(req);

		const resultado = await service.getClientTicketById({
			token,
			ticketId: req.params.id,
		});

		return res.status(200).json({
			ok: true,
			data: resultado,
		});
	} catch (error) {
		return responderError(res, error, "ERROR_DETALLE_TICKET");
	}
};

// ============================================================
// MENSAJE CLIENTE
// ============================================================

const createClientMessage = async (req, res) => {
	try {
		const token = obtenerTokenCliente(req);

		const resultado = await service.createClientMessage({
      token,
      ticketId: req.params.id,
      datos: req.body,
      archivos: req.files || [],
    });

		return res.status(201).json({
			ok: true,
			message: "Mensaje enviado correctamente.",
			data: resultado,
		});
	} catch (error) {
		return responderError(res, error, "ERROR_MENSAJE_CLIENTE");
	}
};

// ============================================================
// ADMIN: LISTAR TICKETS
// ============================================================

const getAdminTickets = async (req, res) => {
	try {
		const resultado = await service.getAdminTickets(req.query);

		return res.status(200).json({
			ok: true,
			data: resultado,
		});
	} catch (error) {
		return responderError(res, error, "ERROR_TICKETS_ADMIN");
	}
};

// ============================================================
// ADMIN: DETALLE TICKET
// ============================================================

const getAdminTicketById = async (req, res) => {
	try {
		const resultado = await service.getAdminTicketById(req.params.id);

		return res.status(200).json({
			ok: true,
			data: resultado,
		});
	} catch (error) {
		return responderError(res, error, "ERROR_DETALLE_TICKET_ADMIN");
	}
};

// ============================================================
// ADMIN: ACTUALIZAR ESTADO
// ============================================================

const updateTicketStatus = async (req, res) => {
	try {
		const resultado = await service.updateTicketStatus(req.params.id, req.body);

		return res.status(200).json({
			ok: true,
			message: "Estado del ticket actualizado correctamente.",
			data: resultado,
		});
	} catch (error) {
		return responderError(res, error, "ERROR_ESTADO_TICKET");
	}
};

// ============================================================
// ADMIN: ASIGNAR RESPONSABLE
// ============================================================

const assignTicket = async (req, res) => {
	try {
		const resultado = await service.assignTicket(req.params.id, req.body);

		return res.status(200).json({
			ok: true,
			message: "Responsable asignado correctamente.",
			data: resultado,
		});
	} catch (error) {
		return responderError(res, error, "ERROR_ASIGNAR_TICKET");
	}
};

// ============================================================
// ADMIN: ENVIAR RESPUESTA
// ============================================================

const createAdminMessage = async (req, res) => {
	try {
		const usuarioId = req.usuario?.usuario_id;

		if (!usuarioId) {
			const error = new Error("No se pudo identificar al usuario autenticado.");

			error.status = 403;
			throw error;
		}

		const resultado = await service.createAdminMessage({
			ticketId: req.params.id,
			usuarioId,
			datos: req.body,
		});

		return res.status(201).json({
			ok: true,
			message: "Respuesta enviada correctamente.",
			data: resultado,
		});
	} catch (error) {
		return responderError(res, error, "ERROR_RESPUESTA_SOPORTE");
	}
};

module.exports = {
	getCategories,
	getQuestions,
	getQuestionById,
	createTicket,
	getClientTickets,
	getClientTicketById,
	createClientMessage,
	getAdminTickets,
	getAdminTicketById,
	updateTicketStatus,
	assignTicket,
	createAdminMessage,
};
