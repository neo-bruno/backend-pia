const IA_PERMISSIONS = require("../security/ia-permissions");

const reprogramacionAction = {
  name: "reprogramarReserva",

  permission: IA_PERMISSIONS.RESERVAS_RESCHEDULE,

  async execute(datos, context) {
    throw new Error("reprogramarReserva todavía no está implementada.");
  },
};

module.exports = reprogramacionAction;
