const IA_PERMISSIONS = require("../security/ia-permissions");

const consultarReservaTool = {
  name: "consultarReserva",

  description: "Consulta las reservas del cliente actual.",

  type: "query",

  permission: IA_PERMISSIONS.RESERVAS_READ,

  parameters: {
    type: "object",

    properties: {},

    required: [],
  },

  async execute(args = {}, context = {}) {
    throw new Error("consultarReserva todavía no está implementada.");
  },
};

module.exports = consultarReservaTool;
