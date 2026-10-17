const pool = require("../../database/pool");
const repository = require("./clienteAdmin.repository");
const validation = require("./clienteAdmin.validation");

// =====================================================
// ERROR CONTROLADO
// =====================================================

const crearError = (mensaje, statusCode = 400, code = "ERROR_CLIENTE") => {
  const error = new Error(mensaje);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

// =====================================================
// LISTAR CLIENTES
// =====================================================

exports.getClientes = async (profesionalId, query = {}) => {
  if (!Number.isInteger(Number(profesionalId)) || Number(profesionalId) <= 0) {
    throw crearError(
      "Profesional no autenticado.",
      401,
      "PROFESIONAL_NO_AUTENTICADO",
    );
  }

  const filtros = validation.validarPaginacion(query);
  const client = await pool.connect();

  try {
    return await repository.getClientes(client, Number(profesionalId), filtros);
  } finally {
    client.release();
  }
};

// =====================================================
// VALIDAR VÍNCULO DEL CLIENTE
// =====================================================

const validarVinculoCliente = async (client, profesionalId, clienteId) => {
  const existe = await repository.existeClienteProfesional(
    client,
    profesionalId,
    clienteId,
  );

  if (!existe) {
    throw crearError(
      "El cliente no pertenece a la cartera de este profesional.",
      404,
      "CLIENTE_NO_ENCONTRADO",
    );
  }
};

// =====================================================
// HISTORIAL
// =====================================================

exports.getHistorialCliente = async (profesionalId, clienteIdParam) => {
  const clienteId = validation.validarClienteId(clienteIdParam);
  const client = await pool.connect();

  try {
    await validarVinculoCliente(client, profesionalId, clienteId);

    return await repository.getHistorialCliente(
      client,
      profesionalId,
      clienteId,
    );
  } finally {
    client.release();
  }
};

// =====================================================
// SEGMENTACIÓN
// =====================================================

exports.getSegmentacionCliente = async (profesionalId, clienteIdParam) => {
  const clienteId = validation.validarClienteId(clienteIdParam);
  const client = await pool.connect();

  try {
    await validarVinculoCliente(client, profesionalId, clienteId);

    return await repository.getSegmentacionCliente(
      client,
      profesionalId,
      clienteId,
    );
  } finally {
    client.release();
  }
};

// =====================================================
// PROMOCIONES
// =====================================================

exports.getPromocionesCliente = async (profesionalId, clienteIdParam) => {
  const clienteId = validation.validarClienteId(clienteIdParam);
  const client = await pool.connect();

  try {
    await validarVinculoCliente(client, profesionalId, clienteId);

    return await repository.getPromocionesCliente(
      client,
      profesionalId,
      clienteId,
    );
  } finally {
    client.release();
  }
};

// =====================================================
// DESCUENTOS
// =====================================================

exports.getDescuentosCliente = async (profesionalId, clienteIdParam) => {
  const clienteId = validation.validarClienteId(clienteIdParam);
  const client = await pool.connect();

  try {
    await validarVinculoCliente(client, profesionalId, clienteId);

    return await repository.getDescuentosCliente(
      client,
      profesionalId,
      clienteId,
    );
  } finally {
    client.release();
  }
};