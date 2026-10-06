const service = require("./notificacionAdmin.service");

// ============================================================
// OBTENER TODAS
// ============================================================

exports.getNotificaciones = async (req, res) => {
  try {
    const usuarioId = req.usuario?.usuario_id;

    if (!usuarioId) {
      return res.status(401).json({
        ok: false,
        message: "Usuario no autenticado",
      });
    }

    const data = await service.obtenerNotificaciones(usuarioId);

    return res.status(200).json({
      ok: true,
      data,
    });
  } catch (error) {
    console.error("Error getNotificacionesAdmin:", error);

    return res.status(error.statusCode || 500).json({
      ok: false,
      message: error.message || "Error al obtener las notificaciones",
    });
  }
};

// ============================================================
// OBTENER NO LEÍDAS
// ============================================================

exports.getNotificacionesNoLeidas = async (req, res) => {
  try {
    const usuarioId = req.usuario?.usuario_id;
    console.log(usuarioId)
    if (!usuarioId) {
      return res.status(401).json({
        ok: false,
        message: "Usuario no autenticado",
      });
    }

    const data = await service.obtenerNotificacionesNoLeidas(usuarioId);

    return res.status(200).json({
      ok: true,
      data,
      cantidad: data.length,
    });
  } catch (error) {
    console.error("Error getNotificacionesNoLeidasAdmin:", error);

    return res.status(error.statusCode || 500).json({
      ok: false,
      message: error.message || "Error al obtener las notificaciones no leídas",
    });
  }
};

// ============================================================
// OBTENER POR ID
// ============================================================

exports.getNotificacionById = async (req, res) => {
  try {
    const usuarioId = req.usuario?.usuario_id;
    const notificacionId = Number(req.params.id);

    if (!usuarioId) {
      return res.status(401).json({
        ok: false,
        message: "Usuario no autenticado",
      });
    }

    if (!Number.isInteger(notificacionId)) {
      return res.status(400).json({
        ok: false,
        message: "ID de notificación inválido",
      });
    }

    const data = await service.obtenerNotificacionPorId(
      usuarioId,
      notificacionId,
    );

    return res.status(200).json({
      ok: true,
      data,
    });
  } catch (error) {
    console.error("Error getNotificacionByIdAdmin:", error);

    return res.status(error.statusCode || 500).json({
      ok: false,
      message: error.message || "Error al obtener la notificación",
    });
  }
};

// ============================================================
// MARCAR COMO LEÍDA
// ============================================================

exports.marcarComoLeida = async (req, res) => {
  try {
    const usuarioId = req.usuario?.usuario_id;
    const notificacionId = Number(req.params.id);

    if (!usuarioId) {
      return res.status(401).json({
        ok: false,
        message: "Usuario no autenticado",
      });
    }

    if (!Number.isInteger(notificacionId)) {
      return res.status(400).json({
        ok: false,
        message: "ID de notificación inválido",
      });
    }

    const data = await service.marcarComoLeida(usuarioId, notificacionId);

    return res.status(200).json({
      ok: true,
      message: "Notificación marcada como leída",
      data,
    });
  } catch (error) {
    console.error("Error marcarComoLeidaAdmin:", error);

    return res.status(error.statusCode || 500).json({
      ok: false,
      message: error.message || "Error al marcar la notificación como leída",
    });
  }
};

// ============================================================
// MARCAR TODAS COMO LEÍDAS
// ============================================================

exports.marcarTodasComoLeidas = async (req, res) => {
  try {
    const usuarioId = req.usuario?.usuario_id;

    if (!usuarioId) {
      return res.status(401).json({
        ok: false,
        message: "Usuario no autenticado",
      });
    }

    const resultado = await service.marcarTodasComoLeidas(usuarioId);

    return res.status(200).json({
      ok: true,
      message: "Todas las notificaciones fueron marcadas como leídas",
      cantidad: resultado.cantidad,
    });
  } catch (error) {
    console.error("Error marcarTodasComoLeidasAdmin:", error);

    return res.status(error.statusCode || 500).json({
      ok: false,
      message:
        error.message || "Error al marcar las notificaciones como leídas",
    });
  }
};
