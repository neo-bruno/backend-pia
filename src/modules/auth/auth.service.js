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

  // =====================================================
  // CONTEXTO DEL PROFESIONAL
  // =====================================================

  const puedeConfigurarNegocio =
    usuario.acceso === "ACEPTADO" &&
    usuario.profesional_negocio_estado === "HABILITADO";

  // =====================================================
  // PAYLOAD DEL TOKEN
  // =====================================================

  const payload = {
    // Usuario
    usuario_id: usuario.usuario_id,
    persona_id: usuario.persona_id,

    // Profesional
    profesional_id: usuario.profesional_id,
    profesional_estado: usuario.profesional_estado,
    profesional_estado_funciones: usuario.profesional_estado_funciones,

    // Relación profesional - negocio
    negocio_id: usuario.negocio_id,
    profesional_negocio_estado: usuario.profesional_negocio_estado,
    acceso: usuario.acceso,

    // Permisos
    puede_configurar_negocio: puedeConfigurarNegocio,

    // Rol
    rol_id: usuario.rol_id,
    rol: usuario.rol_nombre,
  };

  const token = generarToken(payload);

  return {
    token,

    usuario: {
      // Usuario
      id: usuario.usuario_id,
      persona_id: usuario.persona_id,

      // Profesional
      profesional_id: usuario.profesional_id,
      profesional_estado: usuario.profesional_estado,
      profesional_estado_funciones: usuario.profesional_estado_funciones,

      // Relación con negocio
      negocio_id: usuario.negocio_id,
      profesional_negocio_estado: usuario.profesional_negocio_estado,
      acceso: usuario.acceso,

      // Permiso
      puede_configurar_negocio: puedeConfigurarNegocio,

      // Datos básicos
      nombre: usuario.persona_nombre,
      telefono: usuario.telefono,

      // Rol
      rol_id: usuario.rol_id,
      rol: usuario.rol_nombre,
    },
  };
};

module.exports = {
  login,
};
