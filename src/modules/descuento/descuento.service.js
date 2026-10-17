const crypto = require("crypto");
const pool = require("../../database/pool");
const repository = require("./descuento.repository");

const errorHttp = (mensaje, status = 400) => {
  const error = new Error(mensaje);
  error.status = status;
  return error;
};

const validarId = (valor, nombre) => {
  const id = Number(valor);

  if (!Number.isInteger(id) || id <= 0) {
    throw errorHttp(`${nombre} no es válido`);
  }

  return id;
};

const validarContexto = (contexto) => ({
  negocioId: validarId(contexto?.negocioId, "El negocio"),
  profesionalId: validarId(contexto?.profesionalId, "El profesional"),
});

const normalizarTexto = (valor) => {
  if (valor == null) return null;
  const texto = String(valor).trim();
  return texto || null;
};

const normalizarFecha = (valor, campo) => {
  if (valor == null || valor === "") return null;

  if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    throw errorHttp(`${campo} debe tener formato YYYY-MM-DD`);
  }

  const fecha = new Date(`${valor}T00:00:00.000Z`);

  if (
    Number.isNaN(fecha.getTime()) ||
    fecha.toISOString().slice(0, 10) !== valor
  ) {
    throw errorHttp(`${campo} no es una fecha válida`);
  }

  return valor;
};

const normalizarDatos = (body, parcial = false) => {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw errorHttp("Los datos del descuento no son válidos");
  }

  if (parcial) {
    const permitidos = [
      "titulo",
      "descripcion",
      "monto",
      "porcentaje",
      "fecha_inicio",
      "fecha_fin",
    ];

    const desconocidos = Object.keys(body).filter(
      (campo) => !permitidos.includes(campo),
    );

    if (desconocidos.length) {
      throw errorHttp(
        `No se permite modificar estos campos: ${desconocidos.join(", ")}`,
      );
    }

    const camposObligatorios = [
      "titulo",
      "descripcion",
      "monto",
      "porcentaje",
      "fecha_inicio",
      "fecha_fin",
    ];

    for (const campo of camposObligatorios) {
      if (!Object.prototype.hasOwnProperty.call(body, campo)) {
        throw errorHttp(
          `Para editar el descuento debes enviar el campo ${campo}`,
        );
      }
    }
  } else {
    const requeridos = ["titulo", "monto", "porcentaje"];

    for (const campo of requeridos) {
      if (!Object.prototype.hasOwnProperty.call(body, campo)) {
        throw errorHttp(`El campo ${campo} es obligatorio`);
      }
    }
  }
  const monto = body.monto == null || body.monto === "" ? null : Number(body.monto);
  const porcentaje = body.porcentaje == null || body.porcentaje === "" ? null : Number(body.porcentaje);

  if (
    (monto !== null && (!Number.isFinite(monto) || monto < 0)) ||
    (porcentaje !== null &&
      (!Number.isFinite(porcentaje) || porcentaje < 0 || porcentaje > 100))
  ) {
    throw errorHttp("El monto o porcentaje del descuento no es válido");
  }

  if ((monto === null) === (porcentaje === null)) {
    throw errorHttp(
      "Debes indicar un monto fijo o un porcentaje, pero no ambos",
    );
  }

  const titulo = normalizarTexto(body.titulo);

  if (!titulo) {
    throw errorHttp("El título del descuento es obligatorio");
  }

  const fecha_inicio = normalizarFecha(body.fecha_inicio, "La fecha de inicio");

  const fecha_fin = normalizarFecha(body.fecha_fin, "La fecha de fin");

  if (fecha_inicio && fecha_fin && fecha_fin < fecha_inicio) {
    throw errorHttp(
      "La fecha de fin no puede ser anterior a la fecha de inicio",
    );
  }

  return {
    titulo,
    descripcion: normalizarTexto(body.descripcion),
    monto,
    porcentaje,
    fecha_inicio,
    fecha_fin,
  };
};

const generarCodigo = () =>
  `PIA-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

const listarDescuentos = async (contexto, filtros = {}) => {
  const { negocioId, profesionalId } = validarContexto(contexto);

  const estado = filtros.estado ? String(filtros.estado).toUpperCase() : null;

  if (estado && !["ACTIVO", "INACTIVO"].includes(estado)) {
    throw errorHttp("El estado del descuento no es válido");
  }

  const client = await pool.connect();

  try {
    return await repository.listarDescuentos(client, negocioId, profesionalId, {
      estado,
      buscar: normalizarTexto(filtros.buscar),
    });
  } finally {
    client.release();
  }
};

const obtenerDescuento = async (contexto, descuentoId) => {
  const { negocioId, profesionalId } = validarContexto(contexto);
  const id = validarId(descuentoId, "El descuento");

  const client = await pool.connect();

  try {
    const descuento = await repository.obtenerDescuento(
      client,
      negocioId,
      profesionalId,
      id,
    );

    if (!descuento) {
      throw errorHttp("Descuento no encontrado", 404);
    }

    return descuento;
  } finally {
    client.release();
  }
};

const crearDescuento = async (contexto, body) => {
  const { negocioId, profesionalId } = validarContexto(contexto);
  const datos = normalizarDatos(body);

  const client = await pool.connect();

  try {
    // Reintentar si excepcionalmente se genera un código duplicado.
    for (let intento = 0; intento < 3; intento++) {
      try {
        return await repository.crearDescuento(client, {
          negocioId,
          profesionalId,
          codigo: generarCodigo(),
          ...datos,
          estado: "ACTIVO",
        });
      } catch (error) {
        if (error.code === "23505" && intento < 2) {
          continue;
        }

        if (error.code === "23505") {
          throw errorHttp(
            "No se pudo generar un código único. Intenta nuevamente",
            409,
          );
        }

        throw error;
      }
    }
  } finally {
    client.release();
  }
};

const actualizarDescuento = async (contexto, descuentoId, body) => {
  const { negocioId, profesionalId } = validarContexto(contexto);
  const id = validarId(descuentoId, "El descuento");
  const datos = normalizarDatos(body, true);

  const client = await pool.connect();

  try {
    const actualizado = await repository.actualizarDescuento(
      client,
      negocioId,
      profesionalId,
      id,
      datos,
    );

    if (!actualizado) {
      throw errorHttp("Descuento no encontrado", 404);
    }

    return actualizado;
  } finally {
    client.release();
  }
};

const cambiarEstadoDescuento = async (contexto, descuentoId, estado) => {
  const { negocioId, profesionalId } = validarContexto(contexto);
  const id = validarId(descuentoId, "El descuento");
  const nuevoEstado = String(estado || "").toUpperCase();

  if (!["ACTIVO", "INACTIVO"].includes(nuevoEstado)) {
    throw errorHttp("El estado debe ser ACTIVO o INACTIVO");
  }

  const client = await pool.connect();

  try {
    const actualizado = await repository.cambiarEstadoDescuento(
      client,
      negocioId,
      profesionalId,
      id,
      nuevoEstado,
    );

    if (!actualizado) {
      throw errorHttp("Descuento no encontrado", 404);
    }

    return actualizado;
  } finally {
    client.release();
  }
};

module.exports = {
  listarDescuentos,
  obtenerDescuento,
  crearDescuento,
  actualizarDescuento,
  cambiarEstadoDescuento,
};
