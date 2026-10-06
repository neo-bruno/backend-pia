const service = require("./notificacion.service");

// ============================================================
// OBTENER TOKEN DEL CLIENTE
// ============================================================

function getClienteToken(req) {
  return req.headers["x-cliente-token"];
}

// ============================================================
// OBTENER TODAS
// ============================================================

async function getNotificaciones(req, res) {
  try {
    const token = getClienteToken(req);

    const notificaciones = await service.getNotificaciones({
      token,
    });

    return res.status(200).json({
      ok: true,
      data: notificaciones,
    });
  } catch (error) {
    console.error("Error getNotificaciones:", error);

    return res.status(error.status || 500).json({
      ok: false,
      mensaje: error.message || "No se pudieron obtener las notificaciones.",
      codigo: error.codigo || "ERROR_NOTIFICACIONES",
    });
  }
}

// ============================================================
// OBTENER NO LEÍDAS
// ============================================================

async function getNotificacionesNoLeidas(req, res) {
  try {
    const token = getClienteToken(req);

    const notificaciones = await service.getNotificacionesNoLeidas({
      token,
    });

    return res.status(200).json({
      ok: true,
      data: notificaciones,
      cantidad: notificaciones.length,
    });
  } catch (error) {
    console.error("Error getNotificacionesNoLeidas:", error);

    return res.status(error.status || 500).json({
      ok: false,
      mensaje:
        error.message || "No se pudieron obtener las notificaciones no leídas.",
      codigo: error.codigo || "ERROR_NOTIFICACIONES_NO_LEIDAS",
    });
  }
}

// ============================================================
// OBTENER UNA
// ============================================================

async function getNotificacionById(req, res) {
  try {
    const token = getClienteToken(req);

    const notificacion = await service.getNotificacionById({
      token,
      notificacionId: req.notificacionId,
    });

    return res.status(200).json({
      ok: true,
      data: notificacion,
    });
  } catch (error) {
    console.error("Error getNotificacionById:", error);

    return res.status(error.status || 500).json({
      ok: false,
      mensaje: error.message || "No se pudo obtener la notificación.",
      codigo: error.codigo || "ERROR_NOTIFICACION",
    });
  }
}

// ============================================================
// MARCAR UNA COMO LEÍDA
// ============================================================

async function marcarComoLeida(req, res) {
  try {
    const token = getClienteToken(req);

    const notificacion = await service.marcarComoLeida({
      token,
      notificacionId: req.notificacionId,
    });

    return res.status(200).json({
      ok: true,
      mensaje: "Notificación marcada como leída.",
      data: notificacion,
    });
  } catch (error) {
    console.error("Error marcarComoLeida:", error);

    return res.status(error.status || 500).json({
      ok: false,
      mensaje: error.message || "No se pudo marcar la notificación como leída.",
      codigo: error.codigo || "ERROR_MARCAR_LEIDA",
    });
  }
}

// ============================================================
// MARCAR TODAS COMO LEÍDAS
// ============================================================

async function marcarTodasComoLeidas(req, res) {
  try {
    const token = getClienteToken(req);

    const resultado = await service.marcarTodasComoLeidas({
      token,
    });

    return res.status(200).json({
      ok: true,
      mensaje: "Todas las notificaciones fueron marcadas como leídas.",
      data: resultado,
    });
  } catch (error) {
    console.error("Error marcarTodasComoLeidas:", error);

    return res.status(error.status || 500).json({
      ok: false,
      mensaje:
        error.message ||
        "No se pudieron marcar las notificaciones como leídas.",
      codigo: error.codigo || "ERROR_MARCAR_TODAS_LEIDAS",
    });
  }
}

module.exports = {
  getNotificaciones,
  getNotificacionesNoLeidas,
  getNotificacionById,

  marcarComoLeida,
  marcarTodasComoLeidas,
};
