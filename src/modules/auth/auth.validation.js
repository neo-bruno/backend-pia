const validarLogin = (req) => {
  const { telefono, password } = req.body;

  if (!telefono) {
    const error = new Error("El teléfono es obligatorio");
    error.status = 400;
    throw error;
  }

  if (!password) {
    const error = new Error("La contraseña es obligatoria");
    error.status = 400;
    throw error;
  }
};

module.exports = {
  validarLogin,
};
