const TIPOS_ADELANTO_PERMITIDOS = ["MONTO", "PORCENTAJE"];

// ============================================================
// VALIDAR ID
// ============================================================

const validarId = (valor, nombre = "ID") => {
  const id = Number(valor);

  if (!Number.isInteger(id) || id <= 0) {
    const error = new Error(`${nombre} no es válido`);
    error.status = 400;
    throw error;
  }

  return id;
};

// ============================================================
// VALIDAR PROFESIONAL
// ============================================================

const validarProfesionalId = (profesionalId) => {
  return validarId(profesionalId, "El profesional autenticado");
};

// ============================================================
// VALIDAR SERVICIO
// ============================================================

const validarServicioId = (servicioId) => {
  return validarId(servicioId, "El ID del servicio");
};

// ============================================================
// VALIDAR CONDICIÓN
// ============================================================

const validarCondicion = (condicion) => {
  if (!condicion || typeof condicion !== "object") {
    const error = new Error("La información de la condición es obligatoria");

    error.status = 400;
    throw error;
  }

  // ----------------------------------------------------------
  // NOMBRE
  // ----------------------------------------------------------

  if (
    !condicion.nombre ||
    typeof condicion.nombre !== "string" ||
    !condicion.nombre.trim()
  ) {
    const error = new Error("El nombre de la condición es obligatorio");

    error.status = 400;
    throw error;
  }

  const nombre = condicion.nombre.trim();

  if (nombre.length > 150) {
    const error = new Error(
      "El nombre de la condición no puede superar los 150 caracteres",
    );

    error.status = 400;
    throw error;
  }

  // ----------------------------------------------------------
  // DESCRIPCIÓN
  // ----------------------------------------------------------

  if (
    condicion.descripcion !== undefined &&
    condicion.descripcion !== null &&
    typeof condicion.descripcion !== "string"
  ) {
    const error = new Error("La descripción de la condición no es válida");

    error.status = 400;
    throw error;
  }

  const descripcion = condicion.descripcion?.trim() || null;

  // ----------------------------------------------------------
  // ADELANTO
  // ----------------------------------------------------------

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

    // --------------------------------------------------------
    // MONTO
    // --------------------------------------------------------

    if (condicion.tipo_adelanto === "MONTO") {
      const monto = Number(condicion.monto_adelanto);

      if (!Number.isFinite(monto) || monto < 0) {
        const error = new Error("El monto de adelanto no es válido");

        error.status = 400;
        throw error;
      }

      montoAdelanto = Number(monto.toFixed(2));
    }

    // --------------------------------------------------------
    // PORCENTAJE
    // --------------------------------------------------------

    if (condicion.tipo_adelanto === "PORCENTAJE") {
      const porcentaje = Number(condicion.porcentaje_adelanto);

      if (!Number.isFinite(porcentaje) || porcentaje < 0 || porcentaje > 100) {
        const error = new Error(
          "El porcentaje de adelanto debe estar entre 0 y 100",
        );

        error.status = 400;
        throw error;
      }

      porcentajeAdelanto = Number(porcentaje.toFixed(2));
    }
  }

  // ----------------------------------------------------------
  // REPROGRAMACIÓN
  // ----------------------------------------------------------

  const permiteReprogramar = condicion.permite_reprogramar === true;

  let limiteHorasReprogramacion = null;

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

  // ----------------------------------------------------------
  // CANCELACIÓN
  // ----------------------------------------------------------

  const permiteCancelar = condicion.permite_cancelar === true;

  let limiteHorasCancelacion = null;

  if (permiteCancelar) {
    const limite = Number(condicion.limite_horas_cancelacion);

    if (!Number.isInteger(limite) || limite < 0) {
      const error = new Error("El límite de horas para cancelar no es válido");

      error.status = 400;
      throw error;
    }

    limiteHorasCancelacion = limite;
  }

  // ----------------------------------------------------------
  // RESULTADO
  // ----------------------------------------------------------

  return {
    nombre,
    descripcion,

    requiere_adelanto: requiereAdelanto,

    monto_adelanto: montoAdelanto,

    porcentaje_adelanto: porcentajeAdelanto,

    permite_reprogramar: permiteReprogramar,

    permite_cancelar: permiteCancelar,

    limite_horas_reprogramacion: limiteHorasReprogramacion,

    limite_horas_cancelacion: limiteHorasCancelacion,
  };
};

module.exports = {
  validarId,
  validarProfesionalId,
  validarServicioId,
  validarCondicion,
};
