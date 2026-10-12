const service = require("./comprobanteAdmin.service");

// ============================================================
// OBTENER COMPROBANTE
// ============================================================

exports.getComprobante = async (req, res) => {
  try {
    const comprobanteId = Number(req.params.id);

    if (!Number.isInteger(comprobanteId)) {
      return res.status(400).json({
        ok: false,
        message: "ID de comprobante inválido",
      });
    }

    const data = await service.obtenerComprobante(comprobanteId);

    return res.status(200).json({
      ok: true,
      data,
    });
  } catch (error) {
    console.error("Error getComprobanteAdmin:", error);

    return res.status(error.statusCode || 500).json({
      ok: false,
      message: error.message || "Error al obtener el comprobante",
    });
  }
};

// ============================================================
// CAMBIAR ESTADO
// ============================================================

exports.cambiarEstado = async (req, res) => {
  try {
    const comprobanteId = Number(req.params.id);

    if (!Number.isInteger(comprobanteId)) {
      return res.status(400).json({
        ok: false,
        message: "ID de comprobante inválido",
      });
    }

    const profesionalId = req.usuario?.profesional_id;

    if (!profesionalId) {
      return res.status(401).json({
        ok: false,
        message: "El usuario autenticado no tiene un profesional asociado",
      });
    }

    const { estado, observacion } = req.body;

    const data = await service.cambiarEstado(
      comprobanteId,
      estado,
      profesionalId,
      observacion,
    );

    if (!data) {
      return res.status(404).json({
        ok: false,
        message: "Comprobante no encontrado",
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Estado del comprobante actualizado correctamente",
      data,
    });
  } catch (error) {
    console.error("Error cambiarEstadoComprobanteAdmin:", error);

    return res.status(error.statusCode || 500).json({
      ok: false,
      message: error.message || "Error al cambiar el estado del comprobante",
    });
  }
};
