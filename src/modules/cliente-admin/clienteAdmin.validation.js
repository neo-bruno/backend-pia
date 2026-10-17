exports.validarClienteId = (clienteId) => {
  const id = Number(clienteId);

  if (!Number.isInteger(id) || id <= 0) {
    const error = new Error("El identificador del cliente no es válido.");
    error.statusCode = 400;
    error.code = "CLIENTE_ID_INVALIDO";
    throw error;
  }

  return id;
};

exports.validarPaginacion = (query = {}) => {
  const pagina = Number(query.pagina ?? 1);
  const limite = Number(query.limite ?? 20);

  if (!Number.isInteger(pagina) || pagina < 1) {
    const error = new Error("La página debe ser un entero mayor que cero.");
    error.statusCode = 400;
    throw error;
  }

  if (!Number.isInteger(limite) || limite < 1 || limite > 100) {
    const error = new Error("El límite debe estar entre 1 y 100.");
    error.statusCode = 400;
    throw error;
  }

  return {
    pagina,
    limite,
    busqueda: String(query.busqueda ?? "").trim(),
    segmentacionId: query.segmentacion_id
      ? Number(query.segmentacion_id)
      : null,
  };
};