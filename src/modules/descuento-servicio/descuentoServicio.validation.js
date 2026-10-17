const validarGuardarAsociaciones = (body) => {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    const error = new Error("El cuerpo de la solicitud no es válido");
    error.status = 400;
    throw error;
  }

  const permitidos = ["servicios"];
  const desconocidos = Object.keys(body).filter(
    (campo) => !permitidos.includes(campo),
  );

  if (desconocidos.length > 0) {
    const error = new Error(`Campos no permitidos: ${desconocidos.join(", ")}`);
    error.status = 400;
    throw error;
  }

  if (!Array.isArray(body.servicios)) {
    const error = new Error("Debes enviar el arreglo servicios");
    error.status = 400;
    throw error;
  }

  return body.servicios;
};

module.exports = {
  validarGuardarAsociaciones,
};
