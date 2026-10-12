const repository = require("./tipocalificacion.repository");

// ============================================
// UTILIDADES
// ============================================
const lanzarError = (mensaje, status = 400) => {
  const error = new Error(mensaje);
  error.status = status;
  throw error;
};

const validarId = (valor) => {
  const id = Number(valor);

  if (!Number.isInteger(id) || id <= 0) {
    lanzarError("El ID del tipo de calificación no es válido");
  }

  return id;
};

const validarTexto = (valor, campo, maximo, obligatorio = true) => {
  if (valor === undefined || valor === null) {
    if (obligatorio) {
      lanzarError(`El campo ${campo} es obligatorio`);
    }

    return null;
  }

  if (typeof valor !== "string") {
    lanzarError(`El campo ${campo} debe ser texto`);
  }

  const texto = valor.trim();

  if (obligatorio && !texto) {
    lanzarError(`El campo ${campo} es obligatorio`);
  }

  if (texto.length > maximo) {
    lanzarError(`El campo ${campo} no puede superar ${maximo} caracteres`);
  }

  return texto || null;
};

const validarObjetivo = (objetivo) => {
  const objetivosPermitidos = ["PROFESIONAL", "SERVICIO", "NEGOCIO", "PIA"];

  if (!objetivosPermitidos.includes(objetivo)) {
    lanzarError("El objetivo debe ser PROFESIONAL, SERVICIO, NEGOCIO o PIA");
  }

  return objetivo;
};

const validarEstado = (estado) => {
  const estadosPermitidos = ["ACTIVO", "INACTIVO"];

  if (!estadosPermitidos.includes(estado)) {
    lanzarError("El estado debe ser ACTIVO o INACTIVO");
  }

  return estado;
};

// ============================================
// LISTAR TIPOS DE CALIFICACIÓN
// ============================================
exports.getTiposCalificacion = async (filtros = {}) => {
  const filtrosValidos = {};

  if (filtros.objetivo) {
    filtrosValidos.objetivo = validarObjetivo(filtros.objetivo);
  }

  if (filtros.estado) {
    filtrosValidos.estado = validarEstado(filtros.estado);
  }

  if (filtros.buscar !== undefined) {
    if (typeof filtros.buscar !== "string") {
      lanzarError("El parámetro de búsqueda no es válido");
    }

    filtrosValidos.buscar = filtros.buscar.trim() || null;
  }

  return await repository.getTiposCalificacion(filtrosValidos);
};

// ============================================
// OBTENER TIPO POR ID
// ============================================
exports.getTipoCalificacionById = async (tipoId) => {
  const id = validarId(tipoId);

  const tipo = await repository.getTipoCalificacionById(id);

  if (!tipo) {
    lanzarError("Tipo de calificación no encontrado", 404);
  }

  return tipo;
};

// ============================================
// CREAR TIPO DE CALIFICACIÓN
// ============================================
exports.createTipoCalificacion = async (datos = {}) => {
  const codigo = validarTexto(datos.codigo, "código", 50);

  const tipo = validarTexto(datos.tipo, "nombre", 150);

  const descripcion = validarTexto(
    datos.descripcion,
    "descripción",
    1000,
    false,
  );

  const objetivo = validarObjetivo(datos.objetivo);

  const estado =
    datos.estado === undefined ? "ACTIVO" : validarEstado(datos.estado);

  const codigoNormalizado = codigo.toUpperCase();

  const existente = await repository.getTipoCalificacionByCodigo(
    codigoNormalizado,
    objetivo,
  );

  if (existente) {
    lanzarError(
      "Ya existe un tipo de calificación con ese código para el objetivo seleccionado",
      409,
    );
  }

  try {
    return await repository.createTipoCalificacion({
      codigo: codigoNormalizado,
      tipo,
      descripcion,
      objetivo,
      estado,
    });
  } catch (error) {
    if (error.code === "23505") {
      lanzarError(
        "Ya existe un tipo de calificación con ese código para el objetivo seleccionado",
        409,
      );
    }

    throw error;
  }
};

// ============================================
// EDITAR TIPO DE CALIFICACIÓN
// ============================================
exports.updateTipoCalificacion = async (tipoId, datos = {}) => {
  const id = validarId(tipoId);

  const existente = await repository.getTipoCalificacionById(id);

  if (!existente) {
    lanzarError("Tipo de calificación no encontrado", 404);
  }

  const codigo = validarTexto(datos.codigo, "código", 50);

  const tipo = validarTexto(datos.tipo, "nombre", 150);

  const descripcion = validarTexto(
    datos.descripcion,
    "descripción",
    1000,
    false,
  );

  const objetivo = validarObjetivo(datos.objetivo);
  const codigoNormalizado = codigo.toUpperCase();

  const duplicado = await repository.getTipoCalificacionByCodigo(
    codigoNormalizado,
    objetivo,
    id,
  );

  if (duplicado) {
    lanzarError(
      "Ya existe otro tipo de calificación con ese código para el objetivo seleccionado",
      409,
    );
  }

  try {
    return await repository.updateTipoCalificacion(id, {
      codigo: codigoNormalizado,
      tipo,
      descripcion,
      objetivo,
    });
  } catch (error) {
    if (error.code === "23505") {
      lanzarError(
        "Ya existe otro tipo de calificación con ese código para el objetivo seleccionado",
        409,
      );
    }

    throw error;
  }
};

// ============================================
// CAMBIAR ESTADO
// ============================================
exports.updateEstadoTipoCalificacion = async (tipoId, estado) => {
  const id = validarId(tipoId);
  const estadoValidado = validarEstado(estado);

  const tipo = await repository.getTipoCalificacionById(id);

  if (!tipo) {
    lanzarError("Tipo de calificación no encontrado", 404);
  }

  return await repository.updateEstadoTipoCalificacion(id, estadoValidado);
};
