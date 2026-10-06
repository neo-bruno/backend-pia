const repository = require("./tiponegocio.repository");

const listar = async () => {
  return await repository.listar();
};

module.exports = {
  listar,
};
