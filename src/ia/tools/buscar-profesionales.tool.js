const IA_PERMISSIONS = require("../security/ia-permissions");

const buscarProfesionalesTool = {
  name: "buscarProfesionales",

  description: "Busca los profesionales disponibles del negocio.",

  type: "query",

  permission: IA_PERMISSIONS.PROFESIONALES_READ,

  parameters: {
    type: "object",

    properties: {},
    required: [],
  },

  async execute(args = {}, context = {}) {
    throw new Error("buscarProfesionales todavía no está implementada.");
  },
};

module.exports = buscarProfesionalesTool;
