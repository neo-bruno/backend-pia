const repository = require("./evaluacion.repository");

// ============================================================
// PIA - MÓDULO EVALUACIÓN
// Capa: service
// ============================================================

// ============================================================
// HELPERS
// ============================================================

const lanzarError = (mensaje, status = 400) => {
  const error = new Error(mensaje);
  error.status = status;
  throw error;
};

const validarId = (valor, nombre = "ID") => {
  const id = Number(valor);

  if (!Number.isInteger(id) || id <= 0) {
    lanzarError(`${nombre} no es válido`);
  }

  return id;
};

// ============================================================
// OBTENER EVALUACIONES
// ============================================================

exports.getEvaluaciones = async (filtros = {}) => {
  const filtrosValidos = {};

  if (filtros.objetivo) {
    const objetivosPermitidos = ["PROFESIONAL", "SERVICIO", "NEGOCIO", "PIA"];

    if (!objetivosPermitidos.includes(filtros.objetivo)) {
      lanzarError("El objetivo de evaluación no es válido");
    }

    filtrosValidos.objetivo = filtros.objetivo;
  }

  if (filtros.estado) {
    const estadosPermitidos = ["HABILITADO", "DESHABILITADO"];

    if (!estadosPermitidos.includes(filtros.estado)) {
      lanzarError("El estado de evaluación no es válido");
    }

    filtrosValidos.estado = filtros.estado;
  }

  if (filtros.buscar !== undefined && typeof filtros.buscar !== "string") {
    lanzarError("El parámetro de búsqueda no es válido");
  }

  filtrosValidos.buscar = filtros.buscar?.trim() || null;

  return await repository.getEvaluaciones(filtrosValidos);
};

// ============================================================
// OBTENER UNA EVALUACIÓN POR ID
// ============================================================

exports.getEvaluacionById = async (evaluacionId) => {
  const id = validarId(evaluacionId, "El ID de la evaluación");

  const evaluacion = await repository.getEvaluacionById(id);

  if (!evaluacion) {
    lanzarError("Evaluación no encontrada", 404);
  }

  return evaluacion;
};

// ============================================================
// CREAR UNA EVALUACIÓN
// ============================================================

exports.createEvaluacion = async (tipoCalificacionId) => {
  const tipoId = validarId(
    tipoCalificacionId,
    "El ID del tipo de calificación",
  );

  // Comprobar que el tipo exista y esté activo.
  // La consulta del catálogo se realizará mediante el pool
  // para mantener las responsabilidades del repositorio.
  const tipo = await repository.getTipoCalificacionById(tipoId);

  if (!tipo) {
    lanzarError("Tipo de calificación no encontrado", 404);
  }

  if (tipo.estado !== "ACTIVO") {
    lanzarError("No se puede crear una evaluación para un tipo inactivo");
  }

  const existente = await repository.getEvaluacionByTipoCalificacionId(tipoId);

  if (existente) {
    lanzarError("Ya existe una evaluación para este tipo de calificación", 409);
  }

  try {
    return await repository.createEvaluacion(tipoId);
  } catch (error) {
    // Protección adicional frente a solicitudes simultáneas.
    if (error.code === "23505") {
      lanzarError(
        "Ya existe una evaluación para este tipo de calificación",
        409,
      );
    }

    throw error;
  }
};

// ============================================================
// CAMBIAR ESTADO DE UNA EVALUACIÓN
// ============================================================

exports.updateEstadoEvaluacion = async (evaluacionId, estado) => {
  const id = validarId(evaluacionId, "El ID de la evaluación");

  const estadosPermitidos = ["HABILITADO", "DESHABILITADO"];

  if (!estadosPermitidos.includes(estado)) {
    lanzarError("El estado debe ser HABILITADO o DESHABILITADO");
  }

  const evaluacion = await repository.getEvaluacionById(id);

  if (!evaluacion) {
    lanzarError("Evaluación no encontrada", 404);
  }

  if (estado === "HABILITADO" && evaluacion.tipo_estado !== "ACTIVO") {
    lanzarError(
      "No se puede habilitar una evaluación cuyo tipo de calificación está inactivo",
    );
  }

  return await repository.updateEstadoEvaluacion(id, estado);
};
