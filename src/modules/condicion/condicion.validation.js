// ============================================================
// ID
// ============================================================

const validarCondicionId = (id) => {
  const condicionId = Number(id);

  if (!Number.isInteger(condicionId) || condicionId <= 0) {
    const error = new Error("El ID de la condición no es válido");

    error.status = 400;

    throw error;
  }

  return condicionId;
};

// ============================================================
// CONDICIÓN
// ============================================================

const validarCondicion = (condicion) => {
  if (!condicion || typeof condicion !== "object") {
    const error = new Error("La información de la condición es obligatoria");

    error.status = 400;

    throw error;
  }

  // ==========================================================
  // NOMBRE
  // ==========================================================

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

  // ==========================================================
  // DESCRIPCIÓN
  // ==========================================================

  if (
    condicion.descripcion !== undefined &&
    condicion.descripcion !== null &&
    typeof condicion.descripcion !== "string"
  ) {
    const error = new Error("La descripción de la condición no es válida");

    error.status = 400;

    throw error;
  }

  // ==========================================================
  // ADELANTO
  // ==========================================================

  const requiereAdelanto = condicion.requiere_adelanto === true;

  let montoAdelanto = null;
  let porcentajeAdelanto = null;

  if (requiereAdelanto) {
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

      montoAdelanto = monto;
    }

    // --------------------------------------------------------
    // PORCENTAJE
    // --------------------------------------------------------
    else if (condicion.tipo_adelanto === "PORCENTAJE") {
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

    // --------------------------------------------------------
    // TIPO NO VÁLIDO
    // --------------------------------------------------------
    else {
      const error = new Error(
        "El tipo de adelanto debe ser MONTO o PORCENTAJE",
      );

      error.status = 400;

      throw error;
    }
  }

  // ==========================================================
  // REPROGRAMACIÓN
  // ==========================================================

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

  // ==========================================================
  // CANCELACIÓN
  // ==========================================================

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

  // ==========================================================
  // RESULTADO
  // ==========================================================

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

module.exports = {
  validarCondicion,
  validarCondicionId,
};
