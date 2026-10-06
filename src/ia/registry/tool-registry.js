const buscarServiciosTool = require("../tools/buscar-servicios.tool");

function crearToolRegistry() {
  return [buscarServiciosTool];
}

module.exports = {
  crearToolRegistry,
};
