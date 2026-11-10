const crypto = require("crypto");
const fs = require("fs/promises");
const repository = require("./soporte.repository");

const {
	validarId,
	validarTokenCliente,
	validarTicket,
	validarMensaje,
	validarEstadoTicket,
} = require("./soporte.validation");

// ============================================================
// ERROR
// ============================================================

const crearError = (mensaje, status = 400, code = null) => {
	const error = new Error(mensaje);
	error.status = status;

	if (code) error.code = code;

	return error;
};

// ============================================================
// LIMPIAR ARCHIVOS FISICOS SI FALLA LA OPERACION
// ============================================================

const eliminarArchivosFisicos = async (archivos = []) => {
	for (const archivo of archivos) {
		if (!archivo?.path) continue;

		try {
			await fs.unlink(archivo.path);
		} catch (error) {
			if (error.code !== "ENOENT") {
				console.error(
					"Error eliminando archivo de soporte:",
					archivo.path,
					error,
				);
			}
		}
	}
};

// ============================================================
// GUARDAR ARCHIVOS Y RELACIONARLOS CON UN MENSAJE
// ============================================================

const guardarArchivosMensaje = async (client, mensajeId, archivos = []) => {
	const archivosGuardados = [];

	for (const archivo of archivos) {
		const archivoDB = await repository.createSupportFile(client, {
			nombre: archivo.originalname,
			url: `/uploads/soporte/${archivo.filename}`,
			mime_type: archivo.mimetype,
			tamano_bytes: archivo.size,
		});

		await repository.attachFileToMessage(client, mensajeId, archivoDB.id);

		archivosGuardados.push(archivoDB);
	}

	return archivosGuardados;
};
// ============================================================
// CLIENTE AUTENTICADO
// ============================================================

const obtenerCliente = async (token) => {
	const tokenValidado = validarTokenCliente(token);

	const cliente = await repository.getClientByToken(tokenValidado);

	if (!cliente) {
		throw crearError(
			"La sesión del cliente no es válida.",
			401,
			"CLIENTE_NO_AUTENTICADO",
		);
	}

	return cliente;
};

// ============================================================
// CATEGORIAS
// ============================================================

const getCategories = async () => {
	return repository.getCategories();
};

// ============================================================
// PREGUNTAS
// ============================================================

const getQuestions = async (categoriaId) => {
	let id = null;

	if (categoriaId !== undefined && categoriaId !== null && categoriaId !== "") {
		id = validarId(categoriaId, "categoría");
	}

	return repository.getQuestions(id);
};

const getQuestionById = async (questionId) => {
	const id = validarId(questionId, "pregunta");

	const pregunta = await repository.getQuestionById(id);

	if (!pregunta) {
		throw crearError("La pregunta no existe.", 404);
	}

	return pregunta;
};

// ============================================================
// CREAR TICKET
// ============================================================
const createTicket = async ({ token, datos, archivos = [] }) => {
	try {
		const cliente = await obtenerCliente(token);

		const ticketValidado = validarTicket(datos);

		// Verificar que la categoría esté activa.
		const categorias = await repository.getCategories();

		const categoriaExiste = categorias.some(
			(categoria) => Number(categoria.id) === ticketValidado.categoria_id,
		);

		if (!categoriaExiste) {
			throw crearError("La categoría seleccionada no está disponible.", 400);
		}

		// Si se asocia una reserva, debe pertenecer al cliente.
		if (ticketValidado.reserva_id) {
			const reserva = await repository.getClientReservation(
				cliente.id,
				ticketValidado.reserva_id,
			);

			if (!reserva) {
				throw crearError(
					"La reserva indicada no existe o no pertenece al cliente.",
					404,
				);
			}
		}

		const codigo = `PIA-${new Date().getFullYear()}-${crypto
			.randomBytes(5)
			.toString("hex")
			.toUpperCase()}`;

		return await repository.transaction(async (client) => {
			const ticket = await repository.createTicket(client, {
				...ticketValidado,
				codigo,
				cliente_id: cliente.id,
			});

			const mensaje = await repository.createMessage(client, {
				ticketId: ticket.id,
				tipoRemitente: "CLIENTE",
				clienteId: cliente.id,
				mensaje: ticketValidado.mensaje,
			});

			const archivosGuardados = await guardarArchivosMensaje(
				client,
				mensaje.id,
				archivos,
			);

			return {
				...ticket,
				mensajes: [
					{
						...mensaje,
						archivos: archivosGuardados,
					},
				],
			};
		});
	} catch (error) {
		await eliminarArchivosFisicos(archivos);
		throw error;
	}
};

// ============================================================
// LISTAR TICKETS DEL CLIENTE
// ============================================================

const getClientTickets = async ({ token }) => {
	const cliente = await obtenerCliente(token);

	return repository.getClientTickets(cliente.id);
};

// ============================================================
// DETALLE DEL TICKET DEL CLIENTE
// ============================================================

const getClientTicketById = async ({ token, ticketId }) => {
	const cliente = await obtenerCliente(token);

	const id = validarId(ticketId, "ticket");

	const ticket = await repository.getClientTicketById(cliente.id, id);

	if (!ticket) {
		throw crearError("El ticket no existe.", 404);
	}

	const mensajes = await repository.getMessagesByTicket(id);

	return {
		...ticket,
		mensajes,
	};
};

// ============================================================
// RESPONDER TICKET: CLIENTE
// ============================================================

const createClientMessage = async ({
	token,
	ticketId,
	datos,
	archivos = [],
}) => {
	try {
		const cliente = await obtenerCliente(token);

		const id = validarId(ticketId, "ticket");
		const mensajeValidado = validarMensaje(datos);

		const ticket = await repository.getClientTicketById(cliente.id, id);

		if (!ticket) {
			throw crearError("El ticket no existe.", 404);
		}

		if (ticket.estado === "CERRADO") {
			throw crearError(
				"No se pueden enviar mensajes en un ticket cerrado.",
				400,
			);
		}

		return await repository.transaction(async (client) => {
			const mensaje = await repository.createMessage(client, {
				ticketId: id,
				tipoRemitente: "CLIENTE",
				clienteId: cliente.id,
				mensaje: mensajeValidado,
			});

			const archivosGuardados = await guardarArchivosMensaje(
				client,
				mensaje.id,
				archivos,
			);

			await repository.updateTicketDate(client, id);

			return {
				...mensaje,
				archivos: archivosGuardados,
			};
		});
	} catch (error) {
		await eliminarArchivosFisicos(archivos);
		throw error;
	}
};

// ============================================================
// ADMIN: LISTAR TICKETS
// ============================================================

const getAdminTickets = async (filtros) => {
	const estado = filtros.estado || null;

	if (estado) validarEstadoTicket(estado);

	const categoriaId =
		filtros.categoria_id !== undefined && filtros.categoria_id !== ""
			? validarId(filtros.categoria_id, "categoría")
			: null;

	return repository.getAdminTickets({
		estado,
		categoriaId,
	});
};

// ============================================================
// ADMIN: DETALLE
// ============================================================

const getAdminTicketById = async (ticketId) => {
	const id = validarId(ticketId, "ticket");

	const ticket = await repository.getTicketById(id);

	if (!ticket) {
		throw crearError("El ticket no existe.", 404);
	}

	const mensajes = await repository.getMessagesByTicket(id);

	return {
		...ticket,
		mensajes,
	};
};

// ============================================================
// ADMIN: CAMBIAR ESTADO
// ============================================================

const updateTicketStatus = async (ticketId, datos) => {
	const id = validarId(ticketId, "ticket");
	const estado = validarEstadoTicket(datos?.estado);

	const ticket = await repository.updateTicketStatus(id, estado);

	if (!ticket) {
		throw crearError("El ticket no existe.", 404);
	}

	return ticket;
};

// ============================================================
// ADMIN: ASIGNAR RESPONSABLE
// ============================================================

const assignTicket = async (ticketId, datos) => {
	const id = validarId(ticketId, "ticket");
	const usuarioId = validarId(datos?.usuario_id, "usuario");

	const ticket = await repository.assignTicket(id, usuarioId);

	if (!ticket) {
		throw crearError("El ticket no existe.", 404);
	}

	return ticket;
};

// ============================================================
// ADMIN: RESPONDER TICKET
// ============================================================

const createAdminMessage = async ({ ticketId, usuarioId, datos }) => {
	const id = validarId(ticketId, "ticket");
	const usuario = validarId(usuarioId, "usuario");
	const mensajeValidado = validarMensaje(datos);
	const usuarioActivo = await repository.getActiveUserById(usuario);

	if (!usuarioActivo) {
		throw crearError("El usuario no existe o está deshabilitado.", 403);
	}

	const ticket = await repository.getTicketById(id);

	if (!ticket) {
		throw crearError("El ticket no existe.", 404);
	}

	if (ticket.estado === "CERRADO") {
		throw crearError("No se pueden enviar mensajes en un ticket cerrado.", 400);
	}

	return repository.transaction(async (client) => {
		const mensaje = await repository.createMessage(client, {
			ticketId: id,
			tipoRemitente: "SOPORTE",
			usuarioId: usuario,
			mensaje: mensajeValidado,
		});

		await repository.updateTicketDate(client, id);

		await client.query(
			`
        UPDATE soporte_ticket
        SET
          estado = 'RESPONDIDO',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $1;
      `,
			[id],
		);

		return mensaje;
	});
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
