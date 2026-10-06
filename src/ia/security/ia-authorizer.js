const IA_IDENTITY = require("./ia-identity");

const PERMISOS_PIA = new Set([
  "SERVICIOS.READ",
  "PROFESIONALES.READ",
  "DISPONIBILIDAD.READ",
  "RESERVAS.READ",
  "NEGOCIOS.READ",

  "RESERVAS.CREATE",
  "RESERVAS.CANCEL",
  "RESERVAS.RESCHEDULE",

  "CLIENTE.UPDATE",
]);

function tienePermiso(permission, context = {}) {
  if (!permission) {
    return true;
  }

  const agent = context.agent;

  if (!agent) {
    return false;
  }

  if (agent.id !== IA_IDENTITY.id) {
    return false;
  }

  return PERMISOS_PIA.has(permission);
}

function autorizar(permission, context = {}) {
  if (!tienePermiso(permission, context)) {
    throw new Error(`PIA no tiene permiso para ejecutar: ${permission}`);
  }

  return true;
}

module.exports = {
  tienePermiso,
  autorizar,
};
