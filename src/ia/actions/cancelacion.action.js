const IA_PERMISSIONS = require("../security/ia-permissions");

const cancelacionAction = {
  name: "cancelarReserva",

  permission: IA_PERMISSIONS.RESERVAS_CANCEL,

  async execute(datos, context) {
    throw new Error("cancelarReserva todavía no está implementada.");
  },
};

module.exports = cancelacionAction;
