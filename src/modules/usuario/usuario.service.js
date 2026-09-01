const repository = require("./usuario.repository");

const { hashPassword } = require("../../utils/password");

const crear = async (datos) => {
  const { nombre, telefono, sexo, fecha_nacimiento, rol_id, password } = datos;

  return await repository.ejecutarTransaccion(async (client) => {
    const usuarioExistente = await repository.buscarUsuarioPorTelefono(
      client,
      telefono,
    );

    if (usuarioExistente) {
      const error = new Error("Ya existe un usuario con ese teléfono");

      error.status = 409;

      throw error;
    }

    const personaExistente = await repository.buscarPersonaPorTelefono(
      client,
      telefono,
    );

    if (personaExistente) {
      const error = new Error("Ya existe una persona con ese teléfono");

      error.status = 409;

      throw error;
    }

    const rol = await repository.buscarRolPorId(client, rol_id);

    if (!rol) {
      const error = new Error("El rol indicado no existe");

      error.status = 404;

      throw error;
    }

    const passwordHash = await hashPassword(password);

    const persona = await repository.crearPersona(client, {
      nombre,
      telefono,
      sexo,
      fecha_nacimiento,
    });

    const usuario = await repository.crearUsuario(client, {
      persona_id: persona.id,
      rol_id,
      telefono,
      password: passwordHash,
    });

    return {
      usuario,
      persona,
      rol,
    };
  });
};

module.exports = {
  crear,
};
