const repository = require("./pagoCliente.repository");

// =====================================================
// OBTENER PAGOS DEL CLIENTE
// =====================================================

const getPagosCliente = async (token) => {
  if (!token) {
    const error = new Error("Token de cliente no proporcionado");
    error.status = 401;
    throw error;
  }

  const cliente = await repository.getClienteByToken(token);

  if (!cliente) {
    const error = new Error("Sesión de cliente no válida");
    error.status = 401;
    throw error;
  }

  return await repository.getPagosByClienteId(cliente.id);
};

// =====================================================
// OBTENER PAGO POR ID
// =====================================================

const getPagoClienteById = async (token, pagoId) => {
  if (!token) {
    const error = new Error("Token de cliente no proporcionado");
    error.status = 401;
    throw error;
  }

  const id = Number(pagoId);

  if (!Number.isInteger(id) || id <= 0) {
    const error = new Error("El ID del pago no es válido");
    error.status = 400;
    throw error;
  }

  const cliente = await repository.getClienteByToken(token);

  if (!cliente) {
    const error = new Error("Sesión de cliente no válida");
    error.status = 401;
    throw error;
  }

  const pago = await repository.getPagoByIdAndCliente(id, cliente.id);

  if (!pago) {
    const error = new Error("Pago no encontrado");
    error.status = 404;
    throw error;
  }

  return pago;
};

module.exports = {
  getPagosCliente,
  getPagoClienteById,
};
