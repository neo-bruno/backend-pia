const IA_PERMISSIONS = require("../security/ia-permissions");

const reservaAction = {
  name: "crearReserva",

  permission: IA_PERMISSIONS.RESERVAS_CREATE,

  async execute(datos, context) {
    throw new Error("crearReserva todavía no está implementada.");
  },
};

module.exports = reservaAction;
