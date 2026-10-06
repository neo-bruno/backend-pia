const IA_PERMISSIONS = require("../security/ia-permissions");

const consultarDisponibilidadTool = {
  name: "consultarDisponibilidad",

  description:
    "Consulta los horarios disponibles para un servicio y profesional.",

  type: "query",

  permission: IA_PERMISSIONS.DISPONIBILIDAD_READ,

  parameters: {
    type: "object",

    properties: {
      servicio_id: {
        type: "integer",
      },

      profesional_id: {
        type: "integer",
      },

      fecha: {
        type: "string",
      },
    },

    required: [],
  },

  async execute(args = {}, context = {}) {
    throw new Error("consultarDisponibilidad todavía no está implementada.");
  },
};

module.exports = consultarDisponibilidadTool;
