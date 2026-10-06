const repository = require("./notificacionAdmin.repository");

// ============================================================
// OBTENER PROFESIONAL DEL USUARIO
// ============================================================

async function obtenerProfesionalId(usuarioId) {
  const profesionalId =
    await repository.obtenerProfesionalIdPorUsuario(usuarioId);

  if (!profesionalId) {
    const error = new Error(
      "El usuario autenticado no tiene un profesional asociado",
    );

    error.statusCode = 404;

    throw error;
  }

  return profesionalId;
}

// ============================================================
// OBTENER TODAS
// ============================================================

exports.obtenerNotificaciones = async (usuarioId) => {
  const profesionalId = await obtenerProfesionalId(usuarioId);

  return repository.obtenerNotificaciones(profesionalId);
};

// ============================================================
// OBTENER NO LEÍDAS
// ============================================================

exports.obtenerNotificacionesNoLeidas = async (usuarioId) => {
  const profesionalId = await obtenerProfesionalId(usuarioId);

  return repository.obtenerNotificacionesNoLeidas(profesionalId);
};

// ============================================================
// OBTENER POR ID
// ============================================================

exports.obtenerNotificacionPorId = async (usuarioId, notificacionId) => {
  const profesionalId = await obtenerProfesionalId(usuarioId);

  const notificacion = await repository.obtenerNotificacionPorId(
    profesionalId,
    notificacionId,
  );

  if (!notificacion) {
    const error = new Error("Notificación no encontrada");

    error.statusCode = 404;

    throw error;
  }

  return notificacion;
};

// ============================================================
// MARCAR UNA COMO LEÍDA
// ============================================================

exports.marcarComoLeida = async (usuarioId, notificacionId) => {
  const profesionalId = await obtenerProfesionalId(usuarioId);

  const notificacion = await repository.marcarComoLeida(
    profesionalId,
    notificacionId,
  );

  if (!notificacion) {
    const error = new Error("Notificación no encontrada");

    error.statusCode = 404;

    throw error;
  }

  return notificacion;
};

// ============================================================
// MARCAR TODAS COMO LEÍDAS
// ============================================================

exports.marcarTodasComoLeidas = async (usuarioId) => {
  const profesionalId = await obtenerProfesionalId(usuarioId);

  const cantidad = await repository.marcarTodasComoLeidas(profesionalId);

  return {
    cantidad,
  };
};
