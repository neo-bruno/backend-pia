const pool = require("../../database/pool");

// ============================================================
// TRANSACCIONES
// ============================================================

const transaction = async (callback) => {
	const client = await pool.connect();

	try {
		await client.query("BEGIN");

		const resultado = await callback(client);

		await client.query("COMMIT");

		return resultado;
	} catch (error) {
		await client.query("ROLLBACK");
		throw error;
	} finally {
		client.release();
	}
};

// ============================================================
// OBTENER CLIENTE POR TOKEN
// ============================================================

const getClientByToken = async (token) => {
	const query = `
    SELECT id
    FROM cliente
    WHERE token = $1
    LIMIT 1;
  `;

	const { rows } = await pool.query(query, [token]);

	return rows[0] || null;
};

// ============================================================
// CATEGORIAS
// ============================================================

const getCategories = async () => {
	const query = `
    SELECT
      id,
      nombre,
      descripcion,
      icono,
      orden
    FROM ayuda_categoria
    WHERE estado = 'ACTIVO'
    ORDER BY orden ASC, nombre ASC;
  `;

	const { rows } = await pool.query(query);

	return rows;
};

// ============================================================
// PREGUNTAS FRECUENTES
// ============================================================

const getQuestions = async (categoriaId = null) => {
	const query = `
    SELECT
      p.id,
      p.categoria_id,
      c.nombre AS categoria,
      p.pregunta,
      p.respuesta,
      p.orden,
      p.destacada
    FROM ayuda_pregunta p
    INNER JOIN ayuda_categoria c
      ON c.id = p.categoria_id
    WHERE p.estado = 'ACTIVO'
      AND c.estado = 'ACTIVO'
      AND ($1::INTEGER IS NULL OR p.categoria_id = $1)
    ORDER BY
      p.destacada DESC,
      p.orden ASC,
      p.id ASC;
  `;

	const { rows } = await pool.query(query, [categoriaId]);

	return rows;
};

const getQuestionById = async (id) => {
	const query = `
    SELECT
      p.id,
      p.categoria_id,
      c.nombre AS categoria,
      p.pregunta,
      p.respuesta,
      p.orden,
      p.destacada
    FROM ayuda_pregunta p
    INNER JOIN ayuda_categoria c
      ON c.id = p.categoria_id
    WHERE p.id = $1
      AND p.estado = 'ACTIVO'
      AND c.estado = 'ACTIVO'
    LIMIT 1;
  `;

	const { rows } = await pool.query(query, [id]);

	return rows[0] || null;
};

// ============================================================
// CREAR TICKET
// ============================================================

const createTicket = async (client, datos) => {
	const query = `
    INSERT INTO soporte_ticket (
      codigo,
      cliente_id,
      categoria_id,
      reserva_id,
      asunto
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;

	const values = [
		datos.codigo,
		datos.cliente_id,
		datos.categoria_id,
		datos.reserva_id,
		datos.asunto,
	];

	const { rows } = await client.query(query, values);

	return rows[0];
};

// ============================================================
// CREAR MENSAJE
// ============================================================

const createMessage = async (
	client,
	{ ticketId, tipoRemitente, clienteId = null, usuarioId = null, mensaje },
) => {
	const query = `
    INSERT INTO soporte_mensaje (
      ticket_id,
      tipo_remitente,
      cliente_id,
      usuario_id,
      mensaje
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;

	const values = [ticketId, tipoRemitente, clienteId, usuarioId, mensaje];

	const { rows } = await client.query(query, values);

	return rows[0];
};

// ============================================================
// REGISTRAR ARCHIVO DE SOPORTE
// ============================================================

const createSupportFile = async (client, archivo) => {
	const query = `
		INSERT INTO archivo (
			nombre,
			url,
			tipo,
			mime_type,
			tamano_bytes
		)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING *;
	`;

	const values = [
		archivo.nombre,
		archivo.url,
		"SOPORTE",
		archivo.mime_type,
		archivo.tamano_bytes,
	];

	const { rows } = await client.query(query, values);

	return rows[0];
};

// ============================================================
// RELACIONAR ARCHIVO CON MENSAJE
// ============================================================

const attachFileToMessage = async (client, mensajeId, archivoId) => {
	const query = `
		INSERT INTO soporte_mensaje_archivo (
			mensaje_id,
			archivo_id
		)
		VALUES ($1, $2)
		RETURNING *;
	`;

	const { rows } = await client.query(query, [mensajeId, archivoId]);

	return rows[0];
};

// ============================================================
// TICKETS DEL CLIENTE
// ============================================================

const getClientTickets = async (clienteId) => {
	const query = `
    SELECT
      t.id,
      t.codigo,
      t.asunto,
      t.estado,
      t.created_at,
      t.updated_at,
      c.id AS categoria_id,
      c.nombre AS categoria,

      (
        SELECT COUNT(*)::INTEGER
        FROM soporte_mensaje sm
        WHERE sm.ticket_id = t.id
      ) AS cantidad_mensajes

    FROM soporte_ticket t

    INNER JOIN ayuda_categoria c
      ON c.id = t.categoria_id

    WHERE t.cliente_id = $1

    ORDER BY t.created_at DESC;
  `;

	const { rows } = await pool.query(query, [clienteId]);

	return rows;
};

// ============================================================
// DETALLE DE TICKET
// ============================================================

const getTicketById = async (ticketId) => {
	const query = `
    SELECT
      t.*,
      c.nombre AS categoria,
      cl.alias AS cliente_alias,
      cl.telefono AS cliente_telefono,
      r.numero AS reserva_numero

    FROM soporte_ticket t

    INNER JOIN ayuda_categoria c
      ON c.id = t.categoria_id

    INNER JOIN cliente cl
      ON cl.id = t.cliente_id

    LEFT JOIN reserva r
      ON r.id = t.reserva_id

    WHERE t.id = $1
    LIMIT 1;
  `;

	const { rows } = await pool.query(query, [ticketId]);

	return rows[0] || null;
};

const getClientTicketById = async (clienteId, ticketId) => {
	const query = `
    SELECT
      t.id,
      t.codigo,
      t.asunto,
      t.estado,
      t.reserva_id,
      t.categoria_id,
      c.nombre AS categoria,
      t.created_at,
      t.updated_at,
      t.cerrado_at

    FROM soporte_ticket t

    INNER JOIN ayuda_categoria c
      ON c.id = t.categoria_id

    WHERE t.id = $1
      AND t.cliente_id = $2
    LIMIT 1;
  `;

	const { rows } = await pool.query(query, [ticketId, clienteId]);

	return rows[0] || null;
};

// ============================================================
// MENSAJES DE TICKET
// ============================================================

const getMessagesByTicket = async (ticketId) => {
	const query = `
		SELECT
			sm.id,
			sm.ticket_id,
			sm.tipo_remitente,
			sm.cliente_id,
			sm.usuario_id,
			sm.mensaje,
			sm.created_at,

			CASE
				WHEN sm.tipo_remitente = 'CLIENTE'
					THEN COALESCE(p.nombre, cl.alias, 'Cliente')
				ELSE COALESCE(p.nombre, 'Soporte PIA')
			END AS remitente,

			COALESCE(
				(
					SELECT json_agg(
						json_build_object(
							'id', a.id,
							'nombre', a.nombre,
							'url', a.url,
							'tipo', a.tipo,
							'mime_type', a.mime_type,
							'tamano_bytes', a.tamano_bytes
						)
						ORDER BY sma.id ASC
					)
					FROM soporte_mensaje_archivo sma
					INNER JOIN archivo a
						ON a.id = sma.archivo_id
					WHERE sma.mensaje_id = sm.id
				),
				'[]'::json
			) AS archivos

		FROM soporte_mensaje sm

		LEFT JOIN cliente cl
			ON cl.id = sm.cliente_id

		LEFT JOIN persona p
			ON p.id = (
				CASE
					WHEN sm.tipo_remitente = 'CLIENTE'
						THEN cl.persona_id
					ELSE (
						SELECT u.persona_id
						FROM usuario u
						WHERE u.id = sm.usuario_id
					)
				END
			)

		WHERE sm.ticket_id = $1

		ORDER BY sm.created_at ASC, sm.id ASC;
	`;

	const { rows } = await pool.query(query, [ticketId]);

	return rows;
};

// ============================================================
// ADMIN: LISTAR TICKETS
// ============================================================

const getAdminTickets = async ({ estado = null, categoriaId = null }) => {
	const query = `
    SELECT
      t.id,
      t.codigo,
      t.asunto,
      t.estado,
      t.created_at,
      t.updated_at,
      c.nombre AS categoria,
      cl.alias AS cliente,
      cl.telefono AS cliente_telefono,
      u.id AS asignado_usuario_id,
      p.nombre AS asignado_usuario,

      (
        SELECT COUNT(*)::INTEGER
        FROM soporte_mensaje sm
        WHERE sm.ticket_id = t.id
      ) AS cantidad_mensajes

    FROM soporte_ticket t

    INNER JOIN ayuda_categoria c
      ON c.id = t.categoria_id

    INNER JOIN cliente cl
      ON cl.id = t.cliente_id

    LEFT JOIN usuario u
      ON u.id = t.asignado_usuario_id

    LEFT JOIN persona p
      ON p.id = u.persona_id

    WHERE ($1::VARCHAR IS NULL OR t.estado = $1)
      AND ($2::INTEGER IS NULL OR t.categoria_id = $2)

    ORDER BY
      CASE WHEN t.estado = 'PENDIENTE' THEN 0 ELSE 1 END,
      t.created_at ASC;
  `;

	const { rows } = await pool.query(query, [estado, categoriaId]);

	return rows;
};

// ============================================================
// ACTUALIZAR ESTADO
// ============================================================

const updateTicketStatus = async (ticketId, estado) => {
	const query = `
    UPDATE soporte_ticket
    SET
      estado = $1,
      cerrado_at = CASE
        WHEN $1 = 'CERRADO' THEN CURRENT_TIMESTAMP
        ELSE NULL
      END,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING *;
  `;

	const { rows } = await pool.query(query, [estado, ticketId]);

	return rows[0] || null;
};

// ============================================================
// ASIGNAR RESPONSABLE
// ============================================================

const assignTicket = async (ticketId, usuarioId) => {
	const query = `
    UPDATE soporte_ticket
    SET
      asignado_usuario_id = $1,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $2
    RETURNING *;
  `;

	const { rows } = await pool.query(query, [usuarioId, ticketId]);

	return rows[0] || null;
};

// ============================================================
// ACTUALIZAR FECHA DEL TICKET
// ============================================================

const updateTicketDate = async (client, ticketId) => {
	await client.query(
		`
      UPDATE soporte_ticket
      SET updated_at = CURRENT_TIMESTAMP
      WHERE id = $1;
    `,
		[ticketId],
	);
};

const getClientReservation = async (clienteId, reservaId) => {
	const query = `
    SELECT id
    FROM reserva
    WHERE id = $1
      AND cliente_id = $2
    LIMIT 1;
  `;

	const { rows } = await pool.query(query, [reservaId, clienteId]);

	return rows[0] || null;
};

const getActiveUserById = async (usuarioId) => {
	const query = `
    SELECT id
    FROM usuario
    WHERE id = $1
      AND estado = 'HABILITADO'
    LIMIT 1;
  `;

	const { rows } = await pool.query(query, [usuarioId]);

	return rows[0] || null;
};

module.exports = {
	transaction,
	getClientByToken,
	getCategories,
	getQuestions,
	getQuestionById,
	createTicket,
	createMessage,
	createSupportFile,
	attachFileToMessage,
	getClientTickets,
	getTicketById,
	getClientTicketById,
	getMessagesByTicket,
	getAdminTickets,
	updateTicketStatus,
	assignTicket,
	updateTicketDate,
	getClientReservation,
	getActiveUserById,
};
