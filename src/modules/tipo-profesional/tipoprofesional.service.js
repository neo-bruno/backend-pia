const repository = require("./tipoprofesional.repository");

const listar = async () => {
  return await repository.listar();
};

module.exports = {
  listar,
};
