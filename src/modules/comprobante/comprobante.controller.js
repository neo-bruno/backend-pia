const service = require("./comprobante.service");

async function getVoucher(req, res) {
  try {
    const comprobantes = await service.getPendingVouchers();

    return res.status(200).json({
      ok: true,
      data: comprobantes,
    });
  } catch (error) {
    console.error("❌ ERROR GET COMPROBANTES:", error);

    return res.status(500).json({
      ok: false,
      message: error.message || "Error al obtener los comprobantes",
    });
  }
}

async function getVoucherById(req, res) {
  try {
    const { id } = req.params;

    const comprobante = await service.getVoucherById(id);

    return res.status(200).json({
      ok: true,
      data: comprobante,
    });
  } catch (error) {
    console.error("❌ ERROR GET COMPROBANTE:", error);

    const status = error.message === "El comprobante no existe" ? 404 : 500;

    return res.status(status).json({
      ok: false,
      message: error.message || "Error al obtener el comprobante",
    });
  }
}

async function validateVoucher(req, res) {
  try {
    const { id } = req.params;

    const resultado = await service.validateVoucher(id, req.body);

    return res.status(200).json({
      ok: true,
      message:
        req.body.estado === "ACEPTADO"
          ? "Comprobante aceptado correctamente"
          : "Comprobante rechazado correctamente",
      data: resultado,
    });
  } catch (error) {
    console.error("❌ ERROR VALIDANDO COMPROBANTE:", error);

    return res.status(400).json({
      ok: false,
      message: error.message || "Error al validar el comprobante",
    });
  }
}

module.exports = {
  getVoucher,
  getVoucherById,
  validateVoucher,
};
