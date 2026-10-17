const pool = require("../../database/pool");
const repository = require("./descuentoServicio.repository");

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

const normalizarServicioIds = (servicioIds) => {
  if (!Array.isArray(servicioIds)) {
    throw errorHttp("Debes enviar una lista de servicios");
  }

  const ids = servicioIds.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw errorHttp("Cada servicio debe incluir su identificador y tipo");
    }

    const id = validarId(item.servicio_id, "El servicio");
    const tipo = String(item.tipo_descuento || "").toUpperCase();

    if (!["CLIENTE", "PUBLICO"].includes(tipo)) {
      throw errorHttp(
        `El tipo de descuento del servicio ${id} debe ser CLIENTE o PUBLICO`,
      );
    }

    return {
      servicio_id: id,
      tipo_descuento: tipo,
    };
  });

  const idsUnicos = new Set(ids.map((item) => item.servicio_id));

  if (idsUnicos.size !== ids.length) {
    throw errorHttp("No puedes enviar un mismo servicio más de una vez");
  }

  return ids;
};

/**
 * Lista todos los servicios del profesional para un descuento,
 * indicando cuáles están asociados y el tipo de cada asociación.
 */
const listarServiciosPorDescuento = async (contexto, descuentoId) => {
  const { negocioId, profesionalId } = validarContexto(contexto);
  const id = validarId(descuentoId, "El descuento");

  const client = await pool.connect();

  try {
    const descuento = await repository.obtenerDescuentoPropio(
      client,
      negocioId,
      profesionalId,
      id,
    );

    if (!descuento) {
      throw errorHttp("Descuento no encontrado", 404);
    }

    return await repository.listarServiciosPorDescuento(
      client,
      negocioId,
      profesionalId,
      id,
    );
  } finally {
    client.release();
  }
};

/**
 * Sincroniza las asociaciones del descuento.
 *
 * Los servicios recibidos quedan ACTIVO con su tipo correspondiente.
 * Las asociaciones anteriores que no se reciban quedan INACTIVO.
 * No se eliminan registros.
 */
const guardarAsociaciones = async (contexto, descuentoId, serviciosBody) => {
  const { negocioId, profesionalId } = validarContexto(contexto);
  const id = validarId(descuentoId, "El descuento");
  const servicios = normalizarServicioIds(serviciosBody);

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const descuento = await repository.obtenerDescuentoPropio(
      client,
      negocioId,
      profesionalId,
      id,
    );

    if (!descuento) {
      throw errorHttp("Descuento no encontrado", 404);
    }

    const servicioIds = servicios.map((item) => item.servicio_id);

    if (servicioIds.length > 0) {
      const serviciosPropios = await repository.obtenerServiciosPropios(
        client,
        profesionalId,
        servicioIds,
      );

      if (serviciosPropios.length !== servicioIds.length) {
        throw errorHttp(
          "Uno o más servicios no existen o no pertenecen a tu perfil",
          403,
        );
      }

      const serviciosNoHabilitados = serviciosPropios.filter(
        (servicio) => servicio.estado !== "HABILITADO",
      );

      if (serviciosNoHabilitados.length > 0) {
        throw errorHttp(
          "No puedes asignar descuentos a servicios deshabilitados",
        );
      }
    }

    // Desactivar únicamente las asociaciones que se desmarcaron.
    await repository.desactivarAsociacionesNoSeleccionadas(
      client,
      id,
      servicioIds,
    );

    // Crear o reactivar cada asociación seleccionada,
    // respetando el tipo individual de cada servicio.
    const asociaciones = [];

    for (const servicio of servicios) {
      const asociacion = await repository.guardarAsociacion(
        client,
        id,
        servicio.servicio_id,
        servicio.tipo_descuento,
      );

      asociaciones.push(asociacion);
    }

    await client.query("COMMIT");

    return {
      descuento_id: id,
      total_asociados: asociaciones.length,
      asociaciones,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  listarServiciosPorDescuento,
  guardarAsociaciones,
};
