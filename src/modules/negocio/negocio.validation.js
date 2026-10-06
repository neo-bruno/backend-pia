// modules/negocio/negocio.validation.js

function required(value, campo) {
  if (value === undefined || value === null || String(value).trim() === "") {
    throw new Error(`El campo ${campo} es obligatorio`);
  }
}

function validateRegistroNegocio(data) {
  const { negocio, profesional, membresia } = data;

  required(negocio, "negocio");
  required(profesional, "profesional");
  required(membresia, "membresia");

  // =========================
  // NEGOCIO
  // =========================

  required(negocio.tipo_negocio_id, "negocio.tipo_negocio_id");

  required(negocio.nombre, "negocio.nombre");

  required(negocio.telefono, "negocio.telefono");

  required(negocio.departamento, "negocio.departamento");

  // =========================
  // PROFESIONAL
  // =========================

  required(profesional.nombres, "profesional.nombres");

  required(profesional.apellidos, "profesional.apellidos");

  required(profesional.telefono, "profesional.telefono");

  required(profesional.sexo, "profesional.sexo");

  required(profesional.password, "profesional.password");

  required(profesional.tipo_profesional_id, "profesional.tipo_profesional_id");

  // =========================
  // MEMBRESIA
  // =========================

  required(membresia.fecha_inicio, "membresia.fecha_inicio");

  required(membresia.fecha_fin, "membresia.fecha_fin");

  required(membresia.monto, "membresia.monto");

  if (Number(membresia.monto) <= 0) {
    throw new Error("El monto de la membresía debe ser mayor a 0");
  }

  if (new Date(membresia.fecha_fin) < new Date(membresia.fecha_inicio)) {
    throw new Error("La fecha_fin no puede ser menor que fecha_inicio");
  }

  return true;
}

module.exports = {
  validateRegistroNegocio,
};
