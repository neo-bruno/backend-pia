const pool = require("../../database/pool");

const repository = require("./notificacion.repository");

// ============================================================
// ERROR
// ============================================================

function crearError(mensaje, status = 500, codigo = "ERROR") {
  const error = new Error(mensaje);

  error.status = status;
  error.codigo = codigo;

  return error;
}

// ============================================================
// VALIDAR CLIENTE
// ============================================================

async function validarCliente(client, token) {
  if (!token) {
    throw crearError(
      "El cliente no está autenticado.",
      401,
      "CLIENTE_NO_AUTENTICADO",
    );
  }

  const cliente = await repository.getClienteByToken(client, token);

  if (!cliente) {
    throw crearError(
      "El token del cliente no es válido.",
      401,
      "TOKEN_INVALIDO",
    );
  }

  return cliente;
}

// ============================================================
// OBTENER TODAS
// ============================================================

async function getNotificaciones({ token }) {
  const client = await pool.connect();

  try {
    const cliente = await validarCliente(client, token);

    return await repository.getNotificacionesByCliente(
      client,
      Number(cliente.id),
    );
  } finally {
    client.release();
  }
}

// ============================================================
// OBTENER NO LEÍDAS
// ============================================================

async function getNotificacionesNoLeidas({ token }) {
  const client = await pool.connect();

  try {
    const cliente = await validarCliente(client, token);

    return await repository.getNotificacionesNoLeidasByCliente(
      client,
      Number(cliente.id),
    );
  } finally {
    client.release();
  }
}

// ============================================================
// OBTENER POR ID
// ============================================================

async function getNotificacionById({ token, notificacionId }) {
  const client = await pool.connect();

  try {
    const cliente = await validarCliente(client, token);

    const notificacion = await repository.getNotificacionById(
      client,
      Number(notificacionId),
      Number(cliente.id),
    );

    if (!notificacion) {
      throw crearError(
        "La notificación no existe o no pertenece al cliente.",
        404,
        "NOTIFICACION_NO_ENCONTRADA",
      );
    }

    return notificacion;
  } finally {
    client.release();
  }
}

// ============================================================
// MARCAR UNA COMO LEÍDA
// ============================================================

async function marcarComoLeida({ token, notificacionId }) {
  const client = await pool.connect();

  try {
    const cliente = await validarCliente(client, token);

    const notificacion = await repository.marcarComoLeida(
      client,
      Number(notificacionId),
      Number(cliente.id),
    );

    if (!notificacion) {
      throw crearError(
        "La notificación no existe o no pertenece al cliente.",
        404,
        "NOTIFICACION_NO_ENCONTRADA",
      );
    }

    return notificacion;
  } finally {
    client.release();
  }
}

// ============================================================
// MARCAR TODAS COMO LEÍDAS
// ============================================================

async function marcarTodasComoLeidas({ token }) {
  const client = await pool.connect();

  try {
    const cliente = await validarCliente(client, token);

    const notificaciones = await repository.marcarTodasComoLeidas(
      client,
      Number(cliente.id),
    );

    return {
      cantidad: notificaciones.length,
    };
  } finally {
    client.release();
  }
}

// ============================================================
// CREAR NOTIFICACIÓN
// ============================================================
//
// Se utilizará internamente desde otros servicios.
// ============================================================

async function crearNotificacion(client, datos) {
  if (!datos.cliente_id) {
    throw crearError(
      "El cliente es obligatorio para crear la notificación.",
      400,
      "CLIENTE_OBLIGATORIO",
    );
  }

  if (!datos.titulo) {
    throw crearError(
      "El título de la notificación es obligatorio.",
      400,
      "TITULO_OBLIGATORIO",
    );
  }

  if (!datos.mensaje) {
    throw crearError(
      "El mensaje de la notificación es obligatorio.",
      400,
      "MENSAJE_OBLIGATORIO",
    );
  }

  if (!datos.tipo) {
    throw crearError(
      "El tipo de notificación es obligatorio.",
      400,
      "TIPO_OBLIGATORIO",
    );
  }

  return repository.crearNotificacion(client, datos);
}

module.exports = {
  getNotificaciones,
  getNotificacionesNoLeidas,
  getNotificacionById,

  marcarComoLeida,
  marcarTodasComoLeidas,

  crearNotificacion,
};
