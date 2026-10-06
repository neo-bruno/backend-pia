const validarProfesionalId = (profesionalId) => {
  const id = Number(profesionalId);

  if (!Number.isInteger(id) || id <= 0) {
    const error = new Error("El profesional_id no es válido");

    error.status = 403;

    throw error;
  }

  return id;
};

module.exports = {
  validarProfesionalId,
};
