
const ESTADOS_TICKET = [
  "PENDIENTE",
  "EN_REVISION",
  "RESPONDIDO",
  "CERRADO",
];

const validarId = (valor, nombre = "identificador") => {
  const id = Number(valor);

  if (!Number.isSafeInteger(id) || id <= 0) {
    const error = new Error(`El ${nombre} no es válido.`);
    error.status = 400;
    throw error;
  }

  return id;
};

const validarTokenCliente = (token) => {
  if (!token || typeof token !== "string" || !token.trim()) {
    const error = new Error("El cliente no está autenticado.");
    error.status = 401;
    error.code = "CLIENTE_NO_AUTENTICADO";
    throw error;
  }

  return token.trim();
};

const validarTicket = (datos) => {
  if (!datos || typeof datos !== "object") {
    const error = new Error("Los datos de la consulta son obligatorios.");
    error.status = 400;
    throw error;
  }

  const categoriaId = validarId(datos.categoria_id, "categoría");

  const asunto =
    typeof datos.asunto === "string" ? datos.asunto.trim() : "";

  const mensaje =
    typeof datos.mensaje === "string" ? datos.mensaje.trim() : "";

  if (!asunto || asunto.length > 200) {
    const error = new Error(
      "El asunto es obligatorio y no puede superar 200 caracteres.",
    );
    error.status = 400;
    throw error;
  }

  if (!mensaje) {
    const error = new Error("El mensaje de la consulta es obligatorio.");
    error.status = 400;
    throw error;
  }

  let reservaId = null;

  if (datos.reserva_id !== undefined && datos.reserva_id !== null && datos.reserva_id !== "") {
    reservaId = validarId(datos.reserva_id, "reserva");
  }

  return {
    categoria_id: categoriaId,
    asunto,
    mensaje,
    reserva_id: reservaId,
  };
};

const validarMensaje = (datos) => {
  const mensaje =
    typeof datos?.mensaje === "string" ? datos.mensaje.trim() : "";

  if (!mensaje) {
    const error = new Error("El mensaje es obligatorio.");
    error.status = 400;
    throw error;
  }

  return mensaje;
};

const validarEstadoTicket = (estado) => {
  if (!ESTADOS_TICKET.includes(estado)) {
    const error = new Error("El estado del ticket no es válido.");
    error.status = 400;
    throw error;
  }

  return estado;
};

module.exports = {
  ESTADOS_TICKET,
  validarId,
  validarTokenCliente,
  validarTicket,
  validarMensaje,
  validarEstadoTicket,
};
