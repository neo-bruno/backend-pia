const repository = require("./calificacion.repository");

// ============================================================
// PIA - MÓDULO CALIFICACIÓN
// Capa: service
// ============================================================

function crearError(mensaje, status = 500, codigo = "ERROR") {
  const error = new Error(mensaje);
  error.status = status;
  error.codigo = codigo;
  return error;
}

// ============================================================
// REGISTRAR CALIFICACIÓN
// ============================================================

async function registrarCalificacion({ token, datos }) {
  if (!token) {
    throw crearError(
      "El cliente no está autenticado.",
      401,
      "CLIENTE_NO_AUTENTICADO",
    );
  }

  if (
    !datos ||
    !Number.isInteger(Number(datos.reserva_id)) ||
    Number(datos.reserva_id) <= 0
  ) {
    throw crearError(
      "Debes indicar una reserva válida.",
      400,
      "RESERVA_INVALIDA",
    );
  }

  if (
    !Number.isInteger(Number(datos.evaluacion_id)) ||
    Number(datos.evaluacion_id) <= 0
  ) {
    throw crearError(
      "Debes indicar una evaluación válida.",
      400,
      "EVALUACION_INVALIDA",
    );
  }

  const puntaje = Number(datos.puntaje);

  if (
    datos.puntaje === undefined ||
    datos.puntaje === null ||
    datos.puntaje === "" ||
    !Number.isFinite(puntaje) ||
    puntaje < 0 ||
    puntaje > 5
  ) {
    throw crearError(
      "El puntaje debe estar entre 0 y 5.",
      400,
      "PUNTAJE_INVALIDO",
    );
  }

  const titulo = datos.titulo?.trim() || null;
  const observacion = datos.observacion?.trim() || null;

  if (titulo && titulo.length > 200) {
    throw crearError(
      "El título no puede superar los 200 caracteres.",
      400,
      "TITULO_INVALIDO",
    );
  }

  const cliente = await repository.getClienteByToken(token);

  if (!cliente) {
    throw crearError(
      "El token del cliente no es válido.",
      401,
      "TOKEN_INVALIDO",
    );
  }

  return repository.registrarCalificacion(Number(cliente.id), {
    reserva_id: Number(datos.reserva_id),
    evaluacion_id: Number(datos.evaluacion_id),
    puntaje,
    titulo,
    observacion,
  });
}

module.exports = {
  registrarCalificacion,
};
