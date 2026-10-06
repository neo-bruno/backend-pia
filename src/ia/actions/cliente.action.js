const IA_PERMISSIONS = require("../security/ia-permissions");

const clienteAction = {
  name: "actualizarCliente",

  permission: IA_PERMISSIONS.CLIENTE_UPDATE,

  async execute(datos, context) {
    throw new Error("actualizarCliente todavía no está implementada.");
  },
};

module.exports = clienteAction;
