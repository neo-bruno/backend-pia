const validarCrear = (req) => {
  const { nombre, telefono, rol_id, password } = req.body;

  if (!nombre || !nombre.trim()) {
    const error = new Error("El nombre es obligatorio");

    error.status = 400;

    throw error;
  }

  if (!telefono || !telefono.trim()) {
    const error = new Error("El teléfono es obligatorio");

    error.status = 400;

    throw error;
  }

  if (!rol_id) {
    const error = new Error("El rol es obligatorio");

    error.status = 400;

    throw error;
  }

  if (!password) {
    const error = new Error("La contraseña es obligatoria");

    error.status = 400;

    throw error;
  }

  if (password.length < 6) {
    const error = new Error("La contraseña debe tener al menos 6 caracteres");

    error.status = 400;

    throw error;
  }
};

module.exports = {
  validarCrear,
};
