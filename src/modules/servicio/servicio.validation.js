const DURACIONES_PERMITIDAS = [30, 60, 90, 120];

const TIPOS_ADELANTO_PERMITIDOS = ["MONTO", "PORCENTAJE"];

const ESTADOS_SERVICIO_PERMITIDOS = ["HABILITADO", "DESHABILITADO"];

// ============================================================
// VALIDAR SERVICIO
// ============================================================

const validarServicio = (servicio) => {
  if (!servicio || typeof servicio !== "object") {
    const error = new Error("La información del servicio es obligatoria");

    error.status = 400;
    throw error;
  }

  if (
    !servicio.nombre ||
    typeof servicio.nombre !== "string" ||
    !servicio.nombre.trim()
  ) {
    const error = new Error("El nombre del servicio es obligatorio");

    error.status = 400;
    throw error;
  }

  if (servicio.nombre.trim().length > 150) {
    const error = new Error(
      "El nombre del servicio no puede superar los 150 caracteres",
    );

    error.status = 400;
    throw error;
  }

  if (
    servicio.descripcion !== undefined &&
    servicio.descripcion !== null &&
    typeof servicio.descripcion !== "string"
  ) {
    const error = new Error("La descripción del servicio no es válida");

    error.status = 400;
    throw error;
  }

  const duracion = Number(servicio.duracion);

  if (!DURACIONES_PERMITIDAS.includes(duracion)) {
    const error = new Error("La duración debe ser de 30, 60, 90 o 120 minutos");

    error.status = 400;
    throw error;
  }

  const precio = Number(servicio.precio);

  if (!Number.isFinite(precio) || precio < 0) {
    const error = new Error("El precio del servicio no es válido");

    error.status = 400;
    throw error;
  }

  return {
    nombre: servicio.nombre.trim(),
    descripcion: servicio.descripcion?.trim() || null,
    duracion,
    precio,
  };
};

// ============================================================
// VALIDAR CONDICIÓN
// ============================================================

const validarCondicion = (condicion) => {
  if (!condicion) {
    return null;
  }

  if (typeof condicion !== "object") {
    const error = new Error("La condición del servicio no es válida");

    error.status = 400;
    throw error;
  }

  if (
    !condicion.nombre ||
    typeof condicion.nombre !== "string" ||
    !condicion.nombre.trim()
  ) {
    const error = new Error("El nombre de la condición es obligatorio");

    error.status = 400;
    throw error;
  }

  if (condicion.nombre.trim().length > 150) {
    const error = new Error(
      "El nombre de la condición no puede superar los 150 caracteres",
    );

    error.status = 400;
    throw error;
  }

  const requiereAdelanto = condicion.requiere_adelanto === true;

  let montoAdelanto = null;
  let porcentajeAdelanto = null;

  if (requiereAdelanto) {
    if (!TIPOS_ADELANTO_PERMITIDOS.includes(condicion.tipo_adelanto)) {
      const error = new Error(
        "El tipo de adelanto debe ser MONTO o PORCENTAJE",
      );

      error.status = 400;
      throw error;
    }

    if (condicion.tipo_adelanto === "MONTO") {
      const monto = Number(condicion.monto_adelanto);

      if (!Number.isFinite(monto) || monto < 0) {
        const error = new Error("El monto de adelanto no es válido");

        error.status = 400;
        throw error;
      }

      montoAdelanto = monto;
    }

    if (condicion.tipo_adelanto === "PORCENTAJE") {
      const porcentaje = Number(condicion.porcentaje_adelanto);

      if (!Number.isFinite(porcentaje) || porcentaje < 0 || porcentaje > 100) {
        const error = new Error(
          "El porcentaje de adelanto debe estar entre 0 y 100",
        );

        error.status = 400;
        throw error;
      }

      porcentajeAdelanto = porcentaje;
    }
  }

  const permiteReprogramar = condicion.permite_reprogramar === true;

  const permiteCancelar = condicion.permite_cancelar === true;

  let limiteHorasReprogramacion = null;

  let limiteHorasCancelacion = null;

  if (permiteReprogramar) {
    const limite = Number(condicion.limite_horas_reprogramacion);

    if (!Number.isInteger(limite) || limite < 0) {
      const error = new Error(
        "El límite de horas para reprogramar no es válido",
      );

      error.status = 400;
      throw error;
    }

    limiteHorasReprogramacion = limite;
  }

  if (permiteCancelar) {
    const limite = Number(condicion.limite_horas_cancelacion);

    if (!Number.isInteger(limite) || limite < 0) {
      const error = new Error("El límite de horas para cancelar no es válido");

      error.status = 400;
      throw error;
    }

    limiteHorasCancelacion = limite;
  }

  return {
    nombre: condicion.nombre.trim(),

    descripcion: condicion.descripcion?.trim() || null,

    requiere_adelanto: requiereAdelanto,

    monto_adelanto: montoAdelanto,

    porcentaje_adelanto: porcentajeAdelanto,

    permite_reprogramar: permiteReprogramar,

    permite_cancelar: permiteCancelar,

    limite_horas_reprogramacion: limiteHorasReprogramacion,

    limite_horas_cancelacion: limiteHorasCancelacion,
  };
};

// ============================================================
// VALIDAR ARCHIVOS
// ============================================================

const validarArchivos = (fotos, videos) => {
  if (fotos.length > 5) {
    const error = new Error("El servicio puede tener máximo 5 fotos");

    error.status = 400;
    throw error;
  }

  if (videos.length > 2) {
    const error = new Error("El servicio puede tener máximo 2 videos");

    error.status = 400;
    throw error;
  }

  const fotosPermitidas = ["image/jpeg", "image/png", "image/webp"];

  const videosPermitidos = ["video/mp4", "video/webm", "video/quicktime"];

  for (const foto of fotos) {
    if (!fotosPermitidas.includes(foto.mimetype)) {
      const error = new Error(
        `El archivo ${foto.originalname} no es una imagen válida`,
      );

      error.status = 400;
      throw error;
    }
  }

  for (const video of videos) {
    if (!videosPermitidos.includes(video.mimetype)) {
      const error = new Error(
        `El archivo ${video.originalname} no es un video válido`,
      );

      error.status = 400;
      throw error;
    }
  }
};

// ============================================================
// VALIDAR PROFESIONAL
// ============================================================

const validarProfesionalId = (profesionalId) => {
  const id = Number(profesionalId);

  if (!Number.isInteger(id) || id <= 0) {
    const error = new Error("El profesional autenticado no es válido");

    error.status = 403;
    throw error;
  }

  return id;
};

// ============================================================
// VALIDAR SERVICIO ID
// ============================================================

const validarServicioId = (servicioId) => {
  const id = Number(servicioId);

  if (!Number.isInteger(id) || id <= 0) {
    const error = new Error("El ID del servicio no es válido");

    error.status = 400;
    throw error;
  }

  return id;
};

// ============================================================
// VALIDAR ESTADO
// ============================================================

const validarEstadoServicio = (estado) => {
  if (!ESTADOS_SERVICIO_PERMITIDOS.includes(estado)) {
    const error = new Error(
      "El estado del servicio debe ser HABILITADO o DESHABILITADO",
    );

    error.status = 400;
    throw error;
  }

  return estado;
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  validarServicio,
  validarCondicion,
  validarArchivos,
  validarProfesionalId,
  validarServicioId,
  validarEstadoServicio,
};
