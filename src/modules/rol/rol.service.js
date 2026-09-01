const repository = require("./rol.repository");

const listar = async () => {
  return await repository.listar();
};

const buscarPorId = async (id) => {
  const rol = await repository.buscarPorId(id);

  if (!rol) {
    const error = new Error("Rol no encontrado");
    error.status = 404;
    throw error;
  }

  return rol;
};

module.exports = {
  listar,
  buscarPorId,
};
