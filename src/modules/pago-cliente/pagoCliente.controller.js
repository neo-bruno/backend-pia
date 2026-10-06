const service = require("./pagoCliente.service");

// =====================================================
// OBTENER PAGOS DEL CLIENTE
// =====================================================

const getPagosCliente = async (req, res) => {
  try {
    const token = req.headers["x-cliente-token"];

    if (!token) {
      return res.status(401).json({
        ok: false,
        mensaje: "Token de cliente no proporcionado",
      });
    }

    const pagos = await service.getPagosCliente(token);

    return res.status(200).json({
      ok: true,
      data: pagos,
    });
  } catch (error) {
    console.error("Error al obtener pagos del cliente:", error);

    return res.status(error.status || 500).json({
      ok: false,
      mensaje: error.message || "Error al obtener los pagos",
    });
  }
};

// =====================================================
// OBTENER PAGO POR ID
// =====================================================

const getPagoClienteById = async (req, res) => {
  try {
    const token = req.headers["x-cliente-token"];

    if (!token) {
      return res.status(401).json({
        ok: false,
        mensaje: "Token de cliente no proporcionado",
      });
    }

    const { id } = req.params;

    const pago = await service.getPagoClienteById(token, id);

    return res.status(200).json({
      ok: true,
      data: pago,
    });
  } catch (error) {
    console.error("Error al obtener detalle del pago:", error);

    return res.status(error.status || 500).json({
      ok: false,
      mensaje: error.message || "Error al obtener el detalle del pago",
    });
  }
};

module.exports = {
  getPagosCliente,
  getPagoClienteById,
};
