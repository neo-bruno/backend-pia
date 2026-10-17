const pool = require("../../database/pool");
const repository = require("./bloqueo.repository");

const crearError = (mensaje, status = 400, codigo = null) => {
  const error = new Error(mensaje);
  error.status = status;

  if (codigo) {
    error.codigo = codigo;
  }

  return error;
};

const validarId = (valor, etiqueta) => {
  const id = Number(valor);

  if (!Number.isInteger(id) || id <= 0) {
    throw crearError(`${etiqueta} no válido.`);
  }

  return id;
};

const esFechaValida = (fecha) => {
  if (typeof fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return false;
  }

  const [anio, mes, dia] = fecha.split("-").map(Number);
  const fechaObj = new Date(Date.UTC(anio, mes - 1, dia));

  return (
    fechaObj.getUTCFullYear() === anio &&
    fechaObj.getUTCMonth() === mes - 1 &&
    fechaObj.getUTCDate() === dia
  );
};

const convertirHoraAMinutos = (hora) => {
  if (typeof hora !== "string") {
    throw crearError("La hora indicada no es válida.");
  }

  const coincidencia = hora.match(/^([01]\d|2[0-3]):([0-5]\d)(?::([0-5]\d))?$/);

  if (!coincidencia) {
    throw crearError("La hora debe tener un formato válido.");
  }

  return Number(coincidencia[1]) * 60 + Number(coincidencia[2]);
};

const validarIntervalo = (horaInicio, horaFin) => {
  const inicio = convertirHoraAMinutos(horaInicio);
  const fin = convertirHoraAMinutos(horaFin);

  if (fin <= inicio) {
    throw crearError("La hora de fin debe ser posterior a la hora de inicio.");
  }
};

const validarAccesoNegocio = async (client, negocioId, profesionalId) => {
  const query = `
    SELECT id, negocio_id, profesional_id, acceso, estado
    FROM profesional_negocio
    WHERE negocio_id = $1
      AND profesional_id = $2
    LIMIT 1
  `;

  const { rows } = await client.query(query, [negocioId, profesionalId]);

  if (!rows.length) {
    throw crearError(
      "El profesional no tiene relación con este negocio.",
      403,
      "ACCESO_NEGOCIO_DENEGADO",
    );
  }

  const relacion = rows[0];

  if (relacion.estado !== "HABILITADO") {
    throw crearError(
      `Acceso no habilitado. Acceso: ${relacion.acceso}; estado: ${relacion.estado}.`,
      403,
      "ACCESO_NEGOCIO_DENEGADO",
    );
  }
};

const crearBloqueo = async (profesionalId, datos) => {
  const profesionalIdNumero = validarId(profesionalId, "El profesional");

  const negocioId = validarId(datos.negocio_id, "El negocio");

  if (!esFechaValida(datos.fecha)) {
    throw crearError("La fecha del bloqueo no es válida.");
  }

  validarIntervalo(datos.hora_inicio, datos.hora_fin);

  const motivo = String(datos.motivo || "").trim() || null;

  if (motivo && motivo.length > 255) {
    throw crearError("El motivo no puede superar los 255 caracteres.");
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await validarAccesoNegocio(client, negocioId, profesionalIdNumero);

    // Buscar los slots de la plantilla semanal que corresponden
    // al día de la semana de la fecha seleccionada.
    const slots = await repository.obtenerSlotsAfectados(
      client,
      negocioId,
      profesionalIdNumero,
      datos.fecha,
      datos.hora_inicio,
      datos.hora_fin,
    );

    if (!slots.length) {
      throw crearError(
        "No existen horarios disponibles para bloquear en ese intervalo.",
        409,
        "SIN_SLOTS_AFECTADOS",
      );
    }

    const slotsNoDisponibles = slots.filter(
      (slot) =>
        slot.slot_estado === "OCUPADO" || slot.slot_estado === "BLOQUEADO",
    );

    if (slotsNoDisponibles.length) {
      throw crearError(
        "No se puede registrar el bloqueo porque uno o más horarios no están disponibles.",
        409,
        "SLOTS_NO_DISPONIBLES",
      );
    }

    const slotsIds = slots.map((slot) => Number(slot.slot_id));

    // Verificar reservas activas en la fecha seleccionada.
    const reservasActivas = await repository.obtenerReservasActivasDeSlots(
      client,
      slotsIds,
      datos.fecha,
    );

    if (reservasActivas.length) {
      throw crearError(
        "No se puede registrar el bloqueo porque existen reservas activas en ese intervalo.",
        409,
        "RESERVAS_EN_CONFLICTO",
      );
    }

    // Verificar reservas y bloqueos activos en esa fecha.
    const relacionesActivas = await repository.obtenerSlotsConRelacionActiva(
      client,
      slotsIds,
      datos.fecha,
    );

    if (relacionesActivas.length) {
      throw crearError(
        "Uno o más horarios ya están reservados o bloqueados en esa fecha.",
        409,
        "SLOTS_CON_RELACION_ACTIVA",
      );
    }

    // Registrar el bloqueo con su fecha específica.
    const bloqueo = await repository.crearBloqueo(client, {
      negocio_id: negocioId,
      profesional_id: profesionalIdNumero,
      fecha: datos.fecha,
      hora_inicio: datos.hora_inicio,
      hora_fin: datos.hora_fin,
      motivo,
    });

    // Relacionar cada slot afectado con el bloqueo.
    for (let i = 0; i < slots.length; i++) {
      await repository.relacionarSlotConBloqueo(
        client,
        bloqueo.id,
        slots[i].slot_id,
        i + 1,
      );
    }

    await client.query("COMMIT");

    return {
      ...bloqueo,
      slots_bloqueados: slotsIds.length,
    };
  } catch (error) {
    await client.query("ROLLBACK");

    if (
      error.code === "23505" &&
      error.constraint === "uq_reserva_slot_activo"
    ) {
      throw crearError(
        "Uno de los horarios ya tiene una relación activa. Actualiza la agenda e inténtalo nuevamente.",
        409,
        "SLOT_CONFLICTO",
      );
    }

    throw error;
  } finally {
    client.release();
  }
};

const obtenerBloqueosPorFecha = async (negocioId, profesionalId, fecha) => {
  const negocioIdNumero = validarId(negocioId, "El negocio");
  const profesionalIdNumero = validarId(profesionalId, "El profesional");

  if (!esFechaValida(fecha)) {
    throw crearError("La fecha indicada no es válida.");
  }

  const client = await pool.connect();

  try {
    await validarAccesoNegocio(client, negocioIdNumero, profesionalIdNumero);

    return await repository.obtenerBloqueosPorFecha(
      client,
      negocioIdNumero,
      profesionalIdNumero,
      fecha,
    );
  } finally {
    client.release();
  }
};

const cancelarBloqueo = async (bloqueoId, negocioId, profesionalId) => {
  const bloqueoIdNumero = validarId(bloqueoId, "El bloqueo");
  const negocioIdNumero = validarId(negocioId, "El negocio");
  const profesionalIdNumero = validarId(profesionalId, "El profesional");

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await validarAccesoNegocio(client, negocioIdNumero, profesionalIdNumero);

    const bloqueo = await repository.obtenerBloqueoPorId(
      client,
      bloqueoIdNumero,
      negocioIdNumero,
      profesionalIdNumero,
    );

    if (!bloqueo) {
      throw crearError(
        "No se encontró el bloqueo indicado.",
        404,
        "BLOQUEO_NO_ENCONTRADO",
      );
    }

    if (bloqueo.estado === "CANCELADO") {
      throw crearError(
        "Este bloqueo ya fue cancelado.",
        409,
        "BLOQUEO_YA_CANCELADO",
      );
    }

    await repository.cancelarBloqueo(
      client,
      bloqueoIdNumero,
      negocioIdNumero,
      profesionalIdNumero,
    );

    // Conservar el historial y desactivar las relaciones del bloqueo.
    await repository.desactivarRelacionesDelBloqueo(client, bloqueoIdNumero);

    await client.query("COMMIT");

    return {
      ok: true,
      mensaje: "Bloqueo cancelado correctamente.",
      bloqueo_id: bloqueoIdNumero,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

module.exports = {
  crearBloqueo,
  obtenerBloqueosPorFecha,
  cancelarBloqueo,
};
