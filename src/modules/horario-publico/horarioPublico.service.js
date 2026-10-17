const pool = require("../../database/pool");

const repository = require("./horarioPublico.repository");

// ============================================================
// VERIFICAR SI UNA FECHA ES HOY EN BOLIVIA
// ============================================================

const esHoy = (fecha) => {
  const ahora = new Date();

  const fechaBolivia = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/La_Paz",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(ahora);

  return fecha === fechaBolivia;
};

// ============================================================
// OBTENER HORA ACTUAL EN BOLIVIA
// ============================================================

const obtenerHoraActualBolivia = () => {
  const ahora = new Date();

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/La_Paz",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(ahora);
};

// ============================================================
// ELIMINAR SLOTS CUYO INICIO YA PASÓ
// ============================================================

const filtrarHorariosPasados = (horarios, fecha) => {
  // Si no es hoy, mostramos todos
  if (!esHoy(fecha)) {
    return horarios;
  }

  const horaActual = obtenerHoraActualBolivia();

  return horarios.filter((slot) => {
    return slot.hora_inicio >= horaActual;
  });
};

// ============================================================
// CONVERTIR HH:mm:ss A MINUTOS
// ============================================================

const horaAMinutos = (hora) => {
  const [horas, minutos, segundos = 0] = hora.split(":").map(Number);

  return horas * 60 + minutos + Math.floor(segundos / 60);
};

// ============================================================
// EVALUAR DISPONIBILIDAD DEL SERVICIO
// ============================================================

const evaluarSlotsParaServicio = (horarios, duracionServicio) => {
  return horarios.map((slot, index) => {
    // --------------------------------------------------------
    // SI EL SLOT YA ESTÁ OCUPADO
    // --------------------------------------------------------

    if (
      slot.estado === "OCUPADO" ||
      slot.estado === "MI_RESERVA" ||
      slot.estado === "BLOQUEADO"
    ) {
      return {
        ...slot,
        seleccionable: false,
        slots_requeridos: null,
        slots_reserva: [],
        motivo: "SLOT_NO_DISPONIBLE",
      };
    }

    // --------------------------------------------------------
    // SLOT DE INICIO
    // --------------------------------------------------------

    const slotsReserva = [];

    let minutosAcumulados = 0;

    let slotActual = slot;

    let posicion = index;

    // --------------------------------------------------------
    // BUSCAR SLOTS CONSECUTIVOS
    // --------------------------------------------------------

    while (minutosAcumulados < duracionServicio) {
      // ----------------------------------------------
      // ¿EL SLOT ACTUAL ESTÁ DISPONIBLE?
      // ----------------------------------------------

      if (!slotActual) {
        break;
      }

      if (slotActual.estado !== "DISPONIBLE") {
        break;
      }

      // ----------------------------------------------
      // AGREGAR SLOT
      // ----------------------------------------------

      slotsReserva.push(slotActual);

      const inicio = horaAMinutos(slotActual.hora_inicio);

      const fin = horaAMinutos(slotActual.hora_fin);

      const duracionSlot = fin - inicio;

      if (duracionSlot <= 0) {
        break;
      }

      minutosAcumulados += duracionSlot;

      // ----------------------------------------------
      // ¿YA TENEMOS SUFICIENTE TIEMPO?
      // ----------------------------------------------

      if (minutosAcumulados >= duracionServicio) {
        break;
      }

      // ----------------------------------------------
      // SIGUIENTE SLOT
      // ----------------------------------------------

      const siguiente = horarios[posicion + 1];

      if (!siguiente) {
        slotActual = null;
        break;
      }

      // ----------------------------------------------
      // VERIFICAR CONTINUIDAD
      // ----------------------------------------------

      const finActual = horaAMinutos(slotActual.hora_fin);

      const inicioSiguiente = horaAMinutos(siguiente.hora_inicio);

      if (inicioSiguiente !== finActual) {
        slotActual = null;
        break;
      }

      // ----------------------------------------------
      // CONTINUAR
      // ----------------------------------------------

      posicion++;
      slotActual = siguiente;
    }

    // --------------------------------------------------------
    // RESULTADO
    // --------------------------------------------------------

    const puedeReservar =
      minutosAcumulados >= duracionServicio && slotsReserva.length > 0;

    if (!puedeReservar) {
      return {
        ...slot,

        seleccionable: false,

        slots_requeridos: null,

        slots_reserva: [],

        motivo: "NO_HAY_SLOTS_CONSECUTIVOS",
      };
    }

    return {
      ...slot,

      seleccionable: true,

      slots_requeridos: slotsReserva.length,

      slots_reserva: slotsReserva.map((item) => item.slot_id),

      hora_fin_servicio: slotsReserva[slotsReserva.length - 1].hora_fin,

      motivo: null,
    };
  });
};

// ============================================================
// OBTENER HORARIOS
// ============================================================

const getAvailableSchedule = async (
  profesionalId,
  fecha,
  clienteId = null,
  servicioId = null,
) => {
  const client = await pool.connect();

  try {
    // ========================================================
    // OBTENER SLOTS
    // ========================================================

    const rows = await repository.getScheduleByProfessional(
      client,
      profesionalId,
      fecha,
      clienteId,
    );

    if (!rows.length) {
      return null;
    }

    // ========================================================
    // PROFESIONAL
    // ========================================================

    const profesional = {
      id: Number(rows[0].profesional_id),

      nombre: rows[0].profesional_nombre,

      slug: rows[0].profesional_slug,

      foto: rows[0].profesional_foto,

      pago_qr: rows[0].profesional_pago_qr,

      // ================================================
      // EVALUACIÓN DEL PROFESIONAL
      // ================================================
      calificacion_promedio: Number(
        rows[0].profesional_calificacion_promedio || 0,
      ),

      total_resenas: Number(rows[0].profesional_total_resenas || 0),
    };

    // ========================================================
    // TRANSFORMAR SLOTS
    // ========================================================
    let horarios = rows.map((row) => {
      let estado = row.slot_estado;

      let reservaId = null;
      let clienteNombre = null;

      // ======================================================
      // RESERVA ASOCIADA AL SLOT
      // ======================================================

      if (row.reserva_id) {
        reservaId = Number(row.reserva_id);
        clienteNombre = row.reserva_cliente_nombre;

        if (row.reserva_estado === "COMPLETADA") {
          estado = "COMPLETADA";
        } else if (
          clienteId &&
          Number(row.reserva_cliente_id) === Number(clienteId)
        ) {
          estado = "MI_RESERVA";
        } else if (row.reserva_estado === "PENDIENTE") {
          estado = "PENDIENTE";
        } else {
          estado = "OCUPADO";
        }
      }

      // ======================================================
      // BLOQUEO ASOCIADO AL SLOT
      // El bloqueo tiene prioridad sobre la disponibilidad.
      // ======================================================

      if (row.bloqueo_id) {
        estado = "BLOQUEADO";

        // Un bloqueo no es una reserva de cliente.
        reservaId = null;
        clienteNombre = null;
      }

      // ======================================================
      // ESTADO BLOQUEADO DEL SLOT
      // ======================================================

      if (row.slot_estado === "BLOQUEADO") {
        estado = "BLOQUEADO";
      }

      return {
        slot_id: Number(row.slot_id),
        horario_profesional_id: Number(row.horario_profesional_id),
        horario_id: Number(row.horario_id),
        turno: row.turno,

        hora_inicio: row.slot_inicio,
        hora_fin: row.slot_fin,
        duracion: Number(row.slot_duracion),

        estado,

        reserva_id: reservaId,
        cliente_nombre: clienteNombre,

        // Información para las tarjetas públicas
        servicio_nombre: row.reserva_servicio_nombre || null,
        motivo: row.bloqueo_motivo || null,

        // Datos del bloqueo
        bloqueo_id: row.bloqueo_id ? Number(row.bloqueo_id) : null,

        bloqueo_fecha: row.bloqueo_fecha || null,
        bloqueo_hora_inicio: row.bloqueo_hora_inicio || null,
        bloqueo_hora_fin: row.bloqueo_hora_fin || null,

        seleccionable: false,
        slots_requeridos: null,
        slots_reserva: [],
        hora_fin_servicio: null,
      };
    });

    // ========================================================
    // ELIMINAR HORARIOS CUYO INICIO YA PASÓ
    // ========================================================

    horarios = filtrarHorariosPasados(horarios, fecha);

    // ========================================================
    // SERVICIO
    // ========================================================

    let servicio = null;

    if (servicioId) {
      // ======================================================
      // TENEMOS SERVICIO
      // ======================================================

      servicio = await repository.getServiceById(
        client,
        servicioId,
        profesionalId,
      );

      if (!servicio) {
        return {
          fecha,
          profesional,
          servicio: null,
          horarios,
          error_servicio: "SERVICIO_NO_ENCONTRADO",
        };
      }

      // ======================================================
      // EVALUAR SLOTS SEGÚN DURACIÓN DEL SERVICIO
      // ======================================================

      horarios = evaluarSlotsParaServicio(horarios, Number(servicio.duracion));
    } else {
      // ======================================================
      // NO TENEMOS SERVICIO TODAVÍA
      // ======================================================
      // En este punto el cliente solamente está
      // seleccionando el horario.
      //
      // Todavía NO sabemos cuánto dura el servicio.
      // Por eso NO debemos evaluar continuidad.
      // ======================================================

      horarios = horarios.map((slot) => {
        if (slot.estado !== "DISPONIBLE") {
          return {
            ...slot,
            seleccionable: false,
            slots_requeridos: null,
            slots_reserva: [],
            hora_fin_servicio: null,
          };
        }

        return {
          ...slot,

          // El horario disponible puede seleccionarse
          seleccionable: true,

          // Todavía no sabemos qué servicio elegirá
          slots_requeridos: null,

          // Por ahora solamente seleccionamos este slot
          slots_reserva: [slot.slot_id],

          // Todavía no conocemos la hora final
          // del servicio que elegirá
          hora_fin_servicio: null,

          motivo: null,
        };
      });
    }

    // ========================================================
    // RESPUESTA
    // ========================================================

    return {
      fecha,

      profesional,

      servicio: servicio
        ? {
            id: Number(servicio.id),

            nombre: servicio.nombre,

            descripcion: servicio.descripcion,

            duracion: Number(servicio.duracion),

            precio: Number(servicio.precio),

            estado: servicio.estado,
          }
        : null,

      horarios,
    };
  } finally {
    client.release();
  }
};

module.exports = {
  getAvailableSchedule,
};
