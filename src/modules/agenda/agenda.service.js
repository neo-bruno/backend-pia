// =====================================================
// agenda.service.js
// =====================================================

const pool = require("../../database/pool");
const repository = require("./agenda.repository");

// =====================================================
// VALIDAR FECHA
// =====================================================

const esFechaValida = (fecha) => {
  if (typeof fecha !== "string") {
    return false;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return false;
  }

  const fechaObj = new Date(`${fecha}T00:00:00Z`);

  if (Number.isNaN(fechaObj.getTime())) {
    return false;
  }

  return fechaObj.toISOString().slice(0, 10) === fecha;
};

// =====================================================
// OBTENER AGENDA
// =====================================================

const getAgenda = async (profesionalId, fecha) => {
  if (!Number.isInteger(Number(profesionalId)) || Number(profesionalId) <= 0) {
    const error = new Error("El usuario no tiene un profesional asociado.");
    error.status = 401;
    throw error;
  }

  if (!esFechaValida(fecha)) {
    const error = new Error("La fecha debe tener el formato YYYY-MM-DD.");
    error.status = 400;
    throw error;
  }

  const client = await pool.connect();

  try {
    const profesionalIdNumero = Number(profesionalId);

    const negocio = await repository.getNegocioByProfesionalId(
      client,
      profesionalIdNumero,
    );

    if (!negocio) {
      const error = new Error(
        "El profesional no está asociado a un negocio activo.",
      );
      error.status = 404;
      throw error;
    }

    const rows = await repository.getAgendaByFecha(
      client,
      Number(negocio.negocio_id),
      profesionalIdNumero,
      fecha,
    );

    const profesionalesMap = new Map();

    for (const row of rows) {
      const profesionalKey = Number(row.profesional_id);

      if (!profesionalesMap.has(profesionalKey)) {
        profesionalesMap.set(profesionalKey, {
          id: profesionalKey,
          nombre: row.profesional_nombre,
          foto: row.profesional_foto,
          horarios: new Map(),
        });
      }

      const profesional = profesionalesMap.get(profesionalKey);
      const horarioKey = Number(row.horario_profesional_id);

      if (!profesional.horarios.has(horarioKey)) {
        profesional.horarios.set(horarioKey, {
          horario_profesional_id: horarioKey,
          horario_id: Number(row.horario_id),
          dia_semana: Number(row.dia_semana),
          turno: Number(row.turno),
          hora_inicio: row.horario_inicio,
          hora_fin: row.horario_fin,
          slots: [],
          reservas: new Map(),
        });
      }

      const horario = profesional.horarios.get(horarioKey);

      if (row.slot_id !== null) {
        const slotId = Number(row.slot_id);

        // La ocupación real del día sale de la reserva,
        // no de slot.estado.

        let estado = "DISPONIBLE";

        // 1. La reserva del día determina el estado visual.
        if (row.reserva_id !== null) {
          if (row.reserva_estado === "COMPLETADA") {
            estado = "COMPLETADA";
          } else {
            estado = "OCUPADO";
          }

          // 2. Bloqueo para la fecha concreta.
        } else if (row.bloqueo_id !== null && row.bloqueo_estado === "ACTIVO") {
          estado = "BLOQUEADO";

          // 3. Configuración semanal del slot.
        } else if (row.slot_estado_configuracion === "OCUPADO") {
          estado = "OCUPADO";
        } else if (row.slot_estado_configuracion === "BLOQUEADO") {
          estado = "BLOQUEADO";
        }

        horario.slots.push({
          id: slotId,
          hora_inicio: row.slot_inicio,
          hora_fin: row.slot_fin,
          duracion: Number(row.slot_duracion),
          estado,

          bloqueo:
            row.bloqueo_id !== null
              ? {
                  id: Number(row.bloqueo_id),
                  hora_inicio: row.bloqueo_hora_inicio,
                  hora_fin: row.bloqueo_hora_fin,
                  motivo: row.bloqueo_motivo,
                  estado: row.bloqueo_estado,
                }
              : null,
        });

        if (row.reserva_id !== null) {
          const reservaId = Number(row.reserva_id);

          if (!horario.reservas.has(reservaId)) {
            horario.reservas.set(reservaId, {
              id: reservaId,
              numero: Number(row.reserva_numero),
              fecha: row.reserva_fecha,
              hora_inicio: row.reserva_hora_inicio,
              hora_fin: row.reserva_hora_fin,
              estado: row.reserva_estado,
              cliente: {
                id: Number(row.cliente_id),
                nombre: row.cliente_nombre,
                telefono: row.cliente_telefono,
              },
              servicio: {
                id: Number(row.servicio_id),
                nombre: row.servicio_nombre,
                duracion:
                  row.servicio_duracion !== null
                    ? Number(row.servicio_duracion)
                    : null,
                precio:
                  row.servicio_precio !== null
                    ? Number(row.servicio_precio)
                    : null,
                imagen: row.servicio_imagen || null,
              },
              slots: [],
            });
          }

          horario.reservas.get(reservaId).slots.push({
            id: slotId,
            hora_inicio: row.slot_inicio,
            hora_fin: row.slot_fin,
            duracion: Number(row.slot_duracion),
          });
        }
      }
    }

    const profesionales = Array.from(profesionalesMap.values()).map(
      (profesional) => ({
        id: profesional.id,
        nombre: profesional.nombre,
        foto: profesional.foto,
        horarios: Array.from(profesional.horarios.values()).map((horario) => ({
          horario_profesional_id: horario.horario_profesional_id,
          horario_id: horario.horario_id,
          dia_semana: horario.dia_semana,
          turno: horario.turno,
          hora_inicio: horario.hora_inicio,
          hora_fin: horario.hora_fin,
          slots: horario.slots,
          reservas: Array.from(horario.reservas.values()),
        })),
      }),
    );

    return {
      fecha,
      negocio: {
        id: Number(negocio.negocio_id),
        nombre: negocio.negocio_nombre,
      },
      profesionales,
    };
  } finally {
    client.release();
  }
};

module.exports = {
  getAgenda,
};
