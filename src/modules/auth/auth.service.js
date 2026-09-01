const repository = require("./auth.repository");

const { comparePassword } = require("../../utils/password");

const { generarToken } = require("../../utils/jwt");

const login = async (telefono, password) => {
  const usuario = await repository.buscarUsuarioPorTelefono(telefono);

  if (!usuario) {
    const error = new Error("Credenciales inválidas");
    error.status = 401;
    throw error;
  }

  if (usuario.usuario_estado !== "HABILITADO") {
    const error = new Error("El usuario se encuentra deshabilitado");
    error.status = 403;
    throw error;
  }

  const passwordCorrecta = await comparePassword(password, usuario.password);

  if (!passwordCorrecta) {
    const error = new Error("Credenciales inválidas");
    error.status = 401;
    throw error;
  }

  const payload = {
    usuario_id: usuario.usuario_id,
    persona_id: usuario.persona_id,
    rol_id: usuario.rol_id,
    rol: usuario.rol_nombre,
  };

  const token = generarToken(payload);

  return {
    token,
    usuario: {
      id: usuario.usuario_id,
      persona_id: usuario.persona_id,
      nombre: usuario.persona_nombre,
      telefono: usuario.telefono,
      rol_id: usuario.rol_id,
      rol: usuario.rol_nombre,
    },
  };
};

module.exports = {
  login,
};
