const serviciosQuery = require("../queries/servicios.query");
const IA_PERMISSIONS = require("../security/ia-permissions");

const buscarServiciosTool = {
  name: "buscarServicios",

  description: "Busca los servicios disponibles en un negocio.",

  type: "query",

  permission: IA_PERMISSIONS.SERVICIOS_READ,

  parameters: {
    type: "object",

    properties: {
      negocio_id: {
        type: "integer",
        description: "Identificador del negocio.",
      },
    },

    required: [],
  },

  async execute(args = {}, context = {}) {
    const negocioId = context.negocio?.id || args.negocio_id;

    if (!negocioId) {
      throw new Error("No se pudo determinar el negocio.");
    }

    return await serviciosQuery.buscarServicios(negocioId);
  },
};

module.exports = buscarServiciosTool;
