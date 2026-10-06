function validateVerificationCode(codigo) {
  if (!codigo) {
    throw new Error("El código del negocio es obligatorio");
  }

  const codigoNormalizado = codigo.trim().toUpperCase();

  if (!codigoNormalizado) {
    throw new Error("El código del negocio es obligatorio");
  }

  return codigoNormalizado;
}

function validateRegistroProfesional(data, file) {
  if (!data) {
    throw new Error("Los datos del registro son obligatorios");
  }

  if (!data.negocioId) {
    throw new Error("El negocio es obligatorio");
  }

  if (!data.profesional) {
    throw new Error("Los datos del profesional son obligatorios");
  }

  if (!data.membresia) {
    throw new Error("Los datos de la membresía son obligatorios");
  }

  if (!file) {
    throw new Error("El comprobante de pago es obligatorio");
  }

  const profesional = data.profesional;
  const membresia = data.membresia;

  if (!profesional.nombres?.trim()) {
    throw new Error("Los nombres del profesional son obligatorios");
  }

  if (!profesional.apellidos?.trim()) {
    throw new Error("Los apellidos del profesional son obligatorios");
  }

  if (!profesional.telefono?.trim()) {
    throw new Error("El teléfono del profesional es obligatorio");
  }

  if (!profesional.sexo) {
    throw new Error("El sexo del profesional es obligatorio");
  }

  if (!profesional.password) {
    throw new Error("La contraseña es obligatoria");
  }

  if (profesional.password.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres");
  }

  if (!profesional.tipo_profesional_id) {
    throw new Error("El tipo de profesional es obligatorio");
  }

  if (!membresia.fecha_inicio) {
    throw new Error("La fecha de inicio de la membresía es obligatoria");
  }

  if (!membresia.fecha_fin) {
    throw new Error("La fecha de fin de la membresía es obligatoria");
  }

  if (
    membresia.monto === undefined ||
    membresia.monto === null ||
    Number(membresia.monto) <= 0
  ) {
    throw new Error("El monto de la membresía debe ser mayor a cero");
  }

  return true;
}

module.exports = {
  validateVerificationCode,
  validateRegistroProfesional, 
};
