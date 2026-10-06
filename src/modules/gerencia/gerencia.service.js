const repository = require("./gerencia.repository");

const getManagement = async () => {
  return await repository.getManagement();
};

module.exports = {
  getManagement,
};
