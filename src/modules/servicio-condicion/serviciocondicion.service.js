const repository = require("./serviciocondicion.repository");

const {
  validarProfesionalId,
  validarServicioId,
  validarId,
  validarCondicion,
} = require("./serviciocondicion.validation");

// ============================================================
// LISTAR CONDICIONES DE UN SERVICIO
// ============================================================

const getConditionsByService = async (profesionalId, servicioId) => {
  validarProfesionalId(profesionalId);

  const idServicio = validarServicioId(servicioId);

  const servicio = await repository.getServiceByProfessional(
    profesionalId,
    idServicio,
  );

  if (!servicio) {
    const error = new Error(
      "El servicio no existe o no pertenece al profesional autenticado",
    );

    error.status = 404;
    throw error;
  }

  return repository.getConditionsByService(profesionalId, idServicio);
};

// ============================================================
// CREAR CONDICIÓN
// ============================================================

const createCondition = async (profesionalId, servicioId, datos) => {
  validarProfesionalId(profesionalId);

  const idServicio = validarServicioId(servicioId);

  const condicion = validarCondicion(datos);

  const servicio = await repository.getServiceByProfessional(
    profesionalId,
    idServicio,
  );

  if (!servicio) {
    const error = new Error(
      "El servicio no existe o no pertenece al profesional autenticado",
    );

    error.status = 404;
    throw error;
  }

  try {
    return await repository.transaction(async (client) => {
      const nuevaCondicion = await repository.createCondition(
        client,
        condicion,
      );

      const relacion = await repository.createServiceCondition(
        client,
        idServicio,
        nuevaCondicion.id,
      );

      return {
        servicio: {
          id: servicio.id,
          nombre: servicio.nombre,
        },

        condicion: nuevaCondicion,

        relacion,
      };
    });
  } catch (error) {
    // PostgreSQL UNIQUE
    if (error.code === "23505") {
      const err = new Error("Esta condición ya está asociada al servicio");

      err.status = 409;

      throw err;
    }

    throw error;
  }
};

// ============================================================
// OBTENER UNA RELACIÓN
// ============================================================

const getConditionById = async (profesionalId, relacionId) => {
  validarProfesionalId(profesionalId);

  const idRelacion = validarId(relacionId, "El ID de la relación");

  const relacion = await repository.getServiceConditionById(
    profesionalId,
    idRelacion,
  );

  if (!relacion) {
    const error = new Error(
      "La condición no existe o no pertenece al profesional autenticado",
    );

    error.status = 404;
    throw error;
  }

  return relacion;
};

// ============================================================
// ACTUALIZAR CONDICIÓN
// ============================================================

const updateCondition = async (profesionalId, relacionId, datos) => {
  validarProfesionalId(profesionalId);

  const idRelacion = validarId(relacionId, "El ID de la relación");

  const condicion = validarCondicion(datos);

  const relacion = await repository.getServiceConditionById(
    profesionalId,
    idRelacion,
  );

  if (!relacion) {
    const error = new Error(
      "La condición no existe o no pertenece al profesional autenticado",
    );

    error.status = 404;
    throw error;
  }

  return repository.transaction(async (client) => {
    const actualizada = await repository.updateCondition(
      client,
      relacion.condicion_id,
      condicion,
    );

    if (!actualizada) {
      const error = new Error("No se pudo actualizar la condición");

      error.status = 404;
      throw error;
    }

    return actualizada;
  });
};

// ============================================================
// ELIMINAR CONDICIÓN
// ============================================================

const deleteCondition = async (profesionalId, relacionId) => {
  validarProfesionalId(profesionalId);

  const idRelacion = validarId(relacionId, "El ID de la relación");

  const relacion = await repository.getServiceConditionById(
    profesionalId,
    idRelacion,
  );

  if (!relacion) {
    const error = new Error(
      "La condición no existe o no pertenece al profesional autenticado",
    );

    error.status = 404;
    throw error;
  }

  return repository.transaction(async (client) => {
    // ------------------------------------------------------
    // 1. ELIMINAR RELACIÓN
    // ------------------------------------------------------

    const eliminada = await repository.deleteServiceCondition(
      client,
      idRelacion,
    );

    if (!eliminada) {
      const error = new Error(
        "No se pudo eliminar la relación de la condición",
      );

      error.status = 404;
      throw error;
    }

    // ------------------------------------------------------
    // 2. VERIFICAR SI LA CONDICIÓN SIGUE USÁNDOSE
    // ------------------------------------------------------

    const sigueUsandose = await repository.conditionHasRelations(
      client,
      relacion.condicion_id,
    );

    // ------------------------------------------------------
    // 3. SI NADIE LA USA, ELIMINAMOS LA CONDICIÓN
    // ------------------------------------------------------

    let condicionEliminada = false;

    if (!sigueUsandose) {
      const resultado = await repository.deleteCondition(
        client,
        relacion.condicion_id,
      );

      condicionEliminada = !!resultado;
    }

    return {
      servicio_id: relacion.servicio_id,

      servicio_condicion_id: idRelacion,

      condicion_id: relacion.condicion_id,

      condicion_eliminada: condicionEliminada,
    };
  });
};

module.exports = {
  getConditionsByService,
  createCondition,
  getConditionById,
  updateCondition,
  deleteCondition,
};
